create or replace function public.guard_editorial_publish_status()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_latest_version_id uuid;
begin
  if new.status = 'reviewed' and old.status is distinct from new.status then
    if not (public.has_role('editor') or public.has_role('admin')) then
      raise exception 'Only editor or admin can approve an editorial unit';
    end if;
    select id into v_latest_version_id from public.editorial_versions
     where editorial_unit_id = new.id order by version_number desc limit 1;
    if not exists (
      select 1 from public.editorial_review_events e
      where e.editorial_unit_id = new.id
        and e.event_type = 'approved'
        and e.source_version_id = v_latest_version_id
    ) then
      raise exception 'A recorded human approval for the current content version is required';
    end if;
  end if;
  if new.status = 'published' then
    if not (public.has_role('editor') or public.has_role('admin')) then
      raise exception 'Only editor or admin can publish an editorial unit';
    end if;
    if old.status is distinct from 'reviewed' then
      raise exception 'An editorial unit must be reviewed before publication';
    end if;
    select id into v_latest_version_id from public.editorial_versions
     where editorial_unit_id = new.id order by version_number desc limit 1;
    if not exists (
      select 1 from public.editorial_review_events e
      where e.editorial_unit_id = new.id
        and e.event_type = 'approved'
        and e.source_version_id = v_latest_version_id
    ) then
      raise exception 'A current human approval is required before publication';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.reopen_editorial_review_after_content_change()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if old.status in ('reviewed','published')
    and (
      new.title is distinct from old.title
      or new.slug is distinct from old.slug
      or new.summary is distinct from old.summary
      or new.content_mother is distinct from old.content_mother
      or new.metadata is distinct from old.metadata
    ) then
    new.status := 'draft';
    new.published_at := null;
  end if;
  return new;
end;
$function$;

drop trigger if exists editorial_units_reopen_review_on_content_change on public.editorial_units;
create trigger editorial_units_reopen_review_on_content_change
before update of title, slug, summary, content_mother, metadata
on public.editorial_units
for each row execute function public.reopen_editorial_review_after_content_change();