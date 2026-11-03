-- TB_SUDZUTAT
-- Part of the brewing foundation.

create table public.tb_sudzutat (
  id bigint generated always as identity primary key,
  sud_id bigint not null references public.tb_sud (id) on delete restrict,
  rohstoff_id bigint not null references public.tb_rohstoff (id) on delete restrict,
  sudschritt_id bigint,
  rohstoffname_snapshot text not null,
  einheit_snapshot public.basiseinheit not null,
  geplante_menge numeric(12, 4) not null,
  ist_menge numeric(12, 4),
  alphasaeure_prozent numeric(8, 4),
  ebc numeric(8, 4),
  ziel_zugabe_nach_min numeric(12, 4),
  ist_zugabe_nach_min numeric(12, 4),
  notizen text,
  constraint fk_tb_sudzutat_schritt
    foreign key (sudschritt_id, sud_id)
    references public.tb_sudschritt (id, sud_id)
    on delete restrict,
  constraint chk_tb_sudzutat_snapshot_name_nonblank
    check (btrim(rohstoffname_snapshot) <> ''),
  constraint chk_tb_sudzutat_geplante_menge check (geplante_menge >= 0),
  constraint chk_tb_sudzutat_ist_menge check (ist_menge is null or ist_menge >= 0),
  constraint chk_tb_sudzutat_alphasaeure
    check (alphasaeure_prozent is null or (alphasaeure_prozent >= 0 and alphasaeure_prozent <= 100)),
  constraint chk_tb_sudzutat_ebc check (ebc is null or ebc >= 0),
  constraint chk_tb_sudzutat_ziel_zugabe
    check (ziel_zugabe_nach_min is null or ziel_zugabe_nach_min >= 0),
  constraint chk_tb_sudzutat_ist_zugabe
    check (ist_zugabe_nach_min is null or ist_zugabe_nach_min >= 0),
  constraint chk_tb_sudzutat_ziel_zugabe_requires_step
    check (ziel_zugabe_nach_min is null or sudschritt_id is not null),
  constraint chk_tb_sudzutat_ist_zugabe_requires_step
    check (ist_zugabe_nach_min is null or sudschritt_id is not null)
);

create index idx_tb_sudzutat_sud on public.tb_sudzutat (sud_id);
create index idx_tb_sudzutat_rohstoff on public.tb_sudzutat (rohstoff_id);
create index idx_tb_sudzutat_schritt on public.tb_sudzutat (sudschritt_id);
