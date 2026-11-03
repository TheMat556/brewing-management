-- TB_REZEPTZUTAT
-- Part of the brewing foundation.

create table public.tb_rezeptzutat (
  id bigint generated always as identity primary key,
  rezeptversion_id bigint not null references public.tb_rezeptversion (id) on delete restrict,
  rohstoff_id bigint not null references public.tb_rohstoff (id) on delete restrict,
  rezeptschritt_id bigint,
  rohstoffname_snapshot text not null,
  einheit_snapshot public.basiseinheit not null,
  menge numeric(12, 4) not null,
  alphasaeure_prozent numeric(8, 4),
  ebc numeric(8, 4),
  zugabe_nach_min numeric(12, 4),
  notizen text,
  constraint fk_tb_rezeptzutat_schritt
    foreign key (rezeptschritt_id, rezeptversion_id)
    references public.tb_rezeptschritt (id, rezeptversion_id)
    on delete restrict,
  constraint chk_tb_rezeptzutat_snapshot_name_nonblank
    check (btrim(rohstoffname_snapshot) <> ''),
  constraint chk_tb_rezeptzutat_menge check (menge >= 0),
  constraint chk_tb_rezeptzutat_alphasaeure
    check (alphasaeure_prozent is null or (alphasaeure_prozent >= 0 and alphasaeure_prozent <= 100)),
  constraint chk_tb_rezeptzutat_ebc check (ebc is null or ebc >= 0),
  constraint chk_tb_rezeptzutat_zugabe
    check (zugabe_nach_min is null or zugabe_nach_min >= 0),
  constraint chk_tb_rezeptzutat_zugabe_requires_step
    check (zugabe_nach_min is null or rezeptschritt_id is not null)
);

create index idx_tb_rezeptzutat_version on public.tb_rezeptzutat (rezeptversion_id);
create index idx_tb_rezeptzutat_rohstoff on public.tb_rezeptzutat (rohstoff_id);
create index idx_tb_rezeptzutat_schritt on public.tb_rezeptzutat (rezeptschritt_id);
