-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Status enum
create type wizard_status as enum (
  'in_progress',
  'completed',
  'expired',
  'submission_failed'
);

create table wizard_sessions (
  id               uuid primary key default uuid_generate_v4(),
  company_id       text not null,
  access_token     text not null unique,
  salesforce_data  jsonb default '{}',
  current_module   integer not null default 0,
  custom_forms_enabled boolean not null default false,
  status           wizard_status not null default 'in_progress',
  expires_at       timestamptz not null default (now() + interval '14 days'),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Index for token lookup (hot path on every page load)
create unique index idx_wizard_sessions_token on wizard_sessions(access_token);
create index idx_wizard_sessions_company on wizard_sessions(company_id);

-- RLS
alter table wizard_sessions enable row level security;

create policy "Company can read own session"
  on wizard_sessions for select
  using (company_id = (current_setting('request.jwt.claims', true)::jsonb->>'company_id'));

create policy "Company can update own session"
  on wizard_sessions for update
  using (company_id = (current_setting('request.jwt.claims', true)::jsonb->>'company_id'));
