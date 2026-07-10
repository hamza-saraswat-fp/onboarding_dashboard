# Onboarding App Dashboard

Internal, read-only analytics dashboard over the FieldPulse onboarding app's Supabase. It gives the Product, customer success, implementation, and leadership teams visibility into the onboarding funnel at two levels:

- **Company summary** (the landing view): links generated, completions, completion rate, average progress, average and median time-to-complete, module drop-off, selection distribution and selection-to-completion correlation, submissions, lifecycle breakdown, trends over time with before/after comparison, and breakdowns by Salesforce dimension (Sales Segment, Industry, Number of Employees).
- **Account drill-down**: one customer's progress, final per-module selections, per-module submit results, key timestamps, and the full Salesforce profile captured at link creation (including fields never shown in the onboarding app).

It is a standalone app deployed as its own Vercel project (`fp-onboarding-dashboard`). It is gated behind Google SSO with a FieldPulse email allowlist; a shared HTTP Basic Auth login remains implemented as a dormant fallback (see [Access](#access)). It only ever reads the onboarding database.

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
4. Copy `.env.example` to `.env.local` and fill it in. For local development, bypass Google SSO with the dev stub and point `DATABASE_URL` at the seeded local database:
   ```
   DATABASE_URL=postgres://localhost:5432/onboarding_dash_test
   AUTH_SECRET=any-non-empty-value-for-local
   AUTH_DEV_BYPASS=true
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

- **Google SSO + email allowlist (active).** Sign in with Google; only addresses matching `ALLOWED_EMAILS` may enter. An entry starting with `@` (for example `@fieldpulse.com`) matches a whole domain; any other entry must match the full email. A signed-in user who is not allowlisted gets the `/403` page. Deny-by-default: an empty allowlist admits no one. The config lives in `lib/auth.ts`, the `app/api/auth/[...nextauth]` route, `lib/auth/allowlist.ts`, and the 403 page. For local development, set `AUTH_DEV_BYPASS=true` (non-production only) to sign in as a stub user without Google.
- **Shared HTTP Basic Auth (dormant fallback).** `lib/auth/basic-auth.ts` and the Basic Auth middleware remain in place but unused. To fall back to a shared username / password, restore the Basic Auth middleware in `middleware.ts` (see the `git log`) and set `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD`.

## Environment variables

`.env.example` holds placeholders. Real values live in `.env.local` (git-ignored) and in the Vercel dashboard per environment.

| Variable | Secret | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Read-only Postgres connection to the onboarding Supabase. Use a read-only role (see Deploy). |
| `AUTH_SECRET` | Yes | Auth.js session-encryption secret. Generate with `npx auth secret`. |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth client ID (Google Cloud console). |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret. |
| `ALLOWED_EMAILS` | No | Comma-separated allowlist. An entry starting with `@` matches a whole domain; any other entry must match the full email. Case-insensitive. Empty denies everyone. |
| `AUTH_DEV_BYPASS` | No | Local dev only. `true` signs in as a stub user without Google. Ignored when `NODE_ENV=production`; never set in Vercel. |
| `TEST_DATABASE_URL` | No | Optional. Local test database for the vitest harness. Defaults to `postgres://localhost:5432/onboarding_dash_test`. Never point this at a remote database. |
| `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` | Fallback | Only for the dormant HTTP Basic Auth fallback; unused while Google SSO is active. See Access. |

## Deploy

The read-only DB role and the Google OAuth client are human tasks (not performed by the build).

1. **Vercel project.** Create a Vercel project named `fp-onboarding-dashboard`, connect this repository, and let it detect Next.js. Deploys track `main`.
2. **Google OAuth client.** In the Google Cloud console (FieldPulse Workspace org), set the OAuth consent screen to **Internal**, then create an OAuth 2.0 client (type: Web application). Add the authorized redirect URI `https://<your-vercel-domain>/api/auth/callback/google` (confirm the exact host in Vercel -> Settings -> Domains). Put the client id and secret in `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
3. **Read-only database role.** Provision a dedicated read-only Postgres role on the onboarding Supabase and use its connection string as `DATABASE_URL`. Use the Supabase **Session** pooler string (port 5432, `...pooler.supabase.com`) since the client uses prepared statements. The dashboard only issues SELECTs; the role should have no write access. For example:
   ```sql
   create role onboarding_dashboard_ro login password '<strong-password>';
   grant usage on schema public to onboarding_dashboard_ro;
   grant select on wizard_sessions, wizard_module_data, import_jobs to onboarding_dashboard_ro;
   ```
   Confirm the role cannot insert, update, or delete before wiring it up.
4. **Environment variables.** In the Vercel project settings set `DATABASE_URL`, `AUTH_SECRET` (generate with `npx auth secret`), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `ALLOWED_EMAILS` (for example `@fieldpulse.com`). Set these before the first deploy - the build reads `DATABASE_URL` while collecting page data, and the SSO gate needs the `AUTH_*` vars at runtime. Do **not** set `AUTH_DEV_BYPASS` in production.
5. **Deploy**, then open the site and sign in with an allowlisted Google account.

To fall back to shared Basic Auth, follow [Access](#access): restore the Basic Auth middleware in `middleware.ts` and set `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD`.

## Scope (V1)

This is the first version and covers PRD requirements 1-5. Explicit non-goals (see the PRD's "Not Doing"): completion notifications, within-module behavior instrumentation, an arbitrary pivot, in-app reporting, onboarding-experience segmentation, and migrating the onboarding database off its current Supabase account.
