alter table public.editorial_units
  add column if not exists priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  add column if not exists due_at timestamptz;

create index if not exists editorial_units_assigned_due_idx
  on public.editorial_units (assigned_to, due_at);
create index if not exists editorial_units_status_due_idx
  on public.editorial_units (status, due_at);

create table public.editorial_work_events (
  id uuid primary key default gen_random_uuid(),
  editorial_unit_id uuid not null references public.editorial_units(id) on delete restrict,
  from_assigned_to uuid references auth.users(id) on delete set null,
  to_assigned_to uuid references auth.users(id) on delete set null,
  from_priority text check (from_priority is null or from_priority in ('low','normal','high','urgent')),
  to_priority text not null check (to_priority in ('low','normal','high','urgent')),
  from_due_at timestamptz,
  to_due_at timestamptz,
  note text not null check (length(trim(note)) between 3 and 1000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp()
);

create index editorial_work_events_unit_created_idx
  on public.editorial_work_events (editorial_unit_id, created_at desc);
create index editorial_work_events_actor_idx
  on public.editorial_work_events (created_by);

alter table public.editorial_work_events enable row level security;
revoke all on public.editorial_work_events from anon, authenticated;
grant select, insert on public.editorial_work_events to authenticated;

create policy editorial_work_events_select_via_unit
on public.editorial_work_events for select to authenticated
using (exists (
  select 1 from public.editorial_units u
  where u.id = editorial_work_events.editorial_unit_id
));
create policy editorial_work_events_insert_by_manager
on public.editorial_work_events for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (public.has_role('editor') or public.has_role('admin'))
);

create or replace function public.validate_editorial_work_event()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare v_unit public.editorial_units;
begin
  if auth.uid() is null or new.created_by <> auth.uid()
    or not (public.has_role('editor') or public.has_role('admin')) then
    raise exception 'Solo editor/admin autenticado puede registrar asignaciones';
  end if;
  select * into v_unit from public.editorial_units where id = new.editorial_unit_id;
  if not found then raise exception 'No existe la unidad editorial'; end if;
  if v_unit.assigned_to is distinct from new.to_assigned_to
    or v_unit.priority is distinct from new.to_priority
    or v_unit.due_at is distinct from new.to_due_at then
    raise exception 'El evento no coincide con la asignación vigente';
  end if;
  return new;
end;
$function$;

create trigger editorial_work_events_validate
before insert on public.editorial_work_events
for each row execute function public.validate_editorial_work_event();

create or replace function public.assign_editorial_work(
  p_unit_id uuid,
  p_assigned_to uuid,
  p_priority text,
  p_due_at timestamptz,
  p_note text
)
returns public.editorial_units
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_unit public.editorial_units;
  v_updated public.editorial_units;
begin
  if v_actor is null then raise exception 'Se requiere una sesión autenticada'; end if;
  if not (public.has_role('editor') or public.has_role('admin')) then
    raise exception 'Solo editor/admin puede asignar tareas y prioridades';
  end if;
  if p_priority not in ('low','normal','high','urgent') then
    raise exception 'Prioridad no válida';
  end if;
  if p_note is null or length(trim(p_note)) < 3 or length(trim(p_note)) > 1000 then
    raise exception 'El motivo debe tener entre 3 y 1000 caracteres';
  end if;
  if p_assigned_to is not null and not exists (
    select 1 from public.user_roles
    where user_id = p_assigned_to
      and role in ('collaborator','writer','reviewer','editor','admin')
  ) then
    raise exception 'La persona asignada debe tener un rol activo en Madre';
  end if;

  select * into v_unit from public.editorial_units
  where id = p_unit_id for update;
  if not found then raise exception 'No existe la unidad editorial'; end if;

  update public.editorial_units
  set assigned_to = p_assigned_to, priority = p_priority, due_at = p_due_at
  where id = p_unit_id
  returning * into v_updated;

  insert into public.editorial_work_events (
    editorial_unit_id, from_assigned_to, to_assigned_to,
    from_priority, to_priority, from_due_at, to_due_at, note, created_by
  ) values (
    p_unit_id, v_unit.assigned_to, p_assigned_to,
    v_unit.priority, p_priority, v_unit.due_at, p_due_at, trim(p_note), v_actor
  );

  return v_updated;
end;
$function$;

revoke all on function public.assign_editorial_work(uuid,uuid,text,timestamptz,text) from public, anon;
grant execute on function public.assign_editorial_work(uuid,uuid,text,timestamptz,text) to authenticated;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_editor_admin
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or public.has_role('editor')
  or public.has_role('admin')
);

drop policy if exists roles_select_self_or_admin on public.user_roles;
create policy roles_select_self_or_editor_admin
on public.user_roles for select to authenticated
using (
  user_id = (select auth.uid())
  or public.has_role('editor')
  or public.has_role('admin')
);

drop policy if exists editorial_units_update on public.editorial_units;
create policy editorial_units_update
on public.editorial_units for update to authenticated
using (
  created_by = (select auth.uid())
  or assigned_to = (select auth.uid())
  or public.has_role('editor')
  or public.has_role('admin')
)
with check (
  created_by = (select auth.uid())
  or (assigned_to = (select auth.uid()) and status = 'draft')
  or public.has_role('editor')
  or public.has_role('admin')
);