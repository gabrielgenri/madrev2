create or replace function public.validate_editorial_review_event()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  v_unit public.editorial_units;
  v_latest_version_id uuid;
  v_latest_event_type text;
  v_latest_event_version_id uuid;
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
  select id into v_latest_version_id from public.editorial_versions
   where editorial_unit_id = new.editorial_unit_id order by version_number desc limit 1;
  if v_latest_version_id is null or new.source_version_id <> v_latest_version_id then
    raise exception 'La unidad cambió: ejecutá nuevamente el control de calidad';
  end if;
  select * into v_quality from public.editorial_quality_reviews
   where id = new.quality_review_id and editorial_unit_id = new.editorial_unit_id
     and source_version_id = v_latest_version_id;
  if not found then raise exception 'El control de calidad no corresponde a la versión vigente'; end if;
  select coalesce(max(updated_at), 'epoch'::timestamptz) into v_latest_format_change
   from public.editorial_formats where editorial_unit_id = new.editorial_unit_id;
  if v_quality.created_at < v_latest_format_change then
    raise exception 'Hay formatos modificados después del control: ejecutalo nuevamente';
  end if;
  select count(*) into v_format_count from public.editorial_formats
   where editorial_unit_id = new.editorial_unit_id and not is_stale
     and source_version_id = v_latest_version_id
     and length(trim(title)) > 0 and length(trim(content)) > 0;
  if v_format_count <> 6 then
    raise exception 'Se requieren los seis formatos completos y vinculados a la versión madre vigente';
  end if;
  select count(*) into v_critical_count from jsonb_array_elements(v_quality.findings) finding
   where finding->>'severity' = 'critical';
  if v_critical_count > 0 then raise exception 'El control de calidad contiene alertas críticas pendientes'; end if;
  select event_type, source_version_id into v_latest_event_type, v_latest_event_version_id
   from public.editorial_review_events
   where editorial_unit_id = new.editorial_unit_id order by created_at desc, id desc limit 1;

  if new.event_type = 'review_requested' then
    if v_unit.status <> 'draft' then raise exception 'Solo se puede solicitar revisión desde Borrador'; end if;
    if not (v_unit.created_by = auth.uid() or v_unit.assigned_to = auth.uid()
      or public.has_role('editor') or public.has_role('admin')) then
      raise exception 'No tenés permiso para solicitar esta revisión';
    end if;
    if v_latest_event_type is not null
      and v_latest_event_type <> 'changes_requested'
      and v_latest_event_version_id = v_latest_version_id then
      raise exception 'La unidad ya tiene una solicitud de revisión abierta o aprobada para esta versión';
    end if;
  elsif new.event_type = 'changes_requested' then
    if not (public.has_role('reviewer') or public.has_role('editor') or public.has_role('admin')) then
      raise exception 'Solo un revisor o editor puede solicitar correcciones';
    end if;
    if v_unit.status <> 'draft' or v_latest_event_type <> 'review_requested'
      or v_latest_event_version_id is distinct from v_latest_version_id then
      raise exception 'No hay una solicitud de revisión vigente para esta versión';
    end if;
  elsif new.event_type = 'approved' then
    if not (public.has_role('editor') or public.has_role('admin')) then
      raise exception 'Solo un editor o administrador puede aprobar una unidad';
    end if;
    if v_unit.status <> 'draft' or v_latest_event_type <> 'review_requested'
      or v_latest_event_version_id is distinct from v_latest_version_id then
      raise exception 'La unidad no tiene una solicitud vigente para aprobar';
    end if;
  else
    raise exception 'Decisión editorial no permitida';
  end if;
  return new;
end;
$function$;