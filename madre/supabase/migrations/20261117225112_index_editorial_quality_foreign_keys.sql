create index if not exists editorial_quality_reviews_source_version_idx
  on public.editorial_quality_reviews (source_version_id);
create index if not exists editorial_quality_observations_author_idx
  on public.editorial_quality_observations (created_by);