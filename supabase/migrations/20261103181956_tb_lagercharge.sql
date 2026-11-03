-- TB_LAGERCHARGE
-- Part of the brewing foundation.

create table public.tb_lagercharge (
  id bigint generated always as identity primary key,
  rohstoff_id bigint not null references public.tb_rohstoff (id) on delete restrict,
  lieferanten_chargennummer text,
  lieferdatum date not null,
  mhd date,
  alphasaeure_prozent numeric(8, 4),
  ebc numeric(8, 4),
  notizen text,
  constraint chk_tb_lagercharge_alphasaeure
    check (alphasaeure_prozent is null or (alphasaeure_prozent >= 0 and alphasaeure_prozent <= 100)),
  constraint chk_tb_lagercharge_ebc check (ebc is null or ebc >= 0)
);

create index idx_tb_lagercharge_rohstoff on public.tb_lagercharge (rohstoff_id);
create index idx_tb_lagercharge_mhd on public.tb_lagercharge (rohstoff_id, mhd);
