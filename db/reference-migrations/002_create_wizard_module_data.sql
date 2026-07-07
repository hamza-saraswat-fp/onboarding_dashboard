create table wizard_module_data (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid not null references wizard_sessions(id) on delete cascade,
  module_number   integer not null,
  module_key      text not null,
  form_data       jsonb not null default '{}',
  is_complete     boolean not null default false,
  submitted_to_fp boolean not null default false,
  saved_at        timestamptz not null default now(),
  unique (session_id, module_key)
);

create index idx_module_data_session on wizard_module_data(session_id);

alter table wizard_module_data enable row level security;

create policy "Company can manage own module data"
  on wizard_module_data for all
  using (
    session_id in (
      select id from wizard_sessions
      where company_id = (current_setting('request.jwt.claims', true)::jsonb->>'company_id')
    )
  );
