create table if not exists public.editorial_quality_reviews (
  id uuid primary key default gen_random_uuid(),
  editorial_unit_id uuid not null references public.editorial_units(id) on delete cascade,
  editorial_format_id uuid references public.editorial_formats(id) on delete set null,
  source_version_id uuid references public.editorial_versions(id) on delete set null,
  scope text not null default 'cross_format' check (scope in ('format', 'cross_format')),
  status text not null check (status in ('needs_attention', 'checks_complete')),
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'),
  findings jsonb not null default '[]'::jsonb check (jsonb_typeof(findings) = 'array'),
  metrics jsonb not null default '{}'::jsonb check (jsonb_typeof(metrics) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists editorial_quality_reviews_unit_created_idx on public.editorial_quality_reviews (editorial_unit_id, created_at desc);
create index if not exists editorial_quality_reviews_format_idx on public.editorial_quality_reviews (editorial_format_id);
create index if not exists editorial_quality_reviews_author_idx on public.editorial_quality_reviews (created_by);
create table if not exists public.editorial_quality_observations (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.editorial_quality_reviews(id) on delete cascade,
  severity text not null default 'note' check (severity in ('note', 'warning', 'critical')),
  note text not null check (length(trim(note)) between 3 and 3000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists editorial_quality_observations_review_created_idx on public.editorial_quality_observations (review_id, created_at desc);
alter table public.editorial_quality_reviews enable row level security;
alter table public.editorial_quality_observations enable row level security;
revoke all on public.editorial_quality_reviews from anon;
revoke all on public.editorial_quality_observations from anon;
grant select, insert on public.editorial_quality_reviews to authenticated;
grant select, insert on public.editorial_quality_observations to authenticated;
create policy "quality_reviews_select_via_unit" on public.editorial_quality_reviews for select to authenticated
using (exists (select 1 from public.editorial_units u where u.id = editorial_quality_reviews.editorial_unit_id));
create policy "quality_reviews_insert_via_unit" on public.editorial_quality_reviews for insert to authenticated
with check (created_by = (select auth.uid()) and exists (select 1 from public.editorial_units u where u.id = editorial_quality_reviews.editorial_unit_id));
create policy "quality_observations_select_via_review" on public.editorial_quality_observations for select to authenticated
using (exists (select 1 from public.editorial_quality_reviews r where r.id = editorial_quality_observations.review_id));
create policy "quality_observations_insert_via_review" on public.editorial_quality_observations for insert to authenticated
with check (created_by = (select auth.uid()) and exists (select 1 from public.editorial_quality_reviews r where r.id = editorial_quality_observations.review_id));