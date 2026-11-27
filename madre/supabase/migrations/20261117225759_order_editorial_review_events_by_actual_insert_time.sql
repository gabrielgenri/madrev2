alter table public.editorial_review_events
  alter column created_at set default clock_timestamp();