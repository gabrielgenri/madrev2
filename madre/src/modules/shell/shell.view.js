import { AccessService } from '../../shared/services/access.service.js'

const esc = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c])

const slugify = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

const moduleInfo = {
  M01: { icon: '01', status: 'Disponible', ready: true },
  M02: { icon: '02', status: 'En preparación', ready: false },
  M03: { icon: '03', status: 'En preparación', ready: false },
  M04: { icon: '04', status: 'En preparación', ready: false },
  M05: { icon: '05', status: 'En preparación', ready: false },
  M06: { icon: '06', status: 'En preparación', ready: false }
}

export async function renderShell(root, user, { onSignOut, onOpenEditorial }) {
  root.innerHTML = '<main class="center-screen"><section class="panel narrow"><p class="eyebrow">MADRE / M00</p><h1>Cargando tu espacio</h1><p class="muted">Estamos verificando tu organización y tus módulos.</p></section></main>'

  try {
    let workspace = await AccessService.workspace(user.id)
    let selectedOrganizationId = workspace.platformAdmin
      ? workspace.organizations.find((organization) => organization.slug === 'madre-interno')?.id ?? workspace.organizations[0]?.id
      : workspace.organizations[0]?.id

    function renderCatalog() {
      const organization = workspace.organizations.find(({ id }) => id === selectedOrganizationId)
      const membership = workspace.memberships.find((item) => item.organization_id === selectedOrganizationId
        && item.user_id === user.id && item.status === 'active')
      const accessibleModules = selectedOrganizationId
        ? AccessService.allowedModules(workspace, selectedOrganizationId)
        : []

      root.innerHTML = `
        <div class="shell">
          <aside class="sidebar">
            <a class="brand" href="#/" aria-label="MADRE, inicio">MADRE<span class="dot">.</span></a>
            <p class="eyebrow">M00 · ECOSISTEMA</p>
            <nav aria-label="Navegación principal">
              <a class="nav-item active" href="#/" aria-current="page">Catálogo de módulos</a>
              ${workspace.platformAdmin ? '<button class="nav-item nav-action" type="button" data-action="administration">Clientes y módulos</button>' : ''}
              ${membership?.role === 'client_admin' ? '<button class="nav-item nav-action" type="button" data-action="team">Mi equipo</button>' : ''}
            </nav>
            <div class="sidebar-bottom">
              <span class="muted small">${esc(user.email)}</span>
              <button class="button ghost full" type="button" data-action="sign-out">Cerrar sesión</button>
            </div>
          </aside>
          <main class="main-content">
            <header class="topbar">
              <div><p class="eyebrow">SHELL MADRE / M00</p><h1>Tu espacio de trabajo</h1></div>
              <span class="status-pill">${workspace.platformAdmin ? 'Administración MADRE' : 'Acceso verificado'}</span>
            </header>
            <section class="portal-intro">
              <div>
                <p class="eyebrow">${workspace.platformAdmin ? 'PLATAFORMA' : 'ORGANIZACIÓN'}</p>
                <h2>${esc(organization?.display_name ?? 'Acceso a MADRE')}</h2>
                <p class="muted">Abrí los módulos disponibles para tu cuenta. El acceso se valida también en la base de datos.</p>
              </div>
              ${workspace.organizations.length > 1 ? `
                <label class="organization-picker">Organización
                  <select data-action="select-organization" aria-label="Elegir organización">
                    ${workspace.organizations.map((item) => `<option value="${esc(item.id)}" ${item.id === selectedOrganizationId ? 'selected' : ''}>${esc(item.display_name)}</option>`).join('')}
                  </select>
                </label>` : ''}
            </section>
            ${!workspace.platformAdmin && workspace.organizations.length === 0 ? `
              <section class="empty-state access-empty" role="status">
                <span class="empty-mark" aria-hidden="true">⌑</span>
                <h3>Tu cuenta todavía no está vinculada a un cliente</h3>
                <p>Pedile al administrador de MADRE que te invite y asigne los módulos de tu organización.</p>
              </section>` : accessibleModules.length ? `
              <section class="module-grid" aria-label="Módulos disponibles">
                ${accessibleModules.map((module) => {
                  const info = moduleInfo[module.module_code] ?? { icon: '·', status: 'En preparación', ready: false }
                  return `<button class="module-card" type="button" data-module="${esc(module.module_code)}" aria-label="${esc(module.name)}: ${info.ready ? 'abrir módulo' : 'en preparación'}">
                    <span class="module-icon" aria-hidden="true">${info.icon}</span>
                    <span class="module-card-copy"><span class="module-card-top"><span class="module-code">${esc(module.module_code)}</span><span class="module-status ${info.ready ? 'is-ready' : ''}">${info.status}</span></span>
                      <strong>${esc(module.name)}</strong><span class="module-description">${esc(module.description)}</span></span>
                    <span class="module-arrow" aria-hidden="true">${info.ready ? '↗' : '→'}</span>
                  </button>`
                }).join('')}
              </section>` : `
              <section class="empty-state access-empty" role="status">
                <span class="empty-mark" aria-hidden="true">⌑</span>
                <h3>No hay módulos habilitados para esta cuenta</h3>
                <p>Un administrador del cliente puede habilitar módulos que MADRE ya tenga asignados a la organización.</p>
              </section>`}
            <p class="portal-footnote">M00 organiza el acceso. Cada módulo y cada dato vuelve a validar los permisos en Supabase.</p>
          </main>
        </div>`

      root.querySelector('[data-action="sign-out"]')?.addEventListener('click', onSignOut)
      root.querySelector('[data-action="administration"]')?.addEventListener('click', () => renderAdministration())
      root.querySelector('[data-action="team"]')?.addEventListener('click', () => renderTeam(selectedOrganizationId))
      root.querySelector('[data-action="select-organization"]')?.addEventListener('change', (event) => {
        selectedOrganizationId = event.currentTarget.value
        renderCatalog()
      })
      root.querySelectorAll('[data-module]').forEach((button) => {
        button.addEventListener('click', () => {
          const code = button.dataset.module
          if (code === 'M01') {
            onOpenEditorial()
            return
          }
          renderModulePlaceholder(root, user, workspace, selectedOrganizationId, code, onSignOut, onOpenEditorial)
        })
      })
    }

    function renderAdministration(feedback = '') {
      if (!workspace.platformAdmin) return renderCatalog()
      const customers = workspace.organizations.filter((organization) => organization.slug !== 'madre-interno')
      const moduleOptions = workspace.modules
      const profileById = new Map(workspace.profiles.map((profile) => [profile.id, profile.display_name]))

      root.innerHTML = `
        <div class="shell">
          <aside class="sidebar">
            <a class="brand" href="#/" aria-label="MADRE, inicio">MADRE<span class="dot">.</span></a>
            <p class="eyebrow">ADMINISTRACIÓN MADRE</p>
            <nav aria-label="Navegación de administración">
              <button class="nav-item nav-action" type="button" data-action="back">Catálogo de módulos</button>
              <span class="nav-item active" aria-current="page">Clientes y módulos</span>
            </nav>
            <div class="sidebar-bottom"><span class="muted small">${esc(user.email)}</span><button class="button ghost full" type="button" data-action="sign-out">Cerrar sesión</button></div>
          </aside>
          <main class="main-content">
            <header class="topbar"><div><p class="eyebrow">PLATAFORMA / CLIENTES</p><h1>Administración de clientes</h1></div><span class="status-pill">Solo MADRE</span></header>
            <p class="muted admin-lead">Creá una organización, habilitá sus módulos e invitá a la persona que la administrará.</p>
            <div class="notice admin-notice" role="status" aria-live="polite">${esc(feedback)}</div>
            <section class="admin-create panel">
              <div><p class="eyebrow">NUEVO CLIENTE</p><h2>Crear organización</h2></div>
              <form id="client-create-form" class="admin-form">
                <div class="admin-form-grid">
                  <div><label for="client-name">Nombre del cliente</label><input id="client-name" name="display_name" required maxlength="180" placeholder="Ej.: Diario del Valle" /></div>
                  <div><label for="client-legal-name">Razón social <span class="muted">(opcional)</span></label><input id="client-legal-name" name="legal_name" maxlength="180" /></div>
                  <div><label for="client-tax-id">CUIT <span class="muted">(opcional)</span></label><input id="client-tax-id" name="tax_id" maxlength="32" /></div>
                  <div><label for="client-admin-name">Nombre del responsable</label><input id="client-admin-name" name="admin_name" required maxlength="120" /></div>
                  <div><label for="client-admin-email">Correo del responsable</label><input id="client-admin-email" name="admin_email" type="email" autocomplete="email" required /></div>
                </div>
                <fieldset class="module-choice-list"><legend>Módulos habilitados para este cliente</legend>
                  ${moduleOptions.map((module) => `<label class="module-choice"><input type="checkbox" name="modules" value="${esc(module.module_code)}" ${module.module_code === 'M01' ? 'checked' : ''}><span><strong>${esc(module.module_code)} · ${esc(module.name)}</strong><small>${esc(module.description)}</small></span></label>`).join('')}
                </fieldset>
                <button class="button primary" type="submit">Crear cliente y enviar invitación</button>
              </form>
            </section>
            <section class="admin-client-list" aria-labelledby="client-list-heading">
              <div class="section-title"><span>ORGANIZACIONES</span><h2 id="client-list-heading">Clientes registrados</h2></div>
              ${customers.length ? customers.map((organization) => {
                const enabledCodes = new Set(workspace.entitlements.filter((item) => item.organization_id === organization.id && item.enabled).map((item) => item.module_code))
                const managers = workspace.memberships.filter((item) => item.organization_id === organization.id && item.role === 'client_admin')
                return `<article class="admin-client-card" data-organization="${esc(organization.id)}">
                  <header><div><p class="eyebrow">${esc(organization.slug)}</p><h3>${esc(organization.display_name)}</h3></div><span class="status-pill">${organization.status === 'active' ? 'Activa' : 'Suspendida'}</span></header>
                  <p class="admin-client-manager">${managers.length ? `Responsable: ${esc(profileById.get(managers[0].user_id) || 'Cliente MADRE')} · ${managers[0].status === 'active' ? 'Acceso activo' : 'Invitación pendiente'}` : 'Todavía no hay un administrador de cliente vinculado.'}</p>
                  <fieldset class="module-choice-list compact"><legend>Módulos habilitados</legend>
                    ${moduleOptions.map((module) => `<label class="module-choice"><input type="checkbox" data-org-module="${esc(module.module_code)}" ${enabledCodes.has(module.module_code) ? 'checked' : ''}><span><strong>${esc(module.name)}</strong></span></label>`).join('')}
                  </fieldset>
                  ${managers.length ? '' : `<form class="inline-invite-form" data-invite-org="${esc(organization.id)}"><div><label for="invite-name-${esc(organization.id)}">Nombre del responsable</label><input id="invite-name-${esc(organization.id)}" name="full_name" required maxlength="120"></div><div><label for="invite-email-${esc(organization.id)}">Correo del responsable</label><input id="invite-email-${esc(organization.id)}" name="email" type="email" required></div><button class="button" type="submit">Enviar invitación</button></form>`}
                </article>`
              }).join('') : '<div class="empty-state"><h3>Todavía no hay clientes</h3><p>Creá la primera organización para empezar a asignar módulos.</p></div>'}
            </section>
          </main>
        </div>`

      root.querySelector('[data-action="sign-out"]')?.addEventListener('click', onSignOut)
      root.querySelector('[data-action="back"]')?.addEventListener('click', () => renderCatalog())
      root.querySelector('#client-create-form')?.addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const button = form.querySelector('button[type="submit"]')
        const values = new FormData(form)
        const selectedModules = values.getAll('modules').map(String)
        button.disabled = true
        try {
          if (!selectedModules.length) throw new Error('Elegí al menos un módulo para el cliente.')
          const displayName = String(values.get('display_name')).trim()
          const slug = slugify(displayName)
          const organization = await AccessService.createOrganization({
            id: crypto.randomUUID(),
            slug,
            display_name: displayName,
            legal_name: String(values.get('legal_name') || '').trim() || null,
            tax_id: String(values.get('tax_id') || '').trim() || null,
            contact_email: String(values.get('admin_email')).trim().toLowerCase(),
            created_by: user.id
          })
          await Promise.all(selectedModules.map((code) => AccessService.setOrganizationModule(organization.id, code, true, user.id)))
          await AccessService.inviteMember(organization.id, String(values.get('admin_email')).trim(), 'client_admin', user.id, String(values.get('admin_name')).trim())
          workspace = await AccessService.workspace(user.id)
          renderAdministration(`Se creó ${organization.display_name} y se envió la invitación a su responsable.`)
        } catch (error) {
          try { workspace = await AccessService.workspace(user.id) } catch { /* keep the current view when refresh is unavailable */ }
          renderAdministration(`No se completó toda la operación: ${error.message}`)
        }
      })

      root.querySelectorAll('[data-org-module]').forEach((checkbox) => checkbox.addEventListener('change', async (event) => {
        const input = event.currentTarget
        const card = input.closest('[data-organization]')
        try {
          await AccessService.setOrganizationModule(card.dataset.organization, input.dataset.orgModule, input.checked, user.id)
          workspace = await AccessService.workspace(user.id)
          renderAdministration('Se actualizaron los módulos del cliente.')
        } catch (error) {
          input.checked = !input.checked
          const notice = root.querySelector('.admin-notice')
          if (notice) notice.textContent = `No se pudo actualizar el módulo: ${error.message}`
        }
      }))

      root.querySelectorAll('[data-invite-org]').forEach((form) => form.addEventListener('submit', async (event) => {
        event.preventDefault()
        const submit = form.querySelector('button[type="submit"]')
        const values = new FormData(form)
        submit.disabled = true
        try {
          await AccessService.inviteMember(form.dataset.inviteOrg, String(values.get('email')).trim(), 'client_admin', user.id, String(values.get('full_name')).trim())
          workspace = await AccessService.workspace(user.id)
          renderAdministration('Invitación enviada al nuevo administrador de cliente.')
        } catch (error) {
          submit.disabled = false
          const notice = root.querySelector('.admin-notice')
          if (notice) notice.textContent = `No se pudo enviar la invitación: ${error.message}`
        }
      }))
    }

    function renderTeam(organizationId) {
      const organization = workspace.organizations.find((item) => item.id === organizationId)
      const ownMembership = workspace.memberships.find((item) => item.organization_id === organizationId
        && item.user_id === user.id && item.status === 'active')
      if (ownMembership?.role !== 'client_admin' || !organization) return renderCatalog()
      const employees = workspace.memberships.filter((item) => item.organization_id === organizationId && item.role === 'employee')
      const enabledModules = workspace.entitlements.filter((item) => item.organization_id === organizationId && item.enabled)
      const profileById = new Map(workspace.profiles.map((profile) => [profile.id, profile.display_name]))

      root.innerHTML = `
        <div class="shell">
          <aside class="sidebar">
            <a class="brand" href="#/" aria-label="MADRE, inicio">MADRE<span class="dot">.</span></a>
            <p class="eyebrow">${esc(organization.display_name)}</p>
            <nav aria-label="Navegación del cliente">
              <button class="nav-item nav-action" type="button" data-action="back">Catálogo de módulos</button>
              <span class="nav-item active" aria-current="page">Mi equipo</span>
            </nav>
            <div class="sidebar-bottom"><span class="muted small">${esc(user.email)}</span><button class="button ghost full" type="button" data-action="sign-out">Cerrar sesión</button></div>
          </aside>
          <main class="main-content">
            <header class="topbar"><div><p class="eyebrow">ORGANIZACIÓN / EQUIPO</p><h1>Empleados y permisos</h1></div><span class="status-pill">${employees.length} empleados</span></header>
            <p class="muted admin-lead">Invitá a tu equipo y habilitá solo los módulos que MADRE asignó a tu organización.</p>
            <div class="notice team-notice" role="status" aria-live="polite"></div>
            <section class="admin-create panel">
              <div><p class="eyebrow">INVITAR EMPLEADO</p><h2>Sumar una persona al equipo</h2></div>
              <form id="employee-invite-form" class="admin-form">
                <div class="admin-form-grid">
                  <div><label for="employee-name">Nombre</label><input id="employee-name" name="full_name" required maxlength="120" autocomplete="name"></div>
                  <div><label for="employee-email">Correo electrónico</label><input id="employee-email" name="email" type="email" autocomplete="email" required></div>
                </div>
                <button class="button primary" type="submit">Enviar invitación</button>
              </form>
            </section>
            <section class="team-list" aria-label="Personas del equipo">
              ${employees.length ? employees.map((employee) => {
                const assigned = new Set(workspace.memberGrants.filter((grant) => grant.organization_id === organizationId && grant.user_id === employee.user_id).map((grant) => grant.module_code))
                return `<article class="team-member-card" data-employee="${esc(employee.user_id)}"><header><div><h3>${esc(profileById.get(employee.user_id) || 'Empleado')}</h3><p class="muted small">${employee.status === 'active' ? 'Acceso activo' : 'Invitación pendiente'}</p></div><span class="mono">${esc(employee.user_id.slice(0, 8))}</span></header>
                  <fieldset class="module-choice-list compact"><legend>Módulos de este empleado</legend>
                    ${enabledModules.length ? enabledModules.map((item) => {
                      const module = workspace.modules.find((entry) => entry.module_code === item.module_code)
                      return `<label class="module-choice"><input type="checkbox" data-member-module="${esc(item.module_code)}" ${assigned.has(item.module_code) ? 'checked' : ''}><span><strong>${esc(module?.name ?? item.module_code)}</strong></span></label>`
                    }).join('') : '<p class="muted small">MADRE todavía no habilitó módulos para esta organización.</p>'}
                  </fieldset></article>`
              }).join('') : '<div class="empty-state"><h3>El equipo está listo para crecer</h3><p>Las personas invitadas aparecerán aquí para que puedas administrar sus accesos.</p></div>'}
            </section>
          </main>
        </div>`

      root.querySelector('[data-action="sign-out"]')?.addEventListener('click', onSignOut)
      root.querySelector('[data-action="back"]')?.addEventListener('click', () => renderCatalog())
      root.querySelector('#employee-invite-form')?.addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const submit = form.querySelector('button[type="submit"]')
        const values = new FormData(form)
        submit.disabled = true
        try {
          await AccessService.inviteMember(organizationId, String(values.get('email')).trim(), 'employee', user.id, String(values.get('full_name')).trim())
          workspace = await AccessService.workspace(user.id)
          renderTeam(organizationId)
          const notice = root.querySelector('.team-notice')
          if (notice) notice.textContent = 'Invitación enviada. La persona ya quedó vinculada a tu organización.'
        } catch (error) {
          submit.disabled = false
          const notice = root.querySelector('.team-notice')
          if (notice) notice.textContent = `No se pudo enviar la invitación: ${error.message}`
        }
      })
      root.querySelectorAll('[data-member-module]').forEach((checkbox) => checkbox.addEventListener('change', async (event) => {
        const input = event.currentTarget
        const employeeId = input.closest('[data-employee]').dataset.employee
        try {
          await AccessService.setMemberModule(organizationId, employeeId, input.dataset.memberModule, input.checked, user.id)
          workspace = await AccessService.workspace(user.id)
        } catch (error) {
          input.checked = !input.checked
          const notice = root.querySelector('.team-notice')
          if (notice) notice.textContent = `No se pudo actualizar el permiso: ${error.message}`
        }
      }))
    }

    renderCatalog()
  } catch (error) {
    root.innerHTML = `<main class="center-screen"><section class="panel narrow"><p class="eyebrow">MADRE / M00</p><h1>No pudimos cargar tu espacio</h1><p class="muted">${esc(error.message)}</p><button class="button" type="button" data-action="sign-out">Cerrar sesión</button></section></main>`
    root.querySelector('[data-action="sign-out"]')?.addEventListener('click', onSignOut)
  }
}

function renderModulePlaceholder(root, user, workspace, organizationId, code, onSignOut, onOpenEditorial) {
  const module = workspace.modules.find((item) => item.module_code === code)
  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="#/" data-action="back">MADRE<span class="dot">.</span></a>
        <p class="eyebrow">MÓDULO ${esc(code)}</p>
        <nav aria-label="Navegación del módulo"><button class="nav-item" type="button" data-action="back">Volver al catálogo</button></nav>
        <div class="sidebar-bottom"><span class="muted small">${esc(organizationId ? 'Acceso autorizado' : '')}</span><button class="button ghost full" type="button" data-action="sign-out">Cerrar sesión</button></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><div><p class="eyebrow">MADRE / ${esc(code)}</p><h1>${esc(module?.name ?? 'Módulo')}</h1></div><span class="status-pill">En preparación</span></header>
        <section class="module-coming panel" role="status"><span class="module-icon" aria-hidden="true">${esc(code.slice(1))}</span><h2>Este módulo todavía se está construyendo</h2><p class="muted">El acceso está autorizado para tu cuenta. La aplicación de ${esc(module?.name ?? 'este módulo')} se incorporará por etapas.</p><button class="button primary" type="button" data-action="back">Volver al catálogo</button></section>
      </main>
    </div>`

  root.querySelectorAll('[data-action="back"]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault()
    renderShell(root, user, { onSignOut, onOpenEditorial })
  }))
  root.querySelector('[data-action="sign-out"]')?.addEventListener('click', onSignOut)
}
