-- TB_GERAET
-- Part of the brewing foundation.

create table public.tb_geraet (
  id bigint generated always as identity primary key,
  name text not null,
  menge integer not null,
  lob_faehig boolean not null default false,
  lob_menge_l numeric(12, 4),
  archiviert boolean not null default false,
  notizen text,
  constraint chk_tb_geraet_name_nonblank check (btrim(name) <> ''),
  constraint chk_tb_geraet_menge check (menge >= 0),
  constraint chk_tb_geraet_lob_menge check (lob_menge_l is null or lob_menge_l >= 0)
);
