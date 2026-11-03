-- TB_SUDSCHRITT
-- Part of the brewing foundation.

create table public.tb_sudschritt (
  id bigint generated always as identity primary key,
  sud_id bigint not null references public.tb_sud (id) on delete restrict,
  position integer not null,
  typ public.prozessschritt_typ not null,
  name text not null,
  gestartet_am timestamptz,
  beendet_am timestamptz,
  ziel_temperatur_c numeric(8, 4),
  ist_temperatur_c numeric(8, 4),
  ziel_dauer_min numeric(12, 4),
  ist_dauer_min numeric(12, 4),
  ziel_wassermenge_l numeric(12, 4),
  ist_wassermenge_l numeric(12, 4),
  anweisung text,
  notizen text,
  constraint uq_tb_sudschritt_position unique (sud_id, position),
  constraint uq_tb_sudschritt_id_sud unique (id, sud_id),
  constraint chk_tb_sudschritt_position check (position >= 1),
  constraint chk_tb_sudschritt_name_nonblank check (btrim(name) <> ''),
  constraint chk_tb_sudschritt_zeitraum
    check (beendet_am is null or gestartet_am is null or beendet_am >= gestartet_am),
  constraint chk_tb_sudschritt_ziel_dauer
    check (ziel_dauer_min is null or ziel_dauer_min >= 0),
  constraint chk_tb_sudschritt_ist_dauer
    check (ist_dauer_min is null or ist_dauer_min >= 0),
  constraint chk_tb_sudschritt_ziel_wasser
    check (ziel_wassermenge_l is null or ziel_wassermenge_l >= 0),
  constraint chk_tb_sudschritt_ist_wasser
    check (ist_wassermenge_l is null or ist_wassermenge_l >= 0)
);
