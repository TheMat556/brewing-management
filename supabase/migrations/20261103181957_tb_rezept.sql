-- TB_REZEPT
-- Part of the brewing foundation.

create table public.tb_rezept (
  id bigint generated always as identity primary key,
  name text not null,
  beschreibung text,
  erstellt_am timestamptz not null default now(),
  archiviert boolean not null default false,
  constraint chk_tb_rezept_name_nonblank check (btrim(name) <> '')
);
