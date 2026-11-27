alter table public.editorial_review_events
  drop constraint editorial_review_events_editorial_unit_id_fkey;
alter table public.editorial_review_events
  add constraint editorial_review_events_editorial_unit_id_fkey
  foreign key (editorial_unit_id) references public.editorial_units(id) on delete restrict;
