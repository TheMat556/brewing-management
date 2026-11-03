-- Brewing Management App foundation.
--
-- All domain tables use the TB_ prefix. German entity/field names and enum values follow
-- TODO.md. Numeric conventions: numeric(12,4) for quantities, volumes, durations, and
-- offsets; numeric(8,4) for percentages and brewing values. Instants use timestamptz;
-- date-only fields use date.
--
-- Access policy: single owner (or explicitly allowlisted users). Domain access is denied by
-- default through RLS; authorized users are listed in TB_BERECHTIGTER_BENUTZER. The first
-- authenticated user can claim ownership once with public.zugang_beanspruchen().

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

create type public.rohstoff_kategorie as enum (
  'MALZ',
  'HOPFEN',
  'HEFE',
  'GEWUERZ',
  'SONSTIGES'
);

create type public.basiseinheit as enum ('g', 'ml', 'Stueck');

create type public.rezeptversion_status as enum ('ENTWURF', 'FREIGEGEBEN');

create type public.sud_status as enum ('GEPLANT', 'IN_ARBEIT', 'ABGESCHLOSSEN', 'VERWORFEN');

create type public.lagerbewegung_typ as enum ('ZUGANG', 'VERBRAUCH', 'KORREKTUR', 'ENTSORGUNG');

create type public.prozessschritt_typ as enum (
  'EINMAISCHEN',
  'RAST',
  'NACHGUSS',
  'KOCHEN',
  'GAERUNG',
  'KALTHOPFUNG',
  'REIFUNG',
  'ABFUELLUNG',
  'SONSTIGES'
);

-- ---------------------------------------------------------------------------
-- Ingredient master data and inventory
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Recipes and versions
-- ---------------------------------------------------------------------------

create table public.tb_rezept (
  id bigint generated always as identity primary key,
  name text not null,
  beschreibung text,
  erstellt_am timestamptz not null default now(),
  archiviert boolean not null default false,
  constraint chk_tb_rezept_name_nonblank check (btrim(name) <> '')
);

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

-- ---------------------------------------------------------------------------
-- Brew batches
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Inventory movements
-- ---------------------------------------------------------------------------

create table public.tb_lagerbewegung (
  id bigint generated always as identity primary key,
  lagercharge_id bigint not null references public.tb_lagercharge (id) on delete restrict,
  sudzutat_id bigint references public.tb_sudzutat (id) on delete restrict,
  zeitpunkt timestamptz not null default now(),
  typ public.lagerbewegung_typ not null,
  mengen_delta numeric(12, 4) not null,
  notizen text,
  constraint chk_tb_lagerbewegung_delta_nonzero check (mengen_delta <> 0),
  constraint chk_tb_lagerbewegung_typ_sign check (
    (typ = 'ZUGANG' and mengen_delta > 0)
    or (typ in ('VERBRAUCH', 'ENTSORGUNG') and mengen_delta < 0)
    or (typ = 'KORREKTUR')
  ),
  constraint chk_tb_lagerbewegung_linked_typ
    check (sudzutat_id is null or typ in ('VERBRAUCH', 'KORREKTUR', 'ENTSORGUNG'))
);

create index idx_tb_lagerbewegung_charge_zeitpunkt
  on public.tb_lagerbewegung (lagercharge_id, zeitpunkt, id);
create index idx_tb_lagerbewegung_sudzutat on public.tb_lagerbewegung (sudzutat_id);

-- ---------------------------------------------------------------------------
-- Equipment
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Access allowlist and idempotency support
-- ---------------------------------------------------------------------------

create table public.tb_berechtigter_benutzer (
  benutzer_id uuid primary key references auth.users (id) on delete cascade,
  erstellt_am timestamptz not null default now()
);

create sequence public.tb_sud_nummer_seq start with 1 increment by 1;

create table public.tb_idempotenz (
  id bigint generated always as identity primary key,
  schluessel text not null,
  operation text not null,
  lagerbewegung_id bigint references public.tb_lagerbewegung (id) on delete restrict,
  erstellt_am timestamptz not null default now(),
  constraint uq_tb_idempotenz_operation_schluessel unique (operation, schluessel),
  constraint chk_tb_idempotenz_schluessel_nonblank check (btrim(schluessel) <> ''),
  constraint chk_tb_idempotenz_operation_nonblank check (btrim(operation) <> '')
);

-- ---------------------------------------------------------------------------
-- Trigger functions
-- ---------------------------------------------------------------------------

create or replace function public.tf_rezeptversion_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if old.status = 'FREIGEGEBEN' then
      raise exception 'Rezeptversion % ist freigegeben und unveraenderlich', old.id;
    end if;

    if new.status = 'FREIGEGEBEN' then
      if old.status <> 'ENTWURF' then
        raise exception 'Nur Entwuerfe koennen freigegeben werden';
      end if;
      if (to_jsonb(new) - 'status' - 'freigegeben_am')
        <> (to_jsonb(old) - 'status' - 'freigegeben_am') then
        raise exception 'Beim Freigeben duerfen nur Status und Freigabezeitpunkt geaendert werden';
      end if;
    end if;

    return new;
  elsif tg_op = 'DELETE' then
    if old.status = 'FREIGEGEBEN' then
      raise exception 'Freigegebene Rezeptversionen duerfen nicht geloescht werden';
    end if;
    if (select count(*) from public.tb_rezeptversion where rezept_id = old.rezept_id) <= 1 then
      raise exception 'Die letzte Rezeptversion eines Rezepts darf nicht geloescht werden';
    end if;
    return old;
  end if;

  return null;
end;
$$;

create trigger trg_tb_rezeptversion_guard
before update or delete on public.tb_rezeptversion
for each row execute function public.tf_rezeptversion_guard();

create or replace function public.tf_rezeptchild_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent bigint;
  v_status public.rezeptversion_status;
begin
  if tg_op = 'DELETE' then
    v_parent := old.rezeptversion_id;
  else
    v_parent := new.rezeptversion_id;
  end if;

  select status into v_status from public.tb_rezeptversion where id = v_parent;
  if v_status = 'FREIGEGEBEN' then
    raise exception 'Inhalte einer freigegebenen Rezeptversion sind unveraenderlich';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger trg_tb_rezeptschritt_guard
before insert or update or delete on public.tb_rezeptschritt
for each row execute function public.tf_rezeptchild_guard();

create trigger trg_tb_rezeptzutat_guard
before insert or update or delete on public.tb_rezeptzutat
for each row execute function public.tf_rezeptchild_guard();

create or replace function public.tf_rezeptzutat_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_unit public.basiseinheit;
begin
  select name, basiseinheit into v_name, v_unit
  from public.tb_rohstoff
  where id = new.rohstoff_id;

  if not found then
    raise exception 'Rohstoff % existiert nicht', new.rohstoff_id;
  end if;

  if tg_op = 'INSERT' then
    new.rohstoffname_snapshot := v_name;
    new.einheit_snapshot := v_unit;
    return new;
  end if;

  if new.rohstoff_id is distinct from old.rohstoff_id then
    if new.alphasaeure_prozent is not distinct from old.alphasaeure_prozent
      and new.ebc is not distinct from old.ebc then
      new.alphasaeure_prozent := null;
      new.ebc := null;
    end if;

    if v_unit <> old.einheit_snapshot
      and new.menge is not distinct from old.menge
      and coalesce(current_setting('app.erlaube_einheitenwechsel', true), '') <> 'on' then
      raise exception 'Basiseinheit geaendert: Menge muss neu eingegeben werden';
    end if;

    new.rohstoffname_snapshot := v_name;
    new.einheit_snapshot := v_unit;
  else
    if new.rohstoffname_snapshot is distinct from old.rohstoffname_snapshot then
      raise exception 'Rohstoff-Snapshot darf nicht manuell geaendert werden';
    end if;
    if new.einheit_snapshot is distinct from v_unit then
      raise exception 'Einheit-Snapshot muss der Basiseinheit des Rohstoffs entsprechen';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_tb_rezeptzutat_snapshot
before insert or update on public.tb_rezeptzutat
for each row execute function public.tf_rezeptzutat_snapshot();

create or replace function public.tf_sudzutat_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_unit public.basiseinheit;
begin
  select name, basiseinheit into v_name, v_unit
  from public.tb_rohstoff
  where id = new.rohstoff_id;

  if not found then
    raise exception 'Rohstoff % existiert nicht', new.rohstoff_id;
  end if;

  if tg_op = 'INSERT' then
    new.rohstoffname_snapshot := v_name;
    new.einheit_snapshot := v_unit;
    return new;
  end if;

  if new.rohstoff_id is distinct from old.rohstoff_id then
    if exists (select 1 from public.tb_lagerbewegung where sudzutat_id = new.id) then
      raise exception 'Rohstoff eines Sudzutat-Eintrags mit Lagerbewegungen darf nicht geaendert werden';
    end if;

    if new.alphasaeure_prozent is not distinct from old.alphasaeure_prozent
      and new.ebc is not distinct from old.ebc then
      new.alphasaeure_prozent := null;
      new.ebc := null;
    end if;

    if v_unit <> old.einheit_snapshot
      and new.geplante_menge is not distinct from old.geplante_menge
      and coalesce(current_setting('app.erlaube_einheitenwechsel', true), '') <> 'on' then
      raise exception 'Basiseinheit geaendert: Menge muss neu eingegeben werden';
    end if;

    new.rohstoffname_snapshot := v_name;
    new.einheit_snapshot := v_unit;
  else
    if new.rohstoffname_snapshot is distinct from old.rohstoffname_snapshot then
      raise exception 'Rohstoff-Snapshot darf nicht manuell geaendert werden';
    end if;
    if new.einheit_snapshot is distinct from v_unit then
      raise exception 'Einheit-Snapshot muss der Basiseinheit des Rohstoffs entsprechen';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_tb_sudzutat_snapshot
before insert or update on public.tb_sudzutat
for each row execute function public.tf_sudzutat_snapshot();

create or replace function public.tf_rohstoff_base_unit_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.basiseinheit is distinct from old.basiseinheit then
    if exists (select 1 from public.tb_lagercharge where rohstoff_id = old.id)
      or exists (select 1 from public.tb_rezeptzutat where rohstoff_id = old.id)
      or exists (select 1 from public.tb_sudzutat where rohstoff_id = old.id) then
      raise exception 'Basiseinheit eines referenzierten Rohstoffs darf nicht geaendert werden';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_tb_rohstoff_base_unit_guard
before update on public.tb_rohstoff
for each row execute function public.tf_rohstoff_base_unit_guard();

create or replace function public.tf_lagercharge_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rohstoff_id is distinct from old.rohstoff_id then
    if exists (select 1 from public.tb_lagerbewegung where lagercharge_id = old.id) then
      raise exception 'Rohstoff einer Lagercharge mit Bewegungen darf nicht geaendert werden';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_tb_lagercharge_guard
before update on public.tb_lagercharge
for each row execute function public.tf_lagercharge_guard();

create or replace function public.tf_sud_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rezeptversion_id is distinct from old.rezeptversion_id then
    raise exception 'Die Rezeptversion eines SUD darf nach der Erstellung nicht geaendert werden';
  end if;
  return new;
end;
$$;

create trigger trg_tb_sud_guard
before update on public.tb_sud
for each row execute function public.tf_sud_guard();

create or replace function public.tf_lagerbewegung_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lot_rohstoff bigint;
  v_sudzutat_rohstoff bigint;
  v_stock numeric(12, 4);
begin
  if tg_op = 'UPDATE' or tg_op = 'DELETE' then
    raise exception 'Lagerbewegungen sind unveraenderlich; Korrekturen erfolgen ueber neue Bewegungen';
  end if;

  select rohstoff_id into v_lot_rohstoff
  from public.tb_lagercharge
  where id = new.lagercharge_id
  for update;

  if not found then
    raise exception 'Lagercharge % existiert nicht', new.lagercharge_id;
  end if;

  if new.sudzutat_id is not null then
    select rohstoff_id into v_sudzutat_rohstoff
    from public.tb_sudzutat
    where id = new.sudzutat_id;

    if not found then
      raise exception 'Sudzutat % existiert nicht', new.sudzutat_id;
    end if;

    if v_sudzutat_rohstoff <> v_lot_rohstoff then
      raise exception 'Lagercharge und Sudzutat muessen denselben Rohstoff referenzieren';
    end if;
  end if;

  select coalesce(sum(mengen_delta), 0)::numeric(12, 4) into v_stock
  from public.tb_lagerbewegung
  where lagercharge_id = new.lagercharge_id;

  if v_stock + new.mengen_delta < 0 then
    raise exception 'Lagerbestand darf nicht negativ werden (aktuell %, Delta %)', v_stock, new.mengen_delta;
  end if;

  return new;
end;
$$;

create trigger trg_tb_lagerbewegung_guard
before insert or update or delete on public.tb_lagerbewegung
for each row execute function public.tf_lagerbewegung_guard();

create or replace function public.tf_sudschritt_duration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.gestartet_am is not null and new.beendet_am is not null then
    if new.beendet_am < new.gestartet_am then
      raise exception 'beendet_am darf nicht vor gestartet_am liegen';
    end if;
    new.ist_dauer_min := round(
      extract(epoch from (new.beendet_am - new.gestartet_am))::numeric / 60,
      4
    );
  end if;
  return new;
end;
$$;

create trigger trg_tb_sudschritt_duration
before insert or update on public.tb_sudschritt
for each row execute function public.tf_sudschritt_duration();

create or replace function public.tf_sudgeraet_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_menge integer;
  v_lob_faehig boolean;
  v_lob_menge numeric(12, 4);
begin
  select name, menge, lob_faehig, lob_menge_l
  into v_name, v_menge, v_lob_faehig, v_lob_menge
  from public.tb_geraet
  where id = new.geraet_id
  for share;

  if not found then
    raise exception 'Geraet % existiert nicht', new.geraet_id;
  end if;

  if tg_op = 'INSERT' or new.geraet_id is distinct from old.geraet_id then
    new.geraetename_snapshot := v_name;
    new.lob_menge_l_snapshot := v_lob_menge;
  end if;

  if new.zugewiesene_menge > v_menge then
    raise exception 'Zugewiesene Menge % uebersteigt Geraetemenge %', new.zugewiesene_menge, v_menge;
  end if;

  if new.lob_genutzt and not v_lob_faehig then
    raise exception 'LOB kann nur bei LOB-faehigem Geraet genutzt werden';
  end if;

  if new.lob_genutzt and new.lob_menge_l_snapshot is null then
    raise exception 'Bei LOB-Nutzung muss ein LOB-Volumen bekannt sein';
  end if;

  return new;
end;
$$;

create trigger trg_tb_sudgeraet_guard
before insert or update on public.tb_sudgeraet
for each row execute function public.tf_sudgeraet_guard();

-- ---------------------------------------------------------------------------
-- Access control helpers and RPCs
-- ---------------------------------------------------------------------------

create or replace function public.ist_berechtigt()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.tb_berechtigter_benutzer b
      where b.benutzer_id = auth.uid()
    );
$$;

create or replace function public.assert_berechtigt()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.ist_berechtigt() then
    raise exception 'Keine Berechtigung fuer die Brewing-Domaene';
  end if;
end;
$$;

create or replace function public.zugang_beanspruchen()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentifizierung erforderlich';
  end if;

  lock table public.tb_berechtigter_benutzer in exclusive mode;

  if exists (select 1 from public.tb_berechtigter_benutzer where benutzer_id = v_uid) then
    return v_uid;
  end if;

  if exists (select 1 from public.tb_berechtigter_benutzer) then
    raise exception 'Der Eigentuemer wurde bereits beansprucht';
  end if;

  insert into public.tb_berechtigter_benutzer (benutzer_id) values (v_uid);
  return v_uid;
end;
$$;

create or replace function public.naechste_sudnummer()
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_berechtigt();
  return 'SUD-' || lpad(nextval('public.tb_sud_nummer_seq')::text, 6, '0');
end;
$$;

create or replace function public.rezept_erstellen(
  p_name text,
  p_beschreibung text default null,
  p_infos text default null
)
returns table (rezept_id bigint, rezeptversion_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_rezept_id bigint;
  v_version_id bigint;
begin
  perform public.assert_berechtigt();

  if v_name = '' then
    raise exception 'Rezeptname darf nicht leer sein';
  end if;

  insert into public.tb_rezept (name, beschreibung)
  values (v_name, p_beschreibung)
  returning id into v_rezept_id;

  insert into public.tb_rezeptversion (
    rezept_id, versionsnummer, name_snapshot, beschreibung_snapshot, infos
  )
  values (v_rezept_id, 1, v_name, p_beschreibung, p_infos)
  returning id into v_version_id;

  return query select v_rezept_id, v_version_id;
end;
$$;

create or replace function public.rezeptversion_erstellen(p_rezept_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rezept public.tb_rezept%rowtype;
  v_nummer integer;
  v_id bigint;
begin
  perform public.assert_berechtigt();

  select * into v_rezept
  from public.tb_rezept
  where id = p_rezept_id
  for update;

  if not found then
    raise exception 'Rezept % existiert nicht', p_rezept_id;
  end if;

  select coalesce(max(versionsnummer), 0) + 1 into v_nummer
  from public.tb_rezeptversion
  where rezept_id = p_rezept_id;

  insert into public.tb_rezeptversion (
    rezept_id, versionsnummer, name_snapshot, beschreibung_snapshot
  )
  values (v_rezept.id, v_nummer, v_rezept.name, v_rezept.beschreibung)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.rezeptversion_freigeben(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.rezeptversion_status;
begin
  perform public.assert_berechtigt();

  select status into v_status
  from public.tb_rezeptversion
  where id = p_id
  for update;

  if not found then
    raise exception 'Rezeptversion % existiert nicht', p_id;
  end if;

  if v_status <> 'ENTWURF' then
    raise exception 'Nur Entwuerfe koennen freigegeben werden';
  end if;

  update public.tb_rezeptversion
  set status = 'FREIGEGEBEN', freigegeben_am = now()
  where id = p_id;
end;
$$;

create or replace function public.rezeptversion_loeschen(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.tb_rezeptversion%rowtype;
  v_count integer;
begin
  perform public.assert_berechtigt();

  select * into v_version
  from public.tb_rezeptversion
  where id = p_id
  for update;

  if not found then
    raise exception 'Rezeptversion % existiert nicht', p_id;
  end if;

  if v_version.status = 'FREIGEGEBEN' then
    raise exception 'Freigegebene Rezeptversionen duerfen nicht geloescht werden';
  end if;

  select count(*) into v_count
  from public.tb_rezeptversion
  where rezept_id = v_version.rezept_id;

  if v_count <= 1 then
    raise exception 'Die letzte Rezeptversion eines Rezepts darf nicht geloescht werden';
  end if;

  delete from public.tb_rezeptversion where id = p_id;
end;
$$;

create or replace function public.sud_aus_rezept_erstellen(
  p_rezeptversion_id bigint,
  p_name text,
  p_sudnummer text default null,
  p_braudatum date default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.tb_rezeptversion%rowtype;
  v_sud_id bigint;
  v_sudnummer text;
  v_name text := btrim(coalesce(p_name, ''));
  v_step public.tb_rezeptschritt%rowtype;
  v_zutat public.tb_rezeptzutat%rowtype;
  v_new_step_id bigint;
  v_step_map jsonb := '{}'::jsonb;
begin
  perform public.assert_berechtigt();

  select * into v_version
  from public.tb_rezeptversion
  where id = p_rezeptversion_id
  for share;

  if not found then
    raise exception 'Rezeptversion % existiert nicht', p_rezeptversion_id;
  end if;

  if v_version.status <> 'FREIGEGEBEN' then
    raise exception 'Sude koennen nur aus freigegebenen Rezeptversionen erstellt werden';
  end if;

  if v_name = '' then
    raise exception 'Sudname darf nicht leer sein';
  end if;

  v_sudnummer := coalesce(nullif(btrim(p_sudnummer), ''), public.naechste_sudnummer());

  insert into public.tb_sud (
    rezeptversion_id,
    sudnummer,
    name,
    braudatum,
    ziel_ausschlagmenge_l,
    ziel_stammwuerze_plato,
    ziel_abv_prozent,
    ziel_ibu,
    ziel_ebc
  )
  values (
    v_version.id,
    v_sudnummer,
    v_name,
    p_braudatum,
    v_version.ziel_ausschlagmenge_l,
    v_version.ziel_stammwuerze_plato,
    v_version.ziel_abv_prozent,
    v_version.ziel_ibu,
    v_version.ziel_ebc
  )
  returning id into v_sud_id;

  for v_step in
    select * from public.tb_rezeptschritt
    where rezeptversion_id = v_version.id
    order by position
  loop
    insert into public.tb_sudschritt (
      sud_id, position, typ, name, ziel_temperatur_c, ziel_dauer_min,
      ziel_wassermenge_l, anweisung
    )
    values (
      v_sud_id, v_step.position, v_step.typ, v_step.name, v_step.temperatur_c,
      v_step.dauer_min, v_step.wassermenge_l, v_step.anweisung
    )
    returning id into v_new_step_id;

    v_step_map := v_step_map || jsonb_build_object(v_step.id::text, v_new_step_id);
  end loop;

  for v_zutat in
    select * from public.tb_rezeptzutat
    where rezeptversion_id = v_version.id
    order by id
  loop
    insert into public.tb_sudzutat (
      sud_id,
      rohstoff_id,
      sudschritt_id,
      rohstoffname_snapshot,
      einheit_snapshot,
      geplante_menge,
      alphasaeure_prozent,
      ebc,
      ziel_zugabe_nach_min,
      notizen
    )
    values (
      v_sud_id,
      v_zutat.rohstoff_id,
      case
        when v_zutat.rezeptschritt_id is null then null
        else (v_step_map ->> v_zutat.rezeptschritt_id::text)::bigint
      end,
      v_zutat.rohstoffname_snapshot,
      v_zutat.einheit_snapshot,
      v_zutat.menge,
      v_zutat.alphasaeure_prozent,
      v_zutat.ebc,
      v_zutat.zugabe_nach_min,
      v_zutat.notizen
    );
  end loop;

  return v_sud_id;
end;
$$;

create or replace function public.lagerbewegung_erfassen(
  p_lagercharge_id bigint,
  p_typ public.lagerbewegung_typ,
  p_mengen_delta numeric,
  p_idempotenzschluessel text,
  p_sudzutat_id bigint default null,
  p_zeitpunkt timestamptz default now(),
  p_notizen text default null
)
returns public.tb_lagerbewegung
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_schluessel text := btrim(coalesce(p_idempotenzschluessel, ''));
  v_key_id bigint;
  v_existing_id bigint;
  v_row public.tb_lagerbewegung%rowtype;
begin
  perform public.assert_berechtigt();

  if v_schluessel = '' then
    raise exception 'Idempotenzschluessel darf nicht leer sein';
  end if;

  if p_mengen_delta = 0 then
    raise exception 'Mengendelta darf nicht null sein';
  end if;

  insert into public.tb_idempotenz (schluessel, operation)
  values (v_schluessel, 'lagerbewegung')
  on conflict (operation, schluessel) do nothing
  returning id into v_key_id;

  if v_key_id is null then
    select lagerbewegung_id into v_existing_id
    from public.tb_idempotenz
    where operation = 'lagerbewegung' and schluessel = v_schluessel;

    if v_existing_id is null then
      raise exception 'Idempotenzschluessel existiert ohne Ergebnis';
    end if;

    select * into v_row from public.tb_lagerbewegung where id = v_existing_id;
    if not found then
      raise exception 'Gespeicherte Lagerbewegung % existiert nicht', v_existing_id;
    end if;
    return v_row;
  end if;

  insert into public.tb_lagerbewegung (
    lagercharge_id, sudzutat_id, zeitpunkt, typ, mengen_delta, notizen
  )
  values (
    p_lagercharge_id, p_sudzutat_id, p_zeitpunkt, p_typ, p_mengen_delta, p_notizen
  )
  returning * into v_row;

  update public.tb_idempotenz
  set lagerbewegung_id = v_row.id
  where id = v_key_id;

  return v_row;
end;
$$;

create or replace function public.sudzutat_verbrauch_netto(p_sudzutat_id bigint)
returns numeric
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_net numeric(12, 4);
begin
  perform public.assert_berechtigt();

  select coalesce(-sum(mengen_delta), 0)::numeric(12, 4) into v_net
  from public.tb_lagerbewegung
  where sudzutat_id = p_sudzutat_id;

  return v_net;
end;
$$;

create or replace function public.sudzutat_ist_menge_setzen(
  p_sudzutat_id bigint,
  p_ist_menge numeric,
  p_aus_lager boolean default false
)
returns public.tb_sudzutat
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.tb_sudzutat%rowtype;
  v_net numeric(12, 4);
begin
  perform public.assert_berechtigt();

  if p_ist_menge is not null and p_ist_menge < 0 then
    raise exception 'Ist-Menge darf nicht negativ sein';
  end if;

  select * into v_row
  from public.tb_sudzutat
  where id = p_sudzutat_id
  for update;

  if not found then
    raise exception 'Sudzutat % existiert nicht', p_sudzutat_id;
  end if;

  if p_aus_lager then
    v_net := public.sudzutat_verbrauch_netto(p_sudzutat_id);
    if p_ist_menge is distinct from v_net then
      raise exception 'Ist-Menge % entspricht nicht dem Nettolagerverbrauch %', p_ist_menge, v_net;
    end if;
  end if;

  update public.tb_sudzutat
  set ist_menge = p_ist_menge
  where id = p_sudzutat_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.sudzutat_ersetzen(
  p_sudzutat_id bigint,
  p_rohstoff_id bigint,
  p_menge numeric default null,
  p_alphasaeure_prozent numeric default null,
  p_ebc numeric default null,
  p_notizen text default null
)
returns public.tb_sudzutat
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.tb_sudzutat%rowtype;
  v_new_unit public.basiseinheit;
  v_row public.tb_sudzutat%rowtype;
begin
  perform public.assert_berechtigt();

  select * into v_old
  from public.tb_sudzutat
  where id = p_sudzutat_id
  for update;

  if not found then
    raise exception 'Sudzutat % existiert nicht', p_sudzutat_id;
  end if;

  if exists (select 1 from public.tb_lagerbewegung where sudzutat_id = p_sudzutat_id) then
    raise exception 'Sudzutat mit Lagerbewegungen darf nicht ersetzt werden; neue Zeile anlegen';
  end if;

  select basiseinheit into v_new_unit
  from public.tb_rohstoff
  where id = p_rohstoff_id;

  if not found then
    raise exception 'Rohstoff % existiert nicht', p_rohstoff_id;
  end if;

  if v_new_unit <> v_old.einheit_snapshot and p_menge is null then
    raise exception 'Bei Wechsel der Basiseinheit muss die Menge neu eingegeben werden';
  end if;

  if v_new_unit <> v_old.einheit_snapshot then
    perform set_config('app.erlaube_einheitenwechsel', 'on', true);
  end if;

  update public.tb_sudzutat
  set
    rohstoff_id = p_rohstoff_id,
    geplante_menge = coalesce(p_menge, geplante_menge),
    notizen = coalesce(p_notizen, notizen)
  where id = p_sudzutat_id;

  if v_new_unit <> v_old.einheit_snapshot then
    perform set_config('app.erlaube_einheitenwechsel', 'off', true);
  end if;

  update public.tb_sudzutat
  set alphasaeure_prozent = p_alphasaeure_prozent, ebc = p_ebc
  where id = p_sudzutat_id
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges and RLS
-- ---------------------------------------------------------------------------

alter table public.tb_rohstoff enable row level security;
alter table public.tb_lagercharge enable row level security;
alter table public.tb_rezept enable row level security;
alter table public.tb_rezeptversion enable row level security;
alter table public.tb_rezeptschritt enable row level security;
alter table public.tb_rezeptzutat enable row level security;
alter table public.tb_sud enable row level security;
alter table public.tb_sudschritt enable row level security;
alter table public.tb_sudzutat enable row level security;
alter table public.tb_lagerbewegung enable row level security;
alter table public.tb_geraet enable row level security;
alter table public.tb_sudgeraet enable row level security;
alter table public.tb_berechtigter_benutzer enable row level security;
alter table public.tb_idempotenz enable row level security;

revoke all on table
  public.tb_rohstoff,
  public.tb_lagercharge,
  public.tb_rezept,
  public.tb_rezeptversion,
  public.tb_rezeptschritt,
  public.tb_rezeptzutat,
  public.tb_sud,
  public.tb_sudschritt,
  public.tb_sudzutat,
  public.tb_lagerbewegung,
  public.tb_geraet,
  public.tb_sudgeraet,
  public.tb_berechtigter_benutzer,
  public.tb_idempotenz
from anon, authenticated;

grant select, insert, update, delete on table
  public.tb_rohstoff,
  public.tb_lagercharge,
  public.tb_rezept,
  public.tb_rezeptversion,
  public.tb_rezeptschritt,
  public.tb_rezeptzutat,
  public.tb_sud,
  public.tb_sudschritt,
  public.tb_sudzutat,
  public.tb_geraet,
  public.tb_sudgeraet
to authenticated;

grant select on table public.tb_lagerbewegung to authenticated;

create policy p_tb_rohstoff_all on public.tb_rohstoff
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_lagercharge_all on public.tb_lagercharge
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_rezept_all on public.tb_rezept
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_rezeptversion_all on public.tb_rezeptversion
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_rezeptschritt_all on public.tb_rezeptschritt
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_rezeptzutat_all on public.tb_rezeptzutat
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_sud_all on public.tb_sud
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_sudschritt_all on public.tb_sudschritt
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_sudzutat_all on public.tb_sudzutat
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_geraet_all on public.tb_geraet
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_sudgeraet_all on public.tb_sudgeraet
  for all to authenticated using (public.ist_berechtigt()) with check (public.ist_berechtigt());
create policy p_tb_lagerbewegung_select on public.tb_lagerbewegung
  for select to authenticated using (public.ist_berechtigt());

revoke all on sequence public.tb_sud_nummer_seq from anon, authenticated;

revoke all on function public.ist_berechtigt() from public, anon, authenticated;
revoke all on function public.assert_berechtigt() from public, anon, authenticated;
revoke all on function public.zugang_beanspruchen() from public, anon, authenticated;
revoke all on function public.naechste_sudnummer() from public, anon, authenticated;
revoke all on function public.rezept_erstellen(text, text, text) from public, anon, authenticated;
revoke all on function public.rezeptversion_erstellen(bigint) from public, anon, authenticated;
revoke all on function public.rezeptversion_freigeben(bigint) from public, anon, authenticated;
revoke all on function public.rezeptversion_loeschen(bigint) from public, anon, authenticated;
revoke all on function public.sud_aus_rezept_erstellen(bigint, text, text, date)
  from public, anon, authenticated;
revoke all on function public.lagerbewegung_erfassen(
  bigint, public.lagerbewegung_typ, numeric, text, bigint, timestamptz, text
) from public, anon, authenticated;
revoke all on function public.sudzutat_verbrauch_netto(bigint) from public, anon, authenticated;
revoke all on function public.sudzutat_ist_menge_setzen(bigint, numeric, boolean)
  from public, anon, authenticated;
revoke all on function public.sudzutat_ersetzen(bigint, bigint, numeric, numeric, numeric, text)
  from public, anon, authenticated;

grant execute on function public.ist_berechtigt() to authenticated;
grant execute on function public.zugang_beanspruchen() to authenticated;
grant execute on function public.naechste_sudnummer() to authenticated;
grant execute on function public.rezept_erstellen(text, text, text) to authenticated;
grant execute on function public.rezeptversion_erstellen(bigint) to authenticated;
grant execute on function public.rezeptversion_freigeben(bigint) to authenticated;
grant execute on function public.rezeptversion_loeschen(bigint) to authenticated;
grant execute on function public.sud_aus_rezept_erstellen(bigint, text, text, date) to authenticated;
grant execute on function public.lagerbewegung_erfassen(
  bigint, public.lagerbewegung_typ, numeric, text, bigint, timestamptz, text
) to authenticated;
grant execute on function public.sudzutat_verbrauch_netto(bigint) to authenticated;
grant execute on function public.sudzutat_ist_menge_setzen(bigint, numeric, boolean)
  to authenticated;
grant execute on function public.sudzutat_ersetzen(bigint, bigint, numeric, numeric, numeric, text)
  to authenticated;

-- Trigger functions are internal; no application role needs direct execute.
revoke all on function public.tf_rezeptversion_guard() from public, anon, authenticated;
revoke all on function public.tf_rezeptchild_guard() from public, anon, authenticated;
revoke all on function public.tf_rezeptzutat_snapshot() from public, anon, authenticated;
revoke all on function public.tf_sudzutat_snapshot() from public, anon, authenticated;
revoke all on function public.tf_rohstoff_base_unit_guard() from public, anon, authenticated;
revoke all on function public.tf_lagercharge_guard() from public, anon, authenticated;
revoke all on function public.tf_sud_guard() from public, anon, authenticated;
revoke all on function public.tf_lagerbewegung_guard() from public, anon, authenticated;
revoke all on function public.tf_sudschritt_duration() from public, anon, authenticated;
revoke all on function public.tf_sudgeraet_guard() from public, anon, authenticated;
