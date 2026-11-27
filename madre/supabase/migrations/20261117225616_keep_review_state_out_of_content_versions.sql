drop trigger if exists editorial_units_capture_version on public.editorial_units;
create trigger editorial_units_capture_version
after insert or update of title, slug, summary, content_mother, metadata
on public.editorial_units
for each row execute function public.capture_editorial_version();