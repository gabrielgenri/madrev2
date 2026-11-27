create index if not exists editorial_formats_source_version_idx
  on public.editorial_formats (source_version_id);
create index if not exists editorial_formats_created_by_idx
  on public.editorial_formats (created_by);