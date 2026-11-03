-- Integrity hardening for direct table writes.
--
-- The RPCs already enforce these rules. These triggers close the bypass paths available to
-- authorized users through direct table writes:
--   1. a new recipe version must start as a draft;
--   2. a batch must reference a released recipe version;
--   3. a batch ingredient's actual amount must reconcile with linked movements when present.

create or replace function public.tf_rezeptversion_insert_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'ENTWURF' or new.freigegeben_am is not null then
    raise exception 'Neue Rezeptversionen muessen als Entwurf beginnen';
  end if;
  return new;
end;
$$;

create trigger trg_tb_rezeptversion_insert_guard
before insert on public.tb_rezeptversion
for each row execute function public.tf_rezeptversion_insert_guard();

create or replace function public.tf_sud_source_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.rezeptversion_status;
begin
  select status into v_status
  from public.tb_rezeptversion
  where id = new.rezeptversion_id;

  if v_status is null then
    raise exception 'Rezeptversion % existiert nicht', new.rezeptversion_id;
  end if;

  if v_status <> 'FREIGEGEBEN' then
    raise exception 'Sude duerfen nur aus freigegebenen Rezeptversionen entstehen';
  end if;

  return new;
end;
$$;

create trigger trg_tb_sud_source_guard
before insert or update on public.tb_sud
for each row execute function public.tf_sud_source_guard();

create or replace function public.tf_sudzutat_ist_menge_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_net numeric(12, 4);
begin
  if new.ist_menge is not distinct from old.ist_menge then
    return new;
  end if;

  if exists (select 1 from public.tb_lagerbewegung where sudzutat_id = new.id) then
    select coalesce(-sum(mengen_delta), 0)::numeric(12, 4) into v_net
    from public.tb_lagerbewegung
    where sudzutat_id = new.id;

    if new.ist_menge is distinct from v_net then
      raise exception 'Ist-Menge % entspricht nicht dem Nettolagerverbrauch %', new.ist_menge, v_net;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_tb_sudzutat_ist_menge_guard
before update of ist_menge on public.tb_sudzutat
for each row execute function public.tf_sudzutat_ist_menge_guard();

revoke all on function public.tf_rezeptversion_insert_guard() from public, anon, authenticated;
revoke all on function public.tf_sud_source_guard() from public, anon, authenticated;
revoke all on function public.tf_sudzutat_ist_menge_guard() from public, anon, authenticated;
