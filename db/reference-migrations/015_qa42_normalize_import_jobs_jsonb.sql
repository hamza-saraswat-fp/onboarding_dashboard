-- 015_qa42_normalize_import_jobs_jsonb.sql
-- QA-42: defense-in-depth against jsonb double-encoding in import_jobs.
--
-- import_jobs.payload / response_data are jsonb. A value that reaches the
-- column already JSON-stringified is stored as a jsonb *string* scalar
-- (jsonb_typeof = 'string') instead of a container — the "Bug F" / G-004
-- regression. The app normalizes via toJsonbValue() before every write, but the
-- bug has recurred (BRK-163 -> QA-42 -> still observed on prod 2026-06-24 despite
-- the deployed normalizer). This enforces the invariant at the DB for ANY writer:
-- on insert/update, if payload or response_data is a jsonb string scalar whose
-- text looks like a JSON object/array, unwrap it back to the container.
-- Idempotent and cheap (string-typed values only).

create or replace function normalize_import_jobs_jsonb() returns trigger language plpgsql as $$
begin
  if jsonb_typeof(new.payload) = 'string' and (new.payload #>> '{}') ~ '^\s*[\[{]' then
    new.payload := (new.payload #>> '{}')::jsonb;
  end if;
  if jsonb_typeof(new.response_data) = 'string' and (new.response_data #>> '{}') ~ '^\s*[\[{]' then
    new.response_data := (new.response_data #>> '{}')::jsonb;
  end if;
  return new;
end $$;

drop trigger if exists trg_normalize_import_jobs_jsonb on import_jobs;
create trigger trg_normalize_import_jobs_jsonb
  before insert or update on import_jobs
  for each row execute function normalize_import_jobs_jsonb();
