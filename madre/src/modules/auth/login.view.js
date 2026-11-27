export function renderLogin(root, onSubmit) {
  root.innerHTML = `
    <main class="center-screen">
      <section class="panel auth-panel">
        <p class="eyebrow">ECOSISTEMA EDITORIAL</p>
        <h1>MADRE<span class="dot">.</span></h1>
        <p class="lead">Un ecosistema para transformar información en conocimiento periodístico verificable.</p>
        <form id="login-form" class="stack">
          <label for="email">Correo electrónico</label>
          <input id="email" name="email" type="email" autocomplete="email" required placeholder="tu@correo.com" />
          <button class="button primary" type="submit">Enviar enlace de acceso</button>
          <p class="feedback" data-feedback role="status" aria-live="polite"></p>
        </form>
      </section>
    </main>`
  root.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const button = event.currentTarget.querySelector('button')
    const feedback = root.querySelector('[data-feedback]')
    button.disabled = true
    feedback.textContent = 'Enviando enlace…'
    try {
      await onSubmit(new FormData(event.currentTarget).get('email'))
    } catch (error) {
      feedback.textContent = error.message
    } finally {
      button.disabled = false
    }
  })
}
