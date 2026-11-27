create or replace function public.save_editorial_format(
  p_unit_id uuid, p_format_type text, p_title text, p_content text
)
returns public.editorial_formats
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  latest_version_id uuid;
  saved_format public.editorial_formats;
  allowed_formats text[] := array['web_seo','video_reel_60','podcast_primera_hora','instagram_carousel_8','newsletter','whatsapp'];
begin
  if auth.uid() is null then raise exception 'Se requiere una sesión autenticada'; end if;
  if p_format_type is null or not (p_format_type = any(allowed_formats)) then
    raise exception 'Formato editorial no permitido';
  end if;
  if length(trim(coalesce(p_title, ''))) = 0 or length(trim(p_title)) > 240 then
    raise exception 'El título es obligatorio y no puede superar 240 caracteres';
  end if;
  if p_content is null or length(trim(p_content)) = 0 or length(p_content) > 60000 then
    raise exception 'El contenido es obligatorio y no puede superar 60.000 caracteres';
  end if;

  select id into latest_version_id from public.editorial_versions
   where editorial_unit_id = p_unit_id order by version_number desc limit 1;
  if latest_version_id is null then
    raise exception 'La unidad todavía no tiene una versión madre registrada';
  end if;

  insert into public.editorial_formats (
    editorial_unit_id, format_type, title, content, status, source_version_id, is_stale, created_by, updated_at
  ) values (
    p_unit_id, p_format_type, trim(p_title), p_content, 'draft', latest_version_id, false, auth.uid(), now()
  )
  on conflict (editorial_unit_id, format_type)
  do update set title = excluded.title, content = excluded.content, status = 'draft',
    source_version_id = excluded.source_version_id, is_stale = false, updated_at = now()
  returning * into saved_format;
  return saved_format;
end;
$$;

revoke all on function public.save_editorial_format(uuid, text, text, text) from public;
revoke all on function public.save_editorial_format(uuid, text, text, text) from anon;
grant execute on function public.save_editorial_format(uuid, text, text, text) to authenticated;
