create table if not exists public.editorial_review_events (
  id uuid primary key default gen_random_uuid(),
  editorial_unit_id uuid not null references public.editorial_units(id) on delete cascade,
  source_version_id uuid not null references public.editorial_versions(id) on delete restrict,
  quality_review_id uuid not null references public.editorial_quality_reviews(id) on delete restrict,
  event_type text not null check (event_type in ('review_requested','changes_requested','approved')),
  note text not null check (length(trim(note)) between 3 and 3000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index editorial_review_events_unit_created_idx
  on public.editorial_review_events (editorial_unit_id, created_at desc);
create index editorial_review_events_quality_review_idx
  on public.editorial_review_events (quality_review_id);
create index editorial_review_events_author_idx
  on public.editorial_review_events (created_by);

alter table public.editorial_review_events enable row level security;
revoke all on public.editorial_review_events from anon, authenticated;
grant select, insert on public.editorial_review_events to authenticated;

create policy editorial_review_events_select_via_unit
on public.editorial_review_events for select to authenticated
using (exists (
  select 1 from public.editorial_units u
  where u.id = editorial_review_events.editorial_unit_id
));
create policy editorial_review_events_insert_by_authorized_actor
on public.editorial_review_events for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (event_type = 'review_requested' and exists (
      select 1 from public.editorial_units u
      where u.id = editorial_review_events.editorial_unit_id
        and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
          or public.has_role('editor') or public.has_role('admin'))
    ))
    or (event_type = 'changes_requested' and
      (public.has_role('reviewer') or public.has_role('editor') or public.has_role('admin')))
    or (event_type = 'approved' and (public.has_role('editor') or public.has_role('admin')))
  )
);

create or replace function public.validate_editorial_review_event()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  v_unit public.editorial_units;
  v_latest_version_id uuid;
  v_latest_event_type text;
  v_quality public.editorial_quality_reviews;
  v_latest_format_change timestamptz;
  v_format_count integer;
  v_critical_count integer;
begin
  if auth.uid() is null or new.created_by <> auth.uid() then
    raise exception 'La identidad del responsable no es válida';
  end if;

  select * into v_unit from public.editorial_units where id = new.editorial_unit_id;
  if not found then raise exception 'No existe la unidad editorial'; end if;

  select id into v_latest_version_id
  from public.editorial_versions
  where editorial_unit_id = new.editorial_unit_id
  order by version_number desc limit 1;

  if v_latest_version_id is null or new.source_version_id <> v_latest_version_id then
    raise exception 'La unidad cambió: ejecutá nuevamente el control de calidad';
  end if;

  select * into v_quality from public.editorial_quality_reviews
  where id = new.quality_review_id
    and editorial_unit_id = new.editorial_unit_id
    and source_version_id = v_latest_version_id;

  if not found then raise exception 'El control de calidad no corresponde a la versión vigente'; end if;

  select greatest(
    coalesce(max(updated_at), 'epoch'::timestamptz),
    coalesce(max(created_at), 'epoch'::timestamptz)
  ) into v_latest_format_change
  from public.editorial_formats where editorial_unit_id = new.editorial_unit_id;

  if v_quality.created_at < v_latest_format_change then
    raise exception 'Hay formatos modificados después del control: ejecutalo nuevamente';
  end if;

  select count(*) into v_format_count
  from public.editorial_formats
  where editorial_unit_id = new.editorial_unit_id
    and not is_stale
    and source_version_id = v_latest_version_id
    and length(trim(title)) > 0
    and length(trim(content)) > 0;

  if v_format_count <> 6 then
    raise exception 'Se requieren los seis formatos completos y vinculados a la versión madre vigente';
  end if;

  select count(*) into v_critical_count
  from jsonb_array_elements(v_quality.findings) finding
  where finding->>'severity' = 'critical';

  if v_critical_count > 0 then
    raise exception 'El control de calidad contiene alertas críticas pendientes';
  end if;

  select event_type into v_latest_event_type
  from public.editorial_review_events
  where editorial_unit_id = new.editorial_unit_id
  order by created_at desc, id desc limit 1;

  if new.event_type = 'review_requested' then
    if v_unit.status <> 'draft' then raise exception 'Solo se puede solicitar revisión desde Borrador'; end if;
    if not (v_unit.created_by = auth.uid() or v_unit.assigned_to = auth.uid()
      or public.has_role('editor') or public.has_role('admin')) then
      raise exception 'No tenés permiso para solicitar esta revisión';
    end if;
    if v_latest_event_type is not null and v_latest_event_type <> 'changes_requested' then
      raise exception 'La unidad ya tiene una solicitud de revisión abierta o aprobada';
    end if;
  elsif new.event_type = 'changes_requested' then
    if not (public.has_role('reviewer') or public.has_role('editor') or public.has_role('admin')) then
      raise exception 'Solo un revisor o editor puede solicitar correcciones';
    end if;
    if v_unit.status <> 'draft' or v_latest_event_type <> 'review_requested' then
      raise exception 'No hay una solicitud de revisión pendiente';
    end if;
  elsif new.event_type = 'approved' then
    if not (public.has_role('editor') or public.has_role('admin')) then
      raise exception 'Solo un editor o administrador puede aprobar una unidad';
    end if;
    if v_unit.status <> 'draft' or v_latest_event_type <> 'review_requested' then
      raise exception 'La unidad no tiene una solicitud vigente para aprobar';
    end if;
  else
    raise exception 'Decisión editorial no permitida';
  end if;

  return new;
end;
$function$;

create trigger editorial_review_events_validate
before insert on public.editorial_review_events
for each row execute function public.validate_editorial_review_event();

create or replace function public.apply_editorial_review_approval()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if new.event_type = 'approved' then
    update public.editorial_units
    set status = 'reviewed'
    where id = new.editorial_unit_id and status = 'draft';
    if not found then raise exception 'No se pudo actualizar el estado editorial a Revisado'; end if;
  end if;
  return new;
end;
$function$;

create trigger editorial_review_events_apply_approval
after insert on public.editorial_review_events
for each row execute function public.apply_editorial_review_approval();

create or replace function public.guard_editorial_publish_status()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if new.status = 'reviewed' and old.status is distinct from new.status
    and not (public.has_role('editor') or public.has_role('admin')) then
    raise exception 'Only editor or admin can approve an editorial unit';
  end if;
  if new.status = 'published' and not (
    public.has_role('editor') or public.has_role('admin')
  ) then
    raise exception 'Only editor or admin can publish an editorial unit';
  end if;
  if new.status = 'published' and old.status is distinct from 'reviewed' then
    raise exception 'An editorial unit must be reviewed before publication';
  end if;
  return new;
end;
$function$;

create or replace function public.record_editorial_review_event(
  p_unit_id uuid,
  p_event_type text,
  p_note text
)
returns public.editorial_review_events
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_version_id uuid;
  v_quality_id uuid;
  v_event public.editorial_review_events;
begin
  if v_user_id is null then raise exception 'Se requiere una sesión autenticada'; end if;
  if p_event_type not in ('review_requested','changes_requested','approved') then
    raise exception 'Decisión editorial no permitida';
  end if;
  if p_note is null or length(trim(p_note)) < 3 or length(trim(p_note)) > 3000 then
    raise exception 'El motivo debe tener entre 3 y 3000 caracteres';
  end if;

  select id into v_version_id from public.editorial_versions
  where editorial_unit_id = p_unit_id order by version_number desc limit 1;

  select id into v_quality_id from public.editorial_quality_reviews
  where editorial_unit_id = p_unit_id and source_version_id = v_version_id
  order by created_at desc limit 1;

  if v_version_id is null or v_quality_id is null then
    raise exception 'Ejecutá primero el control de calidad sobre la versión vigente';
  end if;

  insert into public.editorial_review_events (
    editorial_unit_id, source_version_id, quality_review_id,
    event_type, note, created_by
  ) values (
    p_unit_id, v_version_id, v_quality_id, p_event_type, trim(p_note), v_user_id
  ) returning * into v_event;

  return v_event;
end;
$function$;

revoke all on function public.record_editorial_review_event(uuid,text,text) from public, anon;
grant execute on function public.record_editorial_review_event(uuid,text,text) to authenticated;
