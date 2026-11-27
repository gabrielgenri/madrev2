create or replace function public.guard_editorial_work_assignment_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'La autoría original de una unidad no puede modificarse';
  end if;
  if (
    new.assigned_to is distinct from old.assigned_to
    or new.priority is distinct from old.priority
    or new.due_at is distinct from old.due_at
  ) and not (public.has_role('editor') or public.has_role('admin')) then
    raise exception 'Solo editor/admin puede cambiar asignación, prioridad o vencimiento';
  end if;
  return new;
end;
$function$;

drop trigger if exists editorial_units_guard_work_assignment on public.editorial_units;
create trigger editorial_units_guard_work_assignment
before update of assigned_to, priority, due_at, created_by
on public.editorial_units
for each row execute function public.guard_editorial_work_assignment_fields();