-- Invitations remain unable to access tenant data until the invited user
-- authenticates and accepts their own invitation link.
create or replace function app_private.can_grant_member_module(
  target_organization_id uuid,
  target_user_id uuid,
  target_module_code text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select app_private.is_platform_admin() or (
    app_private.is_organization_manager(target_organization_id)
    and exists (
      select 1 from public.organization_memberships m
      where m.organization_id = target_organization_id
        and m.user_id = target_user_id
        and m.role = 'employee'
        and m.status in ('invited', 'active')
    )
    and exists (
      select 1 from public.organization_modules om
      where om.organization_id = target_organization_id
        and om.module_code = target_module_code
        and om.enabled
    )
  );
$$;

create or replace function public.accept_organization_invites()
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_user_id uuid := auth.uid();
  activated_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'Se requiere una sesión autenticada';
  end if;

  if not exists (
    select 1 from auth.users u
    where u.id = current_user_id and u.email_confirmed_at is not null
  ) then
    raise exception 'Confirmá el correo antes de aceptar la invitación';
  end if;

  update public.organization_memberships m
  set status = 'active', updated_at = clock_timestamp()
  where m.user_id = current_user_id
    and m.status = 'invited'
    and exists (
      select 1 from public.organizations o
      where o.id = m.organization_id and o.status = 'active'
    );

  get diagnostics activated_count = row_count;
  return activated_count;
end;
$$;

revoke all on function public.accept_organization_invites() from public, anon;
grant execute on function public.accept_organization_invites() to authenticated;

comment on function public.accept_organization_invites() is
  'Activates only the authenticated user’s pending organization memberships after email confirmation.';
