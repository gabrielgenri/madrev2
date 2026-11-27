revoke all on table public.editorial_quality_reviews from anon, authenticated;
revoke all on table public.editorial_quality_observations from anon, authenticated;
grant select, insert on table public.editorial_quality_reviews to authenticated;
grant select, insert on table public.editorial_quality_observations to authenticated;