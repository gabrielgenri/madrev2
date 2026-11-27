drop policy if exists versions_insert_via_unit on public.editorial_versions;
create policy versions_insert_via_unit
on public.editorial_versions for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.editorial_units u
    where u.id = editorial_versions.editorial_unit_id
      and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
        or public.has_role('editor') or public.has_role('admin'))
  )
);

drop policy if exists formats_insert_via_unit on public.editorial_formats;
create policy formats_insert_via_unit
on public.editorial_formats for insert to authenticated
with check (
  exists (
    select 1 from public.editorial_units u
    where u.id = editorial_formats.editorial_unit_id
      and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
        or public.has_role('editor') or public.has_role('admin'))
  )
);

drop policy if exists formats_update_via_unit on public.editorial_formats;
create policy formats_update_via_unit
on public.editorial_formats for update to authenticated
using (exists (
  select 1 from public.editorial_units u
  where u.id = editorial_formats.editorial_unit_id
    and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
      or public.has_role('editor') or public.has_role('admin'))
))
with check (exists (
  select 1 from public.editorial_units u
  where u.id = editorial_formats.editorial_unit_id
    and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
      or public.has_role('editor') or public.has_role('admin'))
));

drop policy if exists sources_insert_via_unit on public.sources;
create policy sources_insert_via_unit
on public.sources for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.editorial_units u
    where u.id = sources.editorial_unit_id
      and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
        or public.has_role('editor') or public.has_role('admin'))
  )
);

drop policy if exists sources_update_via_unit on public.sources;
create policy sources_update_via_unit
on public.sources for update to authenticated
using (exists (
  select 1 from public.editorial_units u
  where u.id = sources.editorial_unit_id
    and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
      or public.has_role('editor') or public.has_role('admin'))
))
with check (exists (
  select 1 from public.editorial_units u
  where u.id = sources.editorial_unit_id
    and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
      or public.has_role('editor') or public.has_role('admin'))
));

drop policy if exists claims_insert_via_unit on public.claims;
create policy claims_insert_via_unit
on public.claims for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.editorial_units u
    where u.id = claims.editorial_unit_id
      and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
        or public.has_role('editor') or public.has_role('admin'))
  )
);

drop policy if exists claims_update_via_unit on public.claims;
create policy claims_update_via_unit
on public.claims for update to authenticated
using (exists (
  select 1 from public.editorial_units u
  where u.id = claims.editorial_unit_id
    and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
      or public.has_role('editor') or public.has_role('admin'))
))
with check (exists (
  select 1 from public.editorial_units u
  where u.id = claims.editorial_unit_id
    and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
      or public.has_role('editor') or public.has_role('admin'))
));

drop policy if exists evidences_insert_via_unit on public.evidences;
create policy evidences_insert_via_unit
on public.evidences for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.editorial_units u
    where u.id = evidences.editorial_unit_id
      and (u.created_by = (select auth.uid()) or u.assigned_to = (select auth.uid())
        or public.has_role('editor') or public.has_role('admin'))
  )
);