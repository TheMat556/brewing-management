-- TB_ROHSTOFF
-- Part of the brewing foundation.

create table public.tb_rohstoff (
  id bigint generated always as identity primary key,
  name text not null,
  kategorie public.rohstoff_kategorie not null,
  basiseinheit public.basiseinheit not null,
  archiviert boolean not null default false,
  notizen text,
  constraint chk_tb_rohstoff_name_nonblank check (btrim(name) <> '')
);

comment on table public.tb_rohstoff is 'Raw ingredient master data. Archive rather than delete when referenced.';
