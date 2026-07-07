# Onboarding App Dashboard

Internal, read-only analytics dashboard over the FieldPulse onboarding app's Supabase. It gives the Product, customer success, implementation, and leadership teams visibility into the onboarding funnel at two levels: a company-level summary (links generated, progress, selections, submissions, completions, time-to-complete, drop-off) and a per-account drill-down (progress, final selections, per-module submit results, key timestamps, and the full Salesforce profile captured at link creation).

Standalone Next.js app, deployed as its own Vercel project (`fp-onboarding-dashboard`), gated behind Google SSO restricted to an allowlist of FieldPulse emails. It only ever reads the onboarding database.

## Links

- PRD (what / why): https://fieldpulse.atlassian.net/wiki/spaces/PM/pages/1969979602/Onboarding+App+Dashboard
- Build Spec (how): https://linear.app/fieldpulse/document/build-spec-2d8c493fbbd2
- Linear project: https://linear.app/fieldpulse/project/onboarding-app-dashboard-d437d399c791

## Status

In active development, built one Linear issue at a time (COR2-1 .. COR2-26). See [CLAUDE.md](CLAUDE.md) for the build and git workflow. Full local-dev and deploy instructions land with the final milestone (COR2-26).
