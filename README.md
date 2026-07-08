# Onboarding App Dashboard

Internal, read-only analytics dashboard over the FieldPulse onboarding app's Supabase. It gives the Product, customer success, implementation, and leadership teams visibility into the onboarding funnel at two levels:

- **Company summary** (the landing view): links generated, completions, completion rate, average progress, average and median time-to-complete, module drop-off, selection distribution and selection-to-completion correlation, submissions, lifecycle breakdown, trends over time with before/after comparison, and breakdowns by Salesforce dimension (Sales Segment, Industry, Number of Employees).
- **Account drill-down**: one customer's progress, final per-module selections, per-module submit results, key timestamps, and the full Salesforce profile captured at link creation (including fields never shown in the onboarding app).

It is a standalone app deployed as its own Vercel project (`fp-onboarding-dashboard`). For the initial launch it is gated behind a shared HTTP Basic Auth login; Google SSO with an email allowlist is fully implemented and can be turned on later (see [Access](#access)). It only ever reads the onboarding database.

## Links

- PRD (what / why): https://fieldpulse.atlassian.net/wiki/spaces/PM/pages/1969979602/Onboarding+App+Dashboard
- Build Spec (how): https://linear.app/fieldpulse/document/build-spec-2d8c493fbbd2
- Linear project: https://linear.app/fieldpulse/project/onboarding-app-dashboard-d437d399c791

## Stack

Next.js 16 (App Router, TypeScript strict), Tailwind v4, shadcn/ui, `postgres` (postgres.js, direct reads, no Supabase SDK), Auth.js (NextAuth v5) with a Google provider, Recharts (via shadcn charts), zod, date-fns. White theme, navy `#00034D` primary accent, Montserrat. Desktop-first.

## Data model (read-only)

The dashboard reads three tables from the onboarding Supabase (project `rqelncbqgepyardwtltc`):

- `wizard_sessions` - one row per onboarding link (`company_id`, `salesforce_data` jsonb, `current_module`, `status`, `created_at`, `submitted_at`, `expires_at`).
- `wizard_module_data` - per module per session (`module_key`, `form_data` jsonb, `is_complete`, `saved_at`).
- `import_jobs` - per-module submit results at Complete Setup (`job_type`, `status`, `error_message`, `completed_at`).

The reference migrations live under `db/reference-migrations/` (verbatim, read-only). The local test harness materializes an equivalent vanilla-Postgres schema in `db/schema.sql` and seeds a deterministic dataset in `db/seed.ts`; see `db/reference-migrations/README.md` for why the raw migrations are not applied locally.

## Local development

Prerequisites: Node 20+ and a local Postgres.

1. Install dependencies:
   ```
   npm install
   ```
2. Start a local Postgres and create a test database. Either:
   - Homebrew: `brew install postgresql@17 && brew services start postgresql@17 && createdb onboarding_dash_test`, or
   - Docker: `docker run --name onboarding-dash-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=onboarding_dash_test -p 5432:5432 -d postgres:17` (then set `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/onboarding_dash_test`).
3. Seed the local database. The vitest global setup seeds `onboarding_dash_test` before the suite, so running the tests once populates it with the sample dataset:
   ```
   npm run test
   ```
4. Copy `.env.example` to `.env.local` and fill it in. The app is gated by HTTP Basic Auth, so set a username/password and point `DATABASE_URL` at the seeded local database:
   ```
   DATABASE_URL=postgres://localhost:5432/onboarding_dash_test
   BASIC_AUTH_USER=dev
   BASIC_AUTH_PASSWORD=dev
   ```
5. Run the app:
   ```
   npm run dev
   ```

The dashboard reads live data per request, so a change to the database shows on refresh.

## Verify

```
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run test` runs against the local Postgres (never the real Supabase): the harness resolves `TEST_DATABASE_URL` (defaulting to `postgres://localhost:5432/onboarding_dash_test`), refuses any target that is not a local `*test*` database, and re-seeds it before the suite. Tests run in UTC for deterministic date bucketing.

## Access

Every route is gated by `middleware.ts`. There are two modes:

- **HTTP Basic Auth (active).** A shared username / password (`BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD`). Deny-by-default: if either is unset, no one gets in. This is the quick-launch gate for gathering feedback. It is a stopgap - a shared credential over HTTPS.
- **Google SSO + email allowlist (deferred, already implemented).** `lib/auth.ts`, the `app/api/auth/[...nextauth]` route, `lib/auth/allowlist.ts`, and the 403 page are in place but dormant. To switch, restore the Auth.js middleware in `middleware.ts` and set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `ALLOWED_EMAILS` (see the `git log` for the prior middleware, or the deferred vars in `.env.example`).

## Environment variables

`.env.example` holds placeholders. Real values live in `.env.local` (git-ignored) and in the Vercel dashboard per environment.

| Variable | Secret | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Read-only Postgres connection to the onboarding Supabase. Use a read-only role (see Deploy). |
| `BASIC_AUTH_USER` | Yes | Username for the active Basic Auth gate. Deny-by-default: if unset, no one gets in. |
| `BASIC_AUTH_PASSWORD` | Yes | Password for the Basic Auth gate. |
| `TEST_DATABASE_URL` | No | Optional. Local test database for the vitest harness. Defaults to `postgres://localhost:5432/onboarding_dash_test`. Never point this at a remote database. |
| `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_DEV_BYPASS`, `ALLOWED_EMAILS` | Later | Only for the deferred Google SSO path; not needed in the Basic Auth launch. See Access. |

## Deploy

The read-only DB role is a human task (not performed by the build). The Basic Auth launch needs only three env vars.

1. **Vercel project.** Create a Vercel project named `fp-onboarding-dashboard`, connect this repository, and let it detect Next.js. Deploys track `main`.
2. **Read-only database role.** Provision a dedicated read-only Postgres role on the onboarding Supabase and use its connection string as `DATABASE_URL`. Use the Supabase **Session** pooler string (port 5432, `...pooler.supabase.com`) since the client uses prepared statements. The dashboard only issues SELECTs; the role should have no write access. For example:
   ```sql
   create role onboarding_dashboard_ro login password '<strong-password>';
   grant usage on schema public to onboarding_dashboard_ro;
   grant select on wizard_sessions, wizard_module_data, import_jobs to onboarding_dashboard_ro;
   ```
   Confirm the role cannot insert, update, or delete before wiring it up.
3. **Environment variables.** In the Vercel project settings set `DATABASE_URL`, `BASIC_AUTH_USER`, and `BASIC_AUTH_PASSWORD` (Production, and Preview if you want preview deploys gated). `DATABASE_URL` must be set before the first deploy - the build reads it while collecting page data.
4. **Deploy**, then open the site and sign in with the Basic Auth credentials.

To move to Google SSO later, follow [Access](#access): restore the Auth.js middleware, create a Google OAuth client (redirect `https://<domain>/api/auth/callback/google`), and set the `AUTH_*` and `ALLOWED_EMAILS` vars.

## Scope (V1)

This is the first version and covers PRD requirements 1-5. Explicit non-goals (see the PRD's "Not Doing"): completion notifications, within-module behavior instrumentation, an arbitrary pivot, in-app reporting, onboarding-experience segmentation, and migrating the onboarding database off its current Supabase account.
