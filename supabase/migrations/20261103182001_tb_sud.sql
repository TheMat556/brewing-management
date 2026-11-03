-- TB_SUD and sudnummer sequence
-- Part of the brewing foundation.

create table public.tb_sud (
  id bigint generated always as identity primary key,
  rezeptversion_id bigint not null references public.tb_rezeptversion (id) on delete restrict,
  sudnummer text not null,
  name text not null,
  erstellt_am timestamptz not null default now(),
  braudatum date,
  status public.sud_status not null default 'GEPLANT',
  ziel_ausschlagmenge_l numeric(12, 4),
  ziel_stammwuerze_plato numeric(8, 4),
  ziel_abv_prozent numeric(8, 4),
  ziel_ibu numeric(8, 4),
  ziel_ebc numeric(8, 4),
  ist_ausschlagmenge_l numeric(12, 4),
  ist_stammwuerze_plato numeric(8, 4),
  ist_abv_prozent numeric(8, 4),
  ist_ibu numeric(8, 4),
  ist_ebc numeric(8, 4),
  abgefuellte_menge_l numeric(12, 4),
  infos text,
  constraint uq_tb_sud_nummer unique (sudnummer),
  constraint chk_tb_sud_nummer_nonblank check (btrim(sudnummer) <> ''),
  constraint chk_tb_sud_name_nonblank check (btrim(name) <> ''),
  constraint chk_tb_sud_ausschlag
    check (ziel_ausschlagmenge_l is null or ziel_ausschlagmenge_l > 0),
  constraint chk_tb_sud_stammwuerze
    check (ziel_stammwuerze_plato is null or ziel_stammwuerze_plato >= 0),
  constraint chk_tb_sud_abv
    check (ziel_abv_prozent is null or (ziel_abv_prozent >= 0 and ziel_abv_prozent <= 100)),
  constraint chk_tb_sud_ibu check (ziel_ibu is null or ziel_ibu >= 0),
  constraint chk_tb_sud_ebc check (ziel_ebc is null or ziel_ebc >= 0),
  constraint chk_tb_sud_ist_ausschlag
    check (ist_ausschlagmenge_l is null or ist_ausschlagmenge_l >= 0),
  constraint chk_tb_sud_ist_stammwuerze
    check (ist_stammwuerze_plato is null or ist_stammwuerze_plato >= 0),
  constraint chk_tb_sud_ist_abv
    check (ist_abv_prozent is null or (ist_abv_prozent >= 0 and ist_abv_prozent <= 100)),
  constraint chk_tb_sud_ist_ibu check (ist_ibu is null or ist_ibu >= 0),
  constraint chk_tb_sud_ist_ebc check (ist_ebc is null or ist_ebc >= 0),
  constraint chk_tb_sud_abgefuellt
    check (abgefuellte_menge_l is null or abgefuellte_menge_l >= 0)
);

create index idx_tb_sud_rezeptversion on public.tb_sud (rezeptversion_id);
create index idx_tb_sud_status_datum on public.tb_sud (status, braudatum);

create sequence public.tb_sud_nummer_seq start with 1 increment by 1;
