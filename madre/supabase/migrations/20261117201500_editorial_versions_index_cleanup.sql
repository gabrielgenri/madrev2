drop index if exists public.editorial_versions_unit_version_uidx;
create index if not exists editorial_versions_created_by_idx
  on public.editorial_versions (created_by);