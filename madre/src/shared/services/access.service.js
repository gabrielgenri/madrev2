import { supabase } from '../../core/supabase/client.js'

function client() {
  if (!supabase) throw new Error('Supabase no está configurado. Revisá .env.local.')
  return supabase
}

async function read(query) {
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export const AccessService = {
  async workspace(userId) {
    const db = client()
    const { error: inviteError } = await db.rpc('accept_organization_invites')
    if (inviteError) throw inviteError
    const [roles, memberships, organizations, modules, profiles] = await Promise.all([
      read(db.from('user_roles').select('role').eq('user_id', userId)),
      read(db.from('organization_memberships').select('organization_id,user_id,role,status')),
      read(db.from('organizations').select('id,slug,display_name,status').order('display_name')),
      read(db.from('module_catalog').select('module_code,name,description,route_key,display_order').eq('active', true).order('display_order')),
      read(db.from('profiles').select('id,display_name'))
    ])

    const platformAdmin = roles.some(({ role }) => role === 'admin')
    const visibleOrganizations = organizations.filter((organization) => platformAdmin || organization.status === 'active')
    const organizationIds = visibleOrganizations.map(({ id }) => id)
    let entitlements = []
    let memberGrants = []

    if (organizationIds.length) {
      [entitlements, memberGrants] = await Promise.all([
        read(db.from('organization_modules').select('organization_id,module_code,enabled').in('organization_id', organizationIds)),
        read(db.from('member_module_access').select('organization_id,user_id,module_code').in('organization_id', organizationIds))
      ])
    }

    return { userId, platformAdmin, roles: roles.map(({ role }) => role), memberships, organizations: visibleOrganizations, modules, profiles, entitlements, memberGrants }
  },

  allowedModules(workspace, organizationId) {
    const { platformAdmin, roles, memberships, modules, entitlements, memberGrants } = workspace
    if (platformAdmin) return modules

    const membership = memberships.find((item) => item.organization_id === organizationId && item.user_id === workspace.userId && item.status === 'active')
    const legacyInternalRole = organizationId === '00000000-0000-0000-0000-000000000001'
      && roles.some((role) => ['collaborator', 'writer', 'reviewer', 'editor', 'admin'].includes(role))
    const enabledCodes = new Set(entitlements
      .filter((item) => item.organization_id === organizationId && item.enabled)
      .map((item) => item.module_code))
    const memberCodes = new Set(memberGrants
      .filter((item) => item.organization_id === organizationId && item.user_id === workspace.userId)
      .map((item) => item.module_code))

    return modules.filter((module) => {
      if (legacyInternalRole && module.module_code === 'M01') return true
      if (!membership || !enabledCodes.has(module.module_code)) return false
      return membership.role === 'client_admin' || memberCodes.has(module.module_code)
    })
  },

  async createOrganization(values) {
    const { data, error } = await client().from('organizations').insert(values).select('id,slug,display_name,status').single()
    if (error) throw error
    return data
  },

  async setOrganizationModule(organizationId, moduleCode, enabled, actorId) {
    const db = client()
    const { error } = await db.from('organization_modules').upsert({
      organization_id: organizationId,
      module_code: moduleCode,
      enabled,
      granted_by: actorId
    }, { onConflict: 'organization_id,module_code' })
    if (error) throw error
  },

  async inviteMember(organizationId, email, role, actorId, fullName = '') {
    const db = client()
    const { data: invitation, error: inviteError } = await db.functions.invoke('invite-organization-member', {
      body: { organization_id: organizationId, email, role, full_name: fullName }
    })
    if (inviteError) throw inviteError
    const { error: membershipError } = await db.from('organization_memberships').insert({
      organization_id: organizationId,
      user_id: invitation.user_id,
      role,
      status: 'invited',
      created_by: actorId
    })
    if (membershipError) throw membershipError
    return invitation
  },

  async setMemberModule(organizationId, userId, moduleCode, enabled, actorId) {
    const db = client()
    if (enabled) {
      const { data: existing, error: readError } = await db.from('member_module_access')
        .select('module_code')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('module_code', moduleCode)
        .maybeSingle()
      if (readError) throw readError
      if (existing) return
      const { error } = await db.from('member_module_access').insert({
        organization_id: organizationId,
        user_id: userId,
        module_code: moduleCode,
        granted_by: actorId
      })
      if (error && error.code !== '23505') throw error
      return
    }

    const { error } = await db.from('member_module_access').delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('module_code', moduleCode)
    if (error) throw error
  }
}
