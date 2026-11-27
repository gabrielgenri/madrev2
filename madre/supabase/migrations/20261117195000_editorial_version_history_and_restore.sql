create unique index if not exists editorial_versions_unit_version_uidx
  on public.editorial_versions (editorial_unit_id, version_number);

create index if not exists editorial_versions_unit_created_idx
  on public.editorial_versions (editorial_unit_id, created_at desc);

create or replace function public.capture_editorial_version()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  next_version integer;
  note text;
  snapshot_data jsonb;
begin
  if tg_op = 'UPDATE' and
     old.title is not distinct from new.title and
     old.slug is not distinct from new.slug and
     old.summary is not distinct from new.summary and
     old.content_mother is not distinct from new.content_mother and
     old.status is not distinct from new.status and
     old.metadata is not distinct from new.metadata then
    return new;
  end if;

  select coalesce(max(version_number), 0) + 1
    into next_version
    from public.editorial_versions
   where editorial_unit_id = new.id;

  note := nullif(trim(current_setting('madre.editorial_change_note', true)), '');
  if note is null then
    note := case when tg_op = 'INSERT'
      then 'Creación de la unidad editorial'
      else 'Edición editorial (motivo no especificado desde un cliente externo)'
    end;
  end if;

  snapshot_data := jsonb_build_object(
    'id', new.id, 'title', new.title, 'slug', new.slug,
    'summary', new.summary, 'content_mother', new.content_mother,
    'status', new.status, 'metadata', new.metadata,
    'assigned_to', new.assigned_to, 'created_by', new.created_by,
    'created_at', new.created_at, 'updated_at', new.updated_at,
    'published_at', new.published_at
  );

  insert into public.editorial_versions (
    editorial_unit_id, version_number, snapshot, change_note, created_by
  ) values (new.id, next_version, snapshot_data, note, auth.uid());

  return new;
end;
$$;

drop trigger if exists editorial_units_capture_version on public.editorial_units;
create trigger editorial_units_capture_version
after insert or update of title, slug, summary, content_mother, status, metadata
on public.editorial_units
for each row execute function public.capture_editorial_version();

create or replace function public.update_editorial_unit_with_version(
  p_unit_id uuid, p_changes jsonb, p_change_note text
)
returns public.editorial_units
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  updated_unit public.editorial_units;
  allowed_keys text[] := array['title', 'summary', 'content_mother'];
  supplied_keys text[];
begin
  if auth.uid() is null then
    raise exception 'Se requiere una sesión autenticada';
  end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'object' then
    raise exception 'Los cambios deben enviarse como un objeto JSON';
  end if;
  if p_change_note is null or length(trim(p_change_note)) < 3 or length(trim(p_change_note)) > 500 then
    raise exception 'Indicá un motivo de cambio de entre 3 y 500 caracteres';
  end if;

  select array_agg(key) into supplied_keys from jsonb_object_keys(p_changes) as keys(key);
  if supplied_keys is null or exists (
    select 1 from unnest(supplied_keys) as key where not (key = any(allowed_keys))
  ) then
    raise exception 'La solicitud contiene campos no permitidos';
  end if;
  if p_changes ? 'title' and length(trim(coalesce(p_changes->>'title', ''))) = 0 then
    raise exception 'El título no puede quedar vacío';
  end if;

  perform set_config('madre.editorial_change_note', trim(p_change_note), true);
  update public.editorial_units
     set title = case when p_changes ? 'title' then p_changes->>'title' else title end,
         summary = case when p_changes ? 'summary' then p_changes->>'summary' else summary end,
         content_mother = case when p_changes ? 'content_mother' then p_changes->>'content_mother' else content_mother end
   where id = p_unit_id
   returning * into updated_unit;

  if not found then
    raise exception 'No se encontró la unidad o no tenés permiso para modificarla';
  end if;
  return updated_unit;
end;
$$;

revoke all on function public.update_editorial_unit_with_version(uuid, jsonb, text) from public;
revoke all on function public.update_editorial_unit_with_version(uuid, jsonb, text) from anon;
grant execute on function public.update_editorial_unit_with_version(uuid, jsonb, text) to authenticated;

create or replace function public.prevent_editorial_version_update()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  raise exception 'Las versiones editoriales son inmutables';
end;
$$;

drop trigger if exists editorial_versions_immutable on public.editorial_versions;
create trigger editorial_versions_immutable
before update on public.editorial_versions
for each row execute function public.prevent_editorial_version_update();

insert into public.editorial_versions (
  editorial_unit_id, version_number, snapshot, change_note, created_by, created_at
)
select u.id, 1,
  jsonb_build_object(
    'id', u.id, 'title', u.title, 'slug', u.slug, 'summary', u.summary,
    'content_mother', u.content_mother, 'status', u.status, 'metadata', u.metadata,
    'assigned_to', u.assigned_to, 'created_by', u.created_by,
    'created_at', u.created_at, 'updated_at', u.updated_at, 'published_at', u.published_at
  ),
  'Versión inicial incorporada al activar el versionado',
  u.created_by, u.created_at
from public.editorial_units u
where not exists (
  select 1 from public.editorial_versions v where v.editorial_unit_id = u.id
);
