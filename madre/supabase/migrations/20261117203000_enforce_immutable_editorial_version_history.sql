drop trigger if exists editorial_versions_immutable on public.editorial_versions;
create trigger editorial_versions_immutable
before update or delete on public.editorial_versions
for each row execute function public.prevent_editorial_version_update();