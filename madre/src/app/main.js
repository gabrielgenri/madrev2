import { isSupabaseConfigured } from '../core/supabase/client.js'
import { AuthService } from '../core/auth/auth.service.js'
import { renderLogin } from '../modules/auth/login.view.js'
import { renderShell } from '../modules/shell/shell.view.js'
import { renderWorkspace } from '../modules/madre-editorial/editorial.view.js'
import '../styles/main.css'

const app = document.querySelector('#app')
let unsubscribe = null

function showConfigError() {
  app.innerHTML = `
    <main class="center-screen">
      <section class="panel narrow">
        <p class="eyebrow">MADRE / CONFIGURACIÓN</p>
        <h1>Conectar infraestructura</h1>
        <p>Completá <code>.env.local</code> con la URL y la publishable key del proyecto Supabase.</p>
        <p class="muted">No coloques claves secretas ni service_role en el navegador.</p>
      </section>
    </main>`
}

async function render(session) {
  if (!session) {
    renderLogin(app, async (email) => {
      await AuthService.signInWithEmail(email)
      app.querySelector('[data-feedback]').textContent = 'Te enviamos un enlace de acceso. Revisá tu correo.'
    })
    return
  }

  const signOut = async () => AuthService.signOut()
  const showShell = () => renderShell(app, session.user, {
    onSignOut: signOut,
    onOpenEditorial: () => renderWorkspace(app, session.user, signOut, showShell)
  })
  await showShell()
}

async function start() {
  if (!isSupabaseConfigured) return showConfigError()
  try {
    const session = await AuthService.getSession()
    await render(session)
    unsubscribe = AuthService.onChange((nextSession) => {
      render(nextSession).catch((error) => {
        app.innerHTML = `<main class="center-screen"><section class="panel"><h1>No se pudo cargar Madre</h1><p>${escapeHtml(error.message)}</p></section></main>`
      })
    })
  } catch (error) {
    app.innerHTML = `<main class="center-screen"><section class="panel"><h1>No se pudo iniciar Madre</h1><p>${escapeHtml(error.message)}</p></section></main>`
  }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char])
}

window.addEventListener('beforeunload', () => unsubscribe?.())
start()
