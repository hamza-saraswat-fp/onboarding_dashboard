# CLAUDE.md - onboarding_dashboard

Workflow playbook for Claude Code sessions in this repo. Read this first, every session.

## 1. Project snapshot

Internal, read-only analytics dashboard over the FieldPulse onboarding app's Supabase (project `rqelncbqgepyardwtltc`). Two views: a company-level funnel summary (the default landing view) and a per-account drill-down. Standalone app deployed as its own Vercel project (`fp-onboarding-dashboard`), gated behind Google SSO plus an email allowlist. It never writes to the database.

Stack mirrors the onboarding wizard app (`jaden-fp/fieldpulse-onboarding`): Next.js (App Router, TypeScript strict), Tailwind v4, shadcn/ui, `postgres` (postgres.js, direct reads, no Supabase SDK), zod, date-fns, Recharts via shadcn charts, Auth.js (NextAuth v5) with a Google provider. White theme, navy `#00034D` primary accent, secondary palette (cobalt / sky / fog / aqua / quartz), Montserrat.

Default branch: `main`.

- PRD (what / why): https://fieldpulse.atlassian.net/wiki/spaces/PM/pages/1969979602/Onboarding+App+Dashboard
- Build Spec (how): https://linear.app/fieldpulse/document/build-spec-2d8c493fbbd2
- Linear project: https://linear.app/fieldpulse/project/onboarding-app-dashboard-d437d399c791

## 2. The build: one Linear issue at a time

The whole app is specced as 26 Linear issues, COR2-1 .. COR2-26 (team Core Product, prefix `COR2`), grouped into 7 milestones. Each issue is a self-contained "Prompt for Claude Code" with acceptance criteria and a runnable verify gate. A fresh session can pick up any single issue, implement it with no other context, and finish it. Work issues in numeric order; later issues build on earlier ones.

Milestones:
1. Scaffold & Toolchain (COR2-1..2)
2. Read-Only Data Layer (COR2-3..9)
3. Auth (COR2-10..11)
4. Shell & Theme (COR2-12..13)
5. Company Summary (COR2-14..19)
6. Account Drill-Down (COR2-20..23)
7. Edge States & Deploy Docs (COR2-24..26)

## 3. Branching model

- `main` is the trunk. Never commit directly to `main`; everything lands via a PR. (The one exception was the initial bootstrap commit into the empty repo.)
- One issue = one feature branch = one PR to `main`. Never mix two issues on one branch.
- Branch name: use Linear's auto-generated name verbatim (the "Copy git branch name" button on the issue, format `feature/cor2-N-<slug>`). This is the issue's `gitBranchName` field.

## 4. Per-issue lifecycle

1. Read the issue in full via the Linear MCP (`get_issue COR2-N`): its scope and acceptance criteria. Do not infer; read.
2. `git checkout main && git pull`
3. `git checkout -b <linear branch name>`. Move the Linear issue to In Progress (`save_issue`).
4. Implement exactly the issue's prompt. No scope expansion; touch nothing outside the issue.
5. Run the verify gate (the issue names the subset; the full gate is `npm run lint && npm run typecheck && npm run test && npm run build`). All must pass before the PR.
6. Commit with conventional-commit messages. Push the branch.
7. `gh pr create --base main --title "[COR2-N] <summary>"` with a body containing `Closes COR2-N` plus Summary and Test plan sections.
8. Self-merge once the gates are green: `gh pr merge <n> --squash --delete-branch`.
9. `git checkout main && git pull && git fetch --prune`. Move the Linear issue to Done and comment the PR URL.

## 5. Conventions

- Conventional commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). One logical change per commit.
- No em dashes anywhere in code, comments, or docs. House style.
- Never `--amend` or force-push a branch that is already pushed; add new commits so reviewers see what changed.
- Never `--no-verify`. Never bypass commit signing.
- Secrets never get committed. `.env.example` holds placeholders only; `.env.local` is git-ignored. Real values live in Vercel env vars and 1Password.
- Read-only forever: this app issues SELECTs only. No insert / update / delete against the onboarding database, ever.

## 6. Verify toolchain

Every issue gates on some subset of:
- `npm run lint`
- `npm run typecheck` (tsc --noEmit, strict)
- `npm run test` (vitest run)
- `npm run build`

Tests run against a local Postgres seeded from the onboarding app's migrations plus synthetic rows (stood up in the Read-Only Data Layer milestone), so they run offline and never touch the real Supabase.

## 7. Linear

- Team: Core Product (prefix `COR2`). Project: Onboarding App Dashboard.
- The GitHub integration may not be connected to this repo, so move issue states manually via the Linear MCP (`save_issue`): In Progress when you branch, Done when the PR merges. If auto-transitions do fire from the `Closes` phrase, the manual move is harmless.

## 8. What NOT to do

- Don't commit to `main`. All changes land via PR.
- Don't start work without reading the Linear issue.
- Don't put two issues on one branch.
- Don't expand an issue's scope. If something is missing, note it for a follow-up issue rather than growing the current one.
- Don't write to the onboarding database.
- Don't run destructive git ops (`push --force`, `reset --hard`, deleting remote branches beyond the merged PR's own) without explicit approval.
