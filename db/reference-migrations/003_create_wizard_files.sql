create table wizard_files (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references wizard_sessions(id) on delete cascade,
  module_key    text not null,
  storage_path  text not null,
  file_type     text not null,
  uploaded_at   timestamptz not null default now()
);

create index idx_wizard_files_session on wizard_files(session_id);

alter table wizard_files enable row level security;

create policy "Company can manage own files"
  on wizard_files for all
  using (
    session_id in (
      select id from wizard_sessions
      where company_id = (current_setting('request.jwt.claims', true)::jsonb->>'company_id')
    )
  );
