-- MADRE multi-tenant foundation: client organizations and module grants.
-- Existing editorial data is retained under the internal MADRE organization.

create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

create table public.organizations (
  id uuid primary key,
  slug text not null unique check (slug = lower(slug) and length(trim(slug)) between 2 and 80),
  display_name text not null check (length(trim(display_name)) between 2 and 180),
  legal_name text,
  tax_id text,
  contact_email text,
  contact_phone text,
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('client_admin', 'employee')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_memberships_user_status_idx
  on public.organization_memberships (user_id, status, organization_id);

create table public.module_catalog (
  module_code text primary key check (module_code in ('M01', 'M02', 'M03', 'M04', 'M05', 'M06')),
  name text not null,
  description text not null default '',
  route_key text not null unique,
  display_order smallint not null unique,
  active boolean not null default true
);

insert into public.module_catalog (module_code, name, description, route_key, display_order)
values
  ('M01', 'Madre Editorial', 'Ingesta, investigación, verificación y formatos.', 'madre-editorial', 1),
  ('M02', 'Biblioteca Riojana', 'Archivo documental, fuentes y memoria editorial.', 'biblioteca-riojana', 2),
  ('M03', 'Editor Crítico', 'Control de calidad, sesgos, riesgos y advertencias.', 'editor-critico', 3),
  ('M04', 'Observatorios', 'Datos, indicadores, series y análisis territorial.', 'observatorios', 4),
  ('M05', 'Transcripción', 'Procesamiento de audios y entrevistas.', 'transcripcion', 5),
  ('M06', 'Distribución', 'Preparación, autorización y publicación multicanal.', 'distribucion', 6)
on conflict (module_code) do update set
  name = excluded.name,
  description = excluded.description,
  route_key = excluded.route_key,
  display_order = excluded.display_order;

create table public.organization_modules (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  module_code text not null references public.module_catalog(module_code) on delete restrict,
  enabled boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (organization_id, module_code)
);

create table public.member_module_access (
  organization_id uuid not null,
  user_id uuid not null,
  module_code text not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (organization_id, user_id, module_code),
  foreign key (organization_id, user_id)
    references public.organization_memberships(organization_id, user_id) on delete cascade,
  foreign key (organization_id, module_code)
    references public.organization_modules(organization_id, module_code) on delete cascade
);

create index member_module_access_user_idx
  on public.member_module_access (user_id, organization_id, module_code);

create table public.organization_access_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  module_code text references public.module_catalog(module_code) on delete set null,
  action text not null,
  occurred_at timestamptz not null default clock_timestamp()
);

create index organization_access_events_org_time_idx
  on public.organization_access_events (organization_id, occurred_at desc);

insert into public.organizations (id, slug, display_name, status)
values ('00000000-0000-0000-0000-000000000001', 'madre-interno', 'MADRE interno', 'active');

insert into public.organization_modules (organization_id, module_code, enabled)
select '00000000-0000-0000-0000-000000000001'::uuid, module_code, true
from public.module_catalog
where module_code = 'M01';

-- The fixed internal tenant keeps all existing MADRE work in its original scope.
alter table public.editorial_units
  add column organization_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid
  references public.organizations(id) on delete restrict;

create index editorial_units_organization_updated_idx
  on public.editorial_units (organization_id, updated_at desc);

comment on column public.editorial_units.organization_id is
  'Tenant owner. Immutable after creation; child editorial records inherit this scope through editorial_unit_id.';

create function app_private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  );
$$;

create function app_private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.organizations o
    join public.organization_memberships m on m.organization_id = o.id
    where o.id = target_organization_id
      and o.status = 'active'
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create function app_private.is_organization_manager(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select app_private.is_platform_admin() or (
    auth.uid() is not null and exists (
      select 1
      from public.organizations o
      join public.organization_memberships m on m.organization_id = o.id
      where o.id = target_organization_id
        and o.status = 'active'
        and m.user_id = auth.uid()
        and m.role = 'client_admin'
        and m.status = 'active'
    )
  );
$$;

create function app_private.has_module_access(
  target_organization_id uuid,
  target_module_code text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select app_private.is_platform_admin() or (
    target_organization_id = '00000000-0000-0000-0000-000000000001'::uuid
    and target_module_code = 'M01'
    and exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid()
        and r.role in ('collaborator', 'writer', 'reviewer', 'editor', 'admin')
    )
  ) or (
    auth.uid() is not null and exists (
      select 1
      from public.organizations o
      join public.organization_memberships m on m.organization_id = o.id
      join public.organization_modules om on om.organization_id = o.id
      where o.id = target_organization_id
        and o.status = 'active'
        and m.user_id = auth.uid()
        and m.status = 'active'
        and om.module_code = target_module_code
        and om.enabled
        and (
          m.role = 'client_admin'
          or exists (
            select 1 from public.member_module_access a
            where a.organization_id = o.id
              and a.user_id = auth.uid()
              and a.module_code = target_module_code
          )
        )
    )
  );
$$;

create function app_private.can_grant_member_module(
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
        and m.status = 'active'
    )
    and exists (
      select 1 from public.organization_modules om
      where om.organization_id = target_organization_id
        and om.module_code = target_module_code
        and om.enabled
    )
  );
$$;

create function app_private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select auth.uid() = target_user_id
    or app_private.is_platform_admin()
    or exists (
      select 1
      from public.organization_memberships actor_membership
      join public.organization_memberships target_membership
        on target_membership.organization_id = actor_membership.organization_id
      join public.organizations o on o.id = actor_membership.organization_id
      where actor_membership.user_id = auth.uid()
        and actor_membership.role = 'client_admin'
        and actor_membership.status = 'active'
        and target_membership.user_id = target_user_id
        and o.status = 'active'
    )
    or (
      public.has_role('editor')
      and exists (
        select 1 from public.editorial_units u
        where u.organization_id = '00000000-0000-0000-0000-000000000001'::uuid
          and (u.created_by = target_user_id or u.assigned_to = target_user_id)
      )
    );
$$;

create function app_private.prevent_tenant_reassignment()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'La organización de un registro no se puede cambiar';
  end if;
  return new;
end;
$$;

create trigger editorial_units_organization_immutable
before update of organization_id on public.editorial_units
for each row execute function app_private.prevent_tenant_reassignment();

create function app_private.prevent_membership_reassignment()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.organization_id is distinct from old.organization_id
    or new.user_id is distinct from old.user_id then
    raise exception 'No se puede reasignar una membresía a otra persona u organización';
  end if;
  if old.role = 'client_admin' and new.role <> old.role
    and not app_private.is_platform_admin() then
    raise exception 'Solo MADRE puede cambiar el rol de administración del cliente';
  end if;
  return new;
end;
$$;

create trigger organization_membership_identity_immutable
before update on public.organization_memberships
for each row execute function app_private.prevent_membership_reassignment();

create function app_private.log_organization_access_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  changed_row jsonb;
  tenant_id uuid;
  subject_id uuid;
  changed_module text;
begin
  changed_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  tenant_id := nullif(changed_row ->> 'organization_id', '')::uuid;
  subject_id := nullif(changed_row ->> 'user_id', '')::uuid;
  changed_module := changed_row ->> 'module_code';
  if tenant_id is not null then
    insert into public.organization_access_events (
      organization_id, actor_user_id, target_user_id, module_code, action
    ) values (
      tenant_id, auth.uid(), subject_id, changed_module, tg_table_name || ':' || lower(tg_op)
    );
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger organization_membership_access_audit
after insert or update or delete on public.organization_memberships
for each row execute function app_private.log_organization_access_change();

create trigger organization_module_access_audit
after insert or update or delete on public.organization_modules
for each row execute function app_private.log_organization_access_change();

create trigger member_module_access_audit
after insert or update or delete on public.member_module_access
for each row execute function app_private.log_organization_access_change();

revoke all on all functions in schema app_private from public, anon;
grant execute on function app_private.is_platform_admin() to authenticated;
grant execute on function app_private.is_organization_member(uuid) to authenticated;
grant execute on function app_private.is_organization_manager(uuid) to authenticated;
grant execute on function app_private.has_module_access(uuid, text) to authenticated;
grant execute on function app_private.can_grant_member_module(uuid, uuid, text) to authenticated;
grant execute on function app_private.can_view_profile(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.module_catalog enable row level security;
alter table public.organization_modules enable row level security;
alter table public.member_module_access enable row level security;
alter table public.organization_access_events enable row level security;

revoke all on public.organizations, public.organization_memberships,
  public.module_catalog, public.organization_modules, public.member_module_access,
  public.organization_access_events from anon, authenticated;
grant select, insert, update on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_memberships to authenticated;
grant select on public.module_catalog to authenticated;
grant select, insert, update on public.organization_modules to authenticated;
grant select, insert, delete on public.member_module_access to authenticated;
grant select on public.organization_access_events to authenticated;

create policy organizations_select_member_or_admin
on public.organizations for select to authenticated
using (app_private.is_platform_admin() or app_private.is_organization_member(id));
create policy organizations_insert_admin
on public.organizations for insert to authenticated
with check (app_private.is_platform_admin() and created_by = auth.uid());
create policy organizations_update_admin
on public.organizations for update to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy organization_memberships_select_self_manager_admin
on public.organization_memberships for select to authenticated
using (user_id = auth.uid() or app_private.is_organization_manager(organization_id));
create policy organization_memberships_insert_admin_or_employee
on public.organization_memberships for insert to authenticated
with check (
  (app_private.is_platform_admin() and created_by = auth.uid())
  or (
    app_private.is_organization_manager(organization_id)
    and role = 'employee'
    and status in ('invited', 'active', 'suspended')
    and created_by = auth.uid()
  )
);
create policy organization_memberships_update_admin_or_employee
on public.organization_memberships for update to authenticated
using (
  app_private.is_platform_admin()
  or (role = 'employee' and app_private.is_organization_manager(organization_id))
)
with check (
  app_private.is_platform_admin()
  or (role = 'employee' and app_private.is_organization_manager(organization_id))
);
create policy organization_memberships_delete_admin_or_employee
on public.organization_memberships for delete to authenticated
using (
  app_private.is_platform_admin()
  or (role = 'employee' and app_private.is_organization_manager(organization_id))
);

create policy module_catalog_select_active
on public.module_catalog for select to authenticated
using (active or app_private.is_platform_admin());

create policy organization_modules_select_member_admin
on public.organization_modules for select to authenticated
using (app_private.is_platform_admin() or app_private.is_organization_member(organization_id));
create policy organization_modules_insert_admin
on public.organization_modules for insert to authenticated
with check (app_private.is_platform_admin());
create policy organization_modules_update_admin
on public.organization_modules for update to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy member_module_access_select_self_manager_admin
on public.member_module_access for select to authenticated
using (
  user_id = auth.uid()
  or app_private.is_organization_manager(organization_id)
);
create policy member_module_access_insert_manager_admin
on public.member_module_access for insert to authenticated
with check (
  app_private.can_grant_member_module(organization_id, user_id, module_code)
  and (app_private.is_platform_admin() or granted_by = auth.uid())
);
create policy member_module_access_delete_manager_admin
on public.member_module_access for delete to authenticated
using (app_private.can_grant_member_module(organization_id, user_id, module_code));

create policy organization_access_events_select_manager_admin
on public.organization_access_events for select to authenticated
using (app_private.is_platform_admin() or app_private.is_organization_manager(organization_id));

drop policy if exists editorial_units_select on public.editorial_units;
drop policy if exists editorial_units_insert on public.editorial_units;
drop policy if exists editorial_units_update on public.editorial_units;
drop policy if exists editorial_units_delete_draft on public.editorial_units;

create policy editorial_units_select_by_tenant_module
on public.editorial_units for select to authenticated
using (app_private.has_module_access(organization_id, 'M01'));
create policy editorial_units_insert_by_tenant_module
on public.editorial_units for insert to authenticated
with check (
  created_by = auth.uid()
  and app_private.has_module_access(organization_id, 'M01')
);
create policy editorial_units_update_by_tenant_module
on public.editorial_units for update to authenticated
using (
  app_private.has_module_access(organization_id, 'M01')
  and (
    app_private.is_organization_manager(organization_id)
    or created_by = auth.uid()
    or assigned_to = auth.uid()
    or app_private.is_platform_admin()
    or (organization_id = '00000000-0000-0000-0000-000000000001'::uuid
      and public.has_role('editor'))
  )
)
with check (
  app_private.has_module_access(organization_id, 'M01')
  and (
    app_private.is_organization_manager(organization_id)
    or created_by = auth.uid()
    or (assigned_to = auth.uid() and status = 'draft')
    or app_private.is_platform_admin()
    or (organization_id = '00000000-0000-0000-0000-000000000001'::uuid
      and public.has_role('editor'))
  )
);
create policy editorial_units_delete_draft_by_tenant
on public.editorial_units for delete to authenticated
using (
  app_private.is_platform_admin()
  or (
    app_private.has_module_access(organization_id, 'M01')
    and status = 'draft'
    and (created_by = auth.uid() or app_private.is_organization_manager(organization_id))
  )
);

drop policy if exists profiles_select_self_or_editor_admin on public.profiles;
create policy profiles_select_self_or_authorized_manager
on public.profiles for select to authenticated
using (app_private.can_view_profile(id));

