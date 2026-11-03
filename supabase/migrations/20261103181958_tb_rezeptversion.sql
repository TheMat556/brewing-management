-- TB_REZEPTVERSION
-- Part of the brewing foundation.

create table public.tb_rezeptversion (
  id bigint generated always as identity primary key,
  rezept_id bigint not null references public.tb_rezept (id) on delete restrict,
  versionsnummer integer not null,
  name_snapshot text not null,
  beschreibung_snapshot text,
  erstellt_am timestamptz not null default now(),
  freigegeben_am timestamptz,
  status public.rezeptversion_status not null default 'ENTWURF',
  ziel_ausschlagmenge_l numeric(12, 4),
  ziel_stammwuerze_plato numeric(8, 4),
  ziel_abv_prozent numeric(8, 4),
  ziel_ibu numeric(8, 4),
  ziel_ebc numeric(8, 4),
  infos text,
  constraint uq_tb_rezeptversion_nummer unique (rezept_id, versionsnummer),
  constraint chk_tb_rezeptversion_nummer check (versionsnummer >= 1),
  constraint chk_tb_rezeptversion_name_nonblank check (btrim(name_snapshot) <> ''),
  constraint chk_tb_rezeptversion_ausschlag
    check (ziel_ausschlagmenge_l is null or ziel_ausschlagmenge_l > 0),
  constraint chk_tb_rezeptversion_stammwuerze
    check (ziel_stammwuerze_plato is null or ziel_stammwuerze_plato >= 0),
  constraint chk_tb_rezeptversion_abv
    check (ziel_abv_prozent is null or (ziel_abv_prozent >= 0 and ziel_abv_prozent <= 100)),
  constraint chk_tb_rezeptversion_ibu check (ziel_ibu is null or ziel_ibu >= 0),
  constraint chk_tb_rezeptversion_ebc check (ziel_ebc is null or ziel_ebc >= 0),
  constraint chk_tb_rezeptversion_freigabe
    check (
      (status = 'ENTWURF' and freigegeben_am is null)
      or (status = 'FREIGEGEBEN' and freigegeben_am is not null)
    ),
  constraint chk_tb_rezeptversion_freigabe_nach_erstellung
    check (freigegeben_am is null or freigegeben_am >= erstellt_am)
);
