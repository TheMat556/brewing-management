-- TB_SUDGERAET
-- Part of the brewing foundation.

create table public.tb_sudgeraet (
  id bigint generated always as identity primary key,
  sud_id bigint not null references public.tb_sud (id) on delete restrict,
  geraet_id bigint not null references public.tb_geraet (id) on delete restrict,
  geraetename_snapshot text not null,
  zugewiesene_menge integer not null,
  lob_genutzt boolean not null default false,
  lob_menge_l_snapshot numeric(12, 4),
  notizen text,
  constraint uq_tb_sudgeraet_zuweisung unique (sud_id, geraet_id),
  constraint chk_tb_sudgeraet_menge check (zugewiesene_menge > 0),
  constraint chk_tb_sudgeraet_name_nonblank check (btrim(geraetename_snapshot) <> ''),
  constraint chk_tb_sudgeraet_lob_menge
    check (lob_menge_l_snapshot is null or lob_menge_l_snapshot >= 0),
  constraint chk_tb_sudgeraet_lob_snapshot
    check (not lob_genutzt or lob_menge_l_snapshot is not null)
);

create index idx_tb_sudgeraet_geraet on public.tb_sudgeraet (geraet_id);
