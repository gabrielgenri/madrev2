-- Madre: guardia de publicación editorial
-- Esta migración complementa la migración fundacional remota 20261114034956.
-- Regla: solo editor/admin pueden cambiar una unidad a published.

create or replace function public.guard_editorial_publish_status()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if new.status = 'published' and not (
    public.has_role('editor') or public.has_role('admin')
  ) then
    raise exception 'Only editor or admin can publish an editorial unit';
  end if;

  return new;
end;
$function$;

drop trigger if exists editorial_units_guard_publish on public.editorial_units;

create trigger editorial_units_guard_publish
before insert or update of status on public.editorial_units
for each row
execute function public.guard_editorial_publish_status();
