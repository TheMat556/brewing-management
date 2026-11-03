-- TB_REZEPTSCHRITT
-- Part of the brewing foundation.

create table public.tb_rezeptschritt (
  id bigint generated always as identity primary key,
  rezeptversion_id bigint not null references public.tb_rezeptversion (id) on delete restrict,
  position integer not null,
  typ public.prozessschritt_typ not null,
  name text not null,
  temperatur_c numeric(8, 4),
  dauer_min numeric(12, 4),
  wassermenge_l numeric(12, 4),
  anweisung text,
  constraint uq_tb_rezeptschritt_position unique (rezeptversion_id, position),
  constraint uq_tb_rezeptschritt_id_version unique (id, rezeptversion_id),
  constraint chk_tb_rezeptschritt_position check (position >= 1),
  constraint chk_tb_rezeptschritt_name_nonblank check (btrim(name) <> ''),
  constraint chk_tb_rezeptschritt_dauer check (dauer_min is null or dauer_min >= 0),
  constraint chk_tb_rezeptschritt_wasser
    check (wassermenge_l is null or wassermenge_l >= 0)
);
