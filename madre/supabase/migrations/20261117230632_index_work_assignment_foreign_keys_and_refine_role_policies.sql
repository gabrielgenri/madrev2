create index if not exists editorial_work_events_from_assignee_idx
  on public.editorial_work_events (from_assigned_to);
create index if not exists editorial_work_events_to_assignee_idx
  on public.editorial_work_events (to_assigned_to);

drop policy if exists roles_admin_manage on public.user_roles;
create policy roles_admin_insert
on public.user_roles for insert to authenticated
with check (public.has_role('admin'));
create policy roles_admin_update
on public.user_roles for update to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));
create policy roles_admin_delete
on public.user_roles for delete to authenticated
using (public.has_role('admin'));