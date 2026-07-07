-- Auto-update updated_at on wizard_sessions
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger wizard_sessions_updated_at
  before update on wizard_sessions
  for each row execute procedure update_updated_at_column();
