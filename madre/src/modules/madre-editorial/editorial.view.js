import { EditorialService } from '../../shared/services/editorial.service.js'

const esc = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c])

const date = (value) => new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium', timeStyle: 'short'
}).format(new Date(value))

const formatDefinitions = [
  { type: 'web_seo', label: 'Web SEO', detail: 'Nota web optimizada para buscadores', placeholder: 'Redactá la nota web con título, bajada, desarrollo y datos verificables.' },
  { type: 'video_reel_60', label: 'Reel · 60 segundos', detail: 'Guion audiovisual breve', placeholder: 'Escribí apertura, desarrollo, apoyos visuales y cierre para un reel de hasta 60 segundos.' },
  { type: 'podcast_primera_hora', label: 'Podcast Primera Hora', detail: 'Guion para audio', placeholder: 'Prepará conducción, contexto, preguntas, transiciones y cierre del episodio.' },
  { type: 'instagram_carousel_8', label: 'Carrusel · 8 placas', detail: 'Secuencia de ocho placas', placeholder: 'Desarrollá ocho placas numeradas, con una idea clara y verificable por placa.' },
  { type: 'newsletter', label: 'Newsletter', detail: 'Boletín para suscriptores', placeholder: 'Redactá asunto, apertura, desarrollo, enlaces y cierre del boletín.' },
  { type: 'whatsapp', label: 'WhatsApp', detail: 'Mensaje de distribución', placeholder: 'Prepará un mensaje claro, breve y contextualizado para WhatsApp.' }
]

const verificationLabel = {
  pending: 'Pendiente', verified: 'Verificada', attributed: 'Atribuida',
  unverified: 'No verificada', contradictory: 'Contradictoria', missing_source: 'Sin fuente'
}

export async function renderWorkspace(root, user, onSignOut, onBackToShell = () => {}) {
  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="#" aria-label="Madre inicio">MADRE<span class="dot">.</span></a>
        <p class="eyebrow">ESPACIO DE TRABAJO</p>
        <nav aria-label="Navegación principal">
          <a class="nav-item" href="#/" id="back-to-shell">← Catálogo de módulos</a>
          <a class="nav-item active" href="#editorial">Madre Editorial</a>
          <span class="nav-item disabled">Biblioteca Riojana <small>Próximamente</small></span>
          <span class="nav-item disabled">Editor Crítico <small>Próximamente</small></span>
          <span class="nav-item disabled">Transcripción <small>Próximamente</small></span>
          <span class="nav-item disabled">Observatorios <small>Próximamente</small></span>
          <span class="nav-item disabled">Distribución <small>Próximamente</small></span>
        </nav>
        <div class="sidebar-bottom"><span class="muted small">${esc(user.email)}</span><button class="button ghost full" id="sign-out">Cerrar sesión</button></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><div><p class="eyebrow">NÚCLEO EDITORIAL</p><h1>Madre Editorial</h1></div><span class="status-pill">Entorno conectado</span></header>
        <section class="intro-row"><div><h2>Unidades editoriales</h2><p class="muted">Cada investigación comienza con una unidad común, sus fuentes y sus evidencias.</p></div><button class="button primary" id="new-unit">＋ Nueva unidad</button></section>
        <section class="work-queue" aria-labelledby="work-queue-heading">
          <div class="work-queue-head"><div><p class="eyebrow">OPERACIÓN EDITORIAL</p><h2 id="work-queue-heading">Bandeja de trabajo</h2><p class="muted small">Asignaciones, prioridades, fechas límite y decisiones de revisión.</p></div><div id="queue-metrics" class="queue-metrics" aria-live="polite"></div></div>
          <div class="queue-toolbar"><label for="queue-filter">Ver</label><select id="queue-filter"><option value="all">Todas las unidades</option><option value="mine">Mi trabajo</option><option value="review">Esperando revisión</option><option value="overdue">Vencidas</option><option value="unassigned">Sin asignar</option></select></div>
          <div id="work-queue-list" class="work-queue-list" aria-live="polite"><p class="muted small">Cargando bandeja…</p></div>
        </section>
        <div id="notice" class="notice" role="status" aria-live="polite"></div>
        <section id="unit-list" class="unit-list" aria-live="polite"><div class="loading">Cargando unidades…</div></section>
      </main>
    </div>
    <dialog id="unit-dialog" class="dialog"><form id="unit-form" method="dialog" class="stack">
      <div class="dialog-head"><div><p class="eyebrow">NUEVO CONTENIDO</p><h2>Crear unidad editorial</h2></div><button type="button" class="icon-button" id="close-dialog" aria-label="Cerrar">×</button></div>
      <label for="unit-title">Título de trabajo</label><input id="unit-title" name="title" required maxlength="180" placeholder="¿Qué hecho o tema vamos a investigar?" />
      <label for="unit-summary">Resumen inicial <span class="muted">(opcional)</span></label><textarea id="unit-summary" name="summary" rows="4" placeholder="Contexto breve, origen de la información o pregunta central"></textarea>
      <div class="dialog-actions"><button type="button" class="button ghost" id="cancel-dialog">Cancelar</button><button class="button primary" type="submit">Crear unidad</button></div>
    </form></dialog>
    <dialog id="detail-dialog" class="dialog wide"><form id="detail-form" method="dialog" class="stack">
      <div class="dialog-head"><div><p class="eyebrow">UNIDAD EDITORIAL MADRE</p><h2 id="detail-heading">Editar unidad</h2></div><button type="button" class="icon-button" id="close-detail" aria-label="Cerrar">×</button></div>
      <input type="hidden" name="id" />
      <label for="detail-title">Título</label><input id="detail-title" name="title" required maxlength="180" />
      <label for="detail-summary">Resumen</label><textarea id="detail-summary" name="summary" rows="3"></textarea>
      <label for="detail-content">Contenido madre</label><textarea id="detail-content" name="content_mother" rows="8" placeholder="Desarrollá aquí el núcleo de información y contexto."></textarea>
      <label for="change-note">Motivo de esta modificación</label><input id="change-note" name="change_note" required minlength="3" maxlength="500" placeholder="Ej.: incorporación de nueva documentación oficial" />
      <section class="version-panel" aria-labelledby="version-heading"><div class="version-panel-head"><h3 id="version-heading">Historial de versiones</h3><span class="muted small">Las versiones anteriores no se sobrescriben</span></div><div id="version-list" class="version-list" aria-live="polite"><p class="muted small">Cargando historial…</p></div></section>
      <label for="detail-status">Estado editorial</label><input id="detail-status" value="Borrador" readonly aria-readonly="true" />
      <section class="review-workflow" aria-labelledby="review-workflow-heading">
        <div class="quality-panel-head"><div><h3 id="review-workflow-heading">Revisión y aprobación humana</h3><p class="muted small">La solicitud requiere seis formatos vigentes y un control de calidad actualizado. La decisión final corresponde a un editor.</p></div></div>
        <div id="review-history" class="review-history" aria-live="polite"><p class="muted small">Cargando historial de revisión…</p></div>
        <label for="review-note">Nota para el equipo</label>
        <textarea id="review-note" rows="2" minlength="3" maxlength="3000" placeholder="Motivo de la solicitud, correcciones o fundamento de aprobación…"></textarea>
        <div class="dialog-actions review-actions">
          <button type="button" class="button ghost" id="request-review" data-event="review_requested" hidden>Solicitar revisión</button>
          <button type="button" class="button ghost" id="request-changes" data-event="changes_requested" hidden>Solicitar correcciones</button>
          <button type="button" class="button primary" id="approve-review" data-event="approved" hidden>Aprobar como Revisado</button>
        </div>
      </section>
      <section class="work-assignment" aria-labelledby="work-assignment-heading">
        <div><h3 id="work-assignment-heading">Organización del trabajo</h3><p class="muted small">La asignación y los cambios de prioridad quedan registrados. Solo editor/admin pueden administrar esta planificación.</p></div>
        <div class="work-assignment-grid"><div><label for="work-assignee">Responsable asignado</label><select id="work-assignee"><option value="">Sin asignar</option></select></div><div><label for="work-priority">Prioridad</label><select id="work-priority"><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></div><div><label for="work-due">Fecha límite</label><input id="work-due" type="datetime-local" /></div></div>
        <label for="work-note">Motivo del cambio</label><input id="work-note" maxlength="1000" minlength="3" placeholder="Ej.: asignación para cierre de edición" />
        <div class="dialog-actions"><button type="button" class="button ghost" id="save-work-assignment">Guardar planificación</button></div>
        <h4>Historial de asignaciones</h4><div id="work-history" class="review-history" aria-live="polite"><p class="muted small">Todavía no hay cambios de planificación.</p></div>
      </section>
      <p class="muted small">La publicación continúa reservada a perfiles editor/admin y solo puede realizarse después del estado Revisado.</p>
      <div class="dialog-actions"><button type="button" class="button ghost" id="open-research">Fuentes y verificación</button><button type="button" class="button ghost" id="open-formats">Seis formatos</button><button type="button" class="button ghost" id="cancel-detail">Cerrar</button><button class="button primary" type="submit">Guardar cambios</button></div>
    </form></dialog>
    <dialog id="formats-dialog" class="dialog wide"><div class="stack">
      <div class="dialog-head"><div><p class="eyebrow">DERIVACIÓN MULTIFORMATO</p><h2 id="formats-heading">Seis formatos editoriales</h2></div><button type="button" class="icon-button" id="close-formats" aria-label="Cerrar">×</button></div>
      <p class="muted small">Cada borrador queda vinculado a una versión concreta del contenido madre. Si cambia la investigación, el formato se marca como desactualizado y necesita revisión.</p>
      <div id="format-list" class="format-list" aria-live="polite"><p class="muted small">Cargando formatos…</p></div>
      <section class="quality-panel" aria-labelledby="quality-heading">
        <div class="quality-panel-head"><div><h3 id="quality-heading">Control de calidad editorial</h3><p class="muted small">Revisión estructural, trazabilidad y alertas comparativas. No reemplaza el criterio periodístico.</p></div><button type="button" class="button primary" id="run-quality">Ejecutar control</button></div>
        <div id="quality-report" aria-live="polite"><p class="muted small">Todavía no se ejecutó un control para esta unidad.</p></div>
        <form id="quality-observation-form" class="quality-observation-form">
          <div><label for="quality-severity">Tipo de observación</label><select id="quality-severity" name="severity"><option value="note">Nota</option><option value="warning">Advertencia</option><option value="critical">Crítica</option></select></div>
          <div><label for="quality-note">Observación editorial</label><textarea id="quality-note" name="note" rows="2" minlength="3" maxlength="3000" required placeholder="Registrá un punto que el equipo deba atender…"></textarea></div>
          <button type="submit" class="button ghost" id="save-quality-observation" disabled>Registrar observación</button>
        </form>
      </section>
      <form id="format-form" class="format-editor stack">
        <h3>Editar borrador</h3>
        <label for="format-type">Formato</label>
        <select id="format-type" name="format_type">
          <option value="web_seo">Web SEO</option>
          <option value="video_reel_60">Reel · 60 segundos</option>
          <option value="podcast_primera_hora">Podcast Primera Hora</option>
          <option value="instagram_carousel_8">Carrusel · 8 placas</option>
          <option value="newsletter">Newsletter</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <label for="format-title">Título de la pieza</label><input id="format-title" name="title" required maxlength="240" />
        <label for="format-content">Contenido del borrador</label><textarea id="format-content" name="content" required maxlength="60000" rows="12" placeholder="Seleccioná un formato y desarrollá el contenido. La pieza se guardará como borrador."></textarea>
        <p id="format-source-note" class="muted small" aria-live="polite">Todavía no hay un borrador seleccionado.</p>
        <p id="format-ai-note" class="notice" role="status" aria-live="polite">La generación asistida requiere configuración del proveedor y siempre queda pendiente de revisión humana.</p>
        <div class="dialog-actions"><button type="button" class="button ghost" id="cancel-formats">Cerrar</button><button type="button" class="button ghost" id="generate-format">Generar con IA</button><button class="button primary" type="submit">Guardar borrador</button></div>
      </form>
    </div></dialog>
    <dialog id="research-dialog" class="dialog wide"><div class="stack">
      <div class="dialog-head"><div><p class="eyebrow">TRAZABILIDAD PERIODÍSTICA</p><h2 id="research-heading">Investigación</h2></div><button type="button" class="icon-button" id="close-research" aria-label="Cerrar">×</button></div>
      <div class="research-grid">
        <section class="research-panel"><h3>Registrar fuente</h3><form id="source-form" class="stack compact">
          <label>Título / identificación</label><input name="title" required maxlength="240" placeholder="Documento, entrevista, informe…" />
          <label>Tipo de fuente</label><select name="source_type"><option value="document">Documento</option><option value="interview">Entrevista</option><option value="official">Organismo oficial</option><option value="media">Medio de comunicación</option><option value="dataset">Base de datos</option><option value="other" selected>Otra</option></select>
          <label>URL</label><input name="source_url" type="url" placeholder="https://" />
          <label>Autor / organismo</label><input name="author" />
          <label>Editor / publicación</label><input name="publisher" />
          <label>Extracto original</label><textarea name="original_text" rows="3"></textarea>
          <label>Notas de contexto</label><textarea name="notes" rows="2"></textarea>
          <button class="button primary" type="submit">Guardar fuente</button>
        </form><div id="source-list" class="record-list"></div></section>
        <section class="research-panel"><h3>Registrar afirmación</h3><form id="claim-form" class="stack compact">
          <label>Afirmación concreta</label><textarea name="claim_text" rows="3" required placeholder="Una afirmación verificable por cada registro"></textarea>
          <label>Tipo</label><select name="claim_type"><option value="fact">Hecho</option><option value="quote">Cita</option><option value="data">Dato</option><option value="opinion">Opinión</option><option value="interpretation">Interpretación</option><option value="hypothesis">Hipótesis</option></select>
          <label>Importancia</label><select name="importance"><option value="normal">Normal</option><option value="low">Baja</option><option value="high">Alta</option><option value="critical">Crítica</option></select>
          <label>Contexto / precisión</label><textarea name="context_note" rows="2"></textarea>
          <button class="button primary" type="submit">Guardar afirmación</button>
        </form><div id="claim-list" class="record-list"></div></section>
        <section class="research-panel"><h3>Vincular evidencia</h3><form id="evidence-form" class="stack compact">
          <label>Afirmación relacionada</label><select name="claim_id" id="evidence-claim"><option value="">Evidencia general</option></select>
          <label>Fuente relacionada</label><select name="source_id" id="evidence-source"><option value="">Sin fuente vinculada</option></select>
          <label>Extracto / evidencia</label><textarea name="evidence_text" rows="3" required></textarea>
          <label>Localizador (página, minuto, párrafo)</label><input name="locator" placeholder="Pág. 4 / 00:12:30 / párrafo 8" />
          <label>Relación</label><select name="relation"><option value="supports">Apoya</option><option value="contradicts">Contradice</option><option value="contextualizes">Contextualiza</option></select>
          <button class="button primary" type="submit">Guardar evidencia</button>
        </form><div id="evidence-list" class="record-list"></div></section>
      </div>
      <section class="research-panel"><h3>Verificación humana</h3><p class="muted small">Solo perfiles con rol revisor, editor o administrador pueden registrar una verificación. La base de datos valida el permiso.</p><div id="verification-list" class="record-list"></div></section>
      <div class="dialog-actions"><button type="button" class="button ghost" id="research-done">Volver a la unidad</button></div>
    </div></dialog>`

  root.querySelector('#sign-out').addEventListener('click', onSignOut)
  root.querySelector('#back-to-shell').addEventListener('click', (event) => {
    event.preventDefault()
    onBackToShell()
  })
  const createDialog = root.querySelector('#unit-dialog')
  const detailDialog = root.querySelector('#detail-dialog')
  const researchDialog = root.querySelector('#research-dialog')
  const formatsDialog = root.querySelector('#formats-dialog')
  formatsDialog.addEventListener('close', () => {
    if (activeUnitId && !detailDialog.open) detailDialog.showModal()
  })
  const notice = root.querySelector('#notice')
  let activeUnitId = null
  let activeUnitTitle = ''
  let activeUnit = null
  let currentRoles = []
  try { currentRoles = await EditorialService.myRoles() } catch { currentRoles = [] }
  let workAssignees = []
  let workQueueItems = []
  let formatRecords = []
  let generatedSourceVersionId = null
  let activeQualityReviewId = null
  let bundle = { sources: [], claims: [], evidences: [], verifications: [] }

  root.querySelector('#new-unit').addEventListener('click', () => createDialog.showModal())
  root.querySelector('#close-dialog').addEventListener('click', () => createDialog.close())
  root.querySelector('#cancel-dialog').addEventListener('click', () => createDialog.close())
  root.querySelector('#close-detail').addEventListener('click', () => detailDialog.close())
  root.querySelector('#cancel-detail').addEventListener('click', () => detailDialog.close())
  root.querySelector('#close-research').addEventListener('click', () => researchDialog.close())
  root.querySelector('#research-done').addEventListener('click', () => researchDialog.close())
  root.querySelector('#close-formats').addEventListener('click', () => formatsDialog.close())
  root.querySelector('#cancel-formats').addEventListener('click', () => formatsDialog.close())
  root.querySelector('#open-formats').addEventListener('click', async () => {
    activeUnitId = root.querySelector('#detail-form').elements.id.value
    activeUnitTitle = root.querySelector('#detail-heading').textContent
    await loadFormats()
    await loadQualityHistory()
    detailDialog.close()
    formatsDialog.showModal()
  })
  root.querySelector('#format-type').addEventListener('change', (event) => {
    generatedSourceVersionId = null
    root.querySelector('#format-ai-note').textContent = 'La generación asistida requiere configuración del proveedor y siempre queda pendiente de revisión humana.'
    selectFormat(event.currentTarget.value)
  })
  root.querySelector('#generate-format').addEventListener('click', async () => {
    const button = root.querySelector('#generate-format')
    const form = root.querySelector('#format-form')
    const note = root.querySelector('#format-ai-note')
    button.disabled = true
    note.textContent = 'Generando borrador con el contenido madre, fuentes y verificaciones disponibles…'
    try {
      const result = await EditorialService.generateFormat(activeUnitId, form.elements.format_type.value)
      form.elements.title.value = result.draft.title
      form.elements.content.value = result.draft.content
      generatedSourceVersionId = result.source_version_id
      const sourceCount = result.draft.source_ids?.length ?? 0
      const claimCount = result.draft.claim_ids?.length ?? 0
      const notes = result.draft.editorial_notes?.length
        ? ' Alertas: ' + result.draft.editorial_notes.join(' · ')
        : ''
      note.textContent = `Borrador generado sobre la versión madre ${result.source_version_number}. Referencias internas: ${sourceCount} fuentes y ${claimCount} afirmaciones. Pendiente de revisión humana.${notes}`
      root.querySelector('#format-source-note').textContent = 'Generado sobre versión ' + result.source_version_number + '. Si cambia el contenido madre antes de guardar, habrá que volver a generar.'
    } catch (error) {
      note.textContent = error.message
    } finally {
      button.disabled = false
    }
  })

  root.querySelector('#run-quality').addEventListener('click', async () => {
    const button = root.querySelector('#run-quality')
    button.disabled = true
    root.querySelector('#quality-report').innerHTML = '<p class="muted small">Analizando fuentes, afirmaciones, evidencias y los seis formatos…</p>'
    try {
      const review = await EditorialService.runQualityCheck(activeUnitId)
      activeQualityReviewId = review.id
      await loadQualityHistory()
      notice.textContent = review.status === 'needs_attention'
        ? 'Control registrado: hay alertas que requieren atención editorial.'
        : 'Control registrado. Los chequeos estructurales finalizaron; continúa la revisión humana.'
    } catch (error) {
      root.querySelector('#quality-report').innerHTML = '<p class="muted small">' + esc(error.message) + '</p>'
    } finally {
      button.disabled = false
    }
  })

  root.querySelector('#quality-observation-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!activeQualityReviewId) {
      notice.textContent = 'Ejecutá primero un control de calidad para asociar la observación.'
      return
    }
    const form = event.currentTarget
    const button = form.querySelector('[type="submit"]')
    const values = Object.fromEntries(new FormData(form).entries())
    button.disabled = true
    try {
      await EditorialService.addQualityObservation(activeQualityReviewId, values)
      form.reset()
      await loadQualityHistory()
      notice.textContent = 'Observación editorial registrada en el historial.'
    } catch (error) {
      notice.textContent = error.message
    } finally {
      button.disabled = false
    }
  })

  async function loadQualityHistory() {
    const container = root.querySelector('#quality-report')
    const saveButton = root.querySelector('#save-quality-observation')
    activeQualityReviewId = null
    container.innerHTML = '<p class="muted small">Cargando historial de controles…</p>'
    try {
      const [history, latestVersion] = await Promise.all([
        EditorialService.qualityHistory(activeUnitId),
        EditorialService.latestVersionId(activeUnitId)
      ])
      const latest = history[0]
      if (!latest) {
        activeQualityReviewId = null
        saveButton.disabled = true
        container.innerHTML = '<p class="muted small">Todavía no se ejecutó un control para esta unidad.</p>'
        return
      }
      const lastFormatChange = Math.max(0, ...formatRecords.map(item => new Date(item.updated_at).getTime()))
      const reportIsCurrent = latest.source_version_id === latestVersion.id && new Date(latest.created_at).getTime() >= lastFormatChange
      activeQualityReviewId = reportIsCurrent ? latest.id : null
      saveButton.disabled = !reportIsCurrent
      const statusLabel = !reportIsCurrent
        ? 'Control desactualizado · ejecutar nuevamente'
        : latest.status === 'needs_attention' ? 'Requiere atención' : 'Chequeos completados · revisión humana pendiente'
      const findings = latest.findings ?? []
      const severityLabel = { critical: 'Crítica', warning: 'Advertencia', note: 'Nota' }
      const checklist = latest.checklist ?? []
      const observations = latest.observations ?? []
      container.innerHTML = `
        <div class="quality-summary"><strong>${esc(statusLabel)}</strong><span>Versión ${esc(latest.metrics?.version_number ?? '—')} · ${date(latest.created_at)}</span><span>${esc(findings.length)} alertas · ${esc(observations.length)} observaciones humanas</span></div>
        <div class="quality-checklist"><h4>Checklist</h4>${checklist.map(item => `<div class="quality-check"><span class="${item.passed ? 'quality-pass' : 'quality-pending'}">${item.passed ? '✓' : '○'}</span><div><strong>${esc(item.label)}</strong><small>${esc(item.detail)}</small></div></div>`).join('')}</div>
        <div class="quality-findings"><h4>Alertas detectadas</h4>${findings.length ? findings.map(item => `<article class="quality-finding severity-${esc(item.severity)}"><strong>${esc(severityLabel[item.severity] || item.severity)} · ${esc(item.code.replaceAll('_', ' '))}</strong><p>${esc(item.message)}</p>${item.format_type ? `<small>Formato: ${esc(item.format_type.replaceAll('_', ' '))}</small>` : ''}</article>`).join('') : '<p class="muted small">No se detectaron alertas estructurales. Esto no equivale a una aprobación editorial.</p>'}</div>
        <div class="quality-observations"><h4>Observaciones del equipo</h4>${observations.length ? observations.map(item => `<article class="quality-observation"><span>${esc(severityLabel[item.severity] || item.severity)} · ${date(item.created_at)}</span><p>${esc(item.note)}</p></article>`).join('') : '<p class="muted small">Todavía no hay observaciones humanas registradas.</p>'}</div>
        ${history.length > 1 ? `<p class="muted small">Hay ${history.length - 1} controles anteriores en el historial.</p>` : ''}
      `
    } catch (error) {
      activeQualityReviewId = null
      saveButton.disabled = true
      container.innerHTML = '<p class="muted small">No se pudo cargar el historial: ' + esc(error.message) + '</p>'
    }
  }

  root.querySelector('#format-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const button = form.querySelector('[type="submit"]')
    const values = Object.fromEntries(new FormData(form).entries())
    button.disabled = true
    try {
      if (generatedSourceVersionId) {
        const latest = await EditorialService.latestVersionId(activeUnitId)
        if (latest.id !== generatedSourceVersionId) {
          throw new Error('El contenido madre cambió desde la generación. Volvé a generar el borrador para usar la versión vigente.')
        }
      }
      await EditorialService.saveFormat(activeUnitId, values)
      generatedSourceVersionId = null
      root.querySelector('#format-ai-note').textContent = 'Borrador guardado. La aprobación y publicación requieren revisión humana.'
      notice.textContent = 'Borrador guardado y vinculado a la versión madre vigente.'
      await loadFormats()
      selectFormat(values.format_type)
      await loadQualityHistory()
    } catch (error) {
      notice.textContent = error.message
    } finally {
      button.disabled = false
    }
  })
  root.querySelector('#open-research').addEventListener('click', async () => {
    activeUnitId = root.querySelector('#detail-form').elements.id.value
    await loadResearch()
    detailDialog.close()
    researchDialog.showModal()
  })

  root.querySelector('#unit-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const button = event.currentTarget.querySelector('[type="submit"]')
    button.disabled = true
    try {
      await EditorialService.create({ title: form.get('title'), summary: form.get('summary') })
      createDialog.close(); event.currentTarget.reset()
      notice.textContent = 'Unidad editorial creada.'
      await Promise.all([loadUnits(), loadWorkQueue()])
    } catch (error) { notice.textContent = error.message }
    finally { button.disabled = false }
  })

  root.querySelector('#detail-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const button = event.currentTarget.querySelector('[type="submit"]')
    button.disabled = true
    try {
      await EditorialService.update(form.get('id'), { title: form.get('title'), summary: form.get('summary'), content_mother: form.get('content_mother') }, form.get('change_note'))
      notice.textContent = 'Cambios guardados. Si hubo cambios editoriales, se agregó una versión al historial.'
      detailDialog.close(); await Promise.all([loadUnits(), loadWorkQueue()])
    } catch (error) { notice.textContent = error.message }
    finally { button.disabled = false }
  })

  async function submitResearch(formId, method, valuesMap) {
    const form = root.querySelector(formId)
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const button = form.querySelector('[type="submit"]')
      button.disabled = true
      try {
        const data = new FormData(form)
        const values = Object.fromEntries([...data.entries()].map(([key, value]) => [key, String(value)]))
        await EditorialService[method](activeUnitId, values)
        form.reset()
        notice.textContent = 'Registro de investigación guardado.'
        await loadResearch()
      } catch (error) { notice.textContent = error.message }
      finally { button.disabled = false }
    })
  }
  submitResearch('#source-form', 'addSource')
  submitResearch('#claim-form', 'addClaim')
  submitResearch('#evidence-form', 'addEvidence')

  async function loadResearch() {
    try {
      bundle = await EditorialService.researchBundle(activeUnitId)
      root.querySelector('#source-list').innerHTML = bundle.sources.map(item => `<article class="record-item"><strong>${esc(item.title)}</strong><span>${esc(item.publisher || item.author || item.source_type)}</span>${item.source_url ? `<a href="${esc(item.source_url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ↗</a>` : ''}</article>`).join('') || '<p class="muted small">Todavía no hay fuentes.</p>'
      root.querySelector('#claim-list').innerHTML = bundle.claims.map(item => `<article class="record-item"><strong>${esc(item.claim_text)}</strong><span>${esc(item.claim_type)} · ${esc(verificationLabel[item.verification_status] || item.verification_status)}</span></article>`).join('') || '<p class="muted small">Todavía no hay afirmaciones.</p>'
      root.querySelector('#evidence-list').innerHTML = bundle.evidences.map(item => `<article class="record-item"><strong>${esc(item.evidence_text)}</strong><span>${esc(item.relation)} · ${esc(item.locator || 'Sin localizador')}</span></article>`).join('') || '<p class="muted small">Todavía no hay evidencias.</p>'
      root.querySelector('#evidence-claim').innerHTML = '<option value="">Evidencia general</option>' + bundle.claims.map(item => `<option value="${esc(item.id)}">${esc(item.claim_text.slice(0, 100))}</option>`).join('')
      root.querySelector('#evidence-source').innerHTML = '<option value="">Sin fuente vinculada</option>' + bundle.sources.map(item => `<option value="${esc(item.id)}">${esc(item.title)}</option>`).join('')
      root.querySelector('#verification-list').innerHTML = bundle.claims.map(claim => {
        const last = bundle.verifications.find(item => item.claim_id === claim.id)
        return `<article class="record-item"><strong>${esc(claim.claim_text)}</strong><span>Estado: ${esc(verificationLabel[(bundle.verifications.find(item => item.claim_id === claim.id)?.status) || claim.verification_status] || claim.verification_status)}</span><form class="verify-form compact" data-claim-id="${esc(claim.id)}"><select name="status" aria-label="Resultado de verificación"><option value="verified">Verificada</option><option value="attributed">Atribuida</option><option value="unverified">No verificada</option><option value="contradictory">Contradictoria</option><option value="missing_source">Sin fuente</option></select><input name="rationale" placeholder="Fundamento de la revisión" /><button class="button ghost" type="submit">Registrar revisión humana</button></form>${last ? `<span>Última revisión: ${esc(verificationLabel[last.status] || last.status)} · ${date(last.checked_at)}</span>` : ''}</article>`
      }).join('') || '<p class="muted small">Agregá afirmaciones para iniciar la verificación.</p>'
      root.querySelectorAll('.verify-form').forEach(form => form.addEventListener('submit', async event => {
        event.preventDefault()
        const button = form.querySelector('button')
        button.disabled = true
        try {
          const values = Object.fromEntries(new FormData(form).entries())
          await EditorialService.addVerification(form.dataset.claimId, values)
          notice.textContent = 'Verificación humana registrada.'
          await loadResearch()
        } catch (error) { notice.textContent = error.message }
        finally { button.disabled = false }
      }))
    } catch (error) {
      notice.textContent = `No se pudo cargar la investigación: ${error.message}`
    }
  }

  function selectFormat(type) {
    generatedSourceVersionId = null
    root.querySelector('#format-ai-note').textContent = 'La generación asistida requiere configuración del proveedor y siempre queda pendiente de revisión humana.'
    const definition = formatDefinitions.find(item => item.type === type)
    const record = formatRecords.find(item => item.format_type === type)
    const form = root.querySelector('#format-form')
    form.elements.format_type.value = type
    form.elements.title.value = record?.title ?? (activeUnitTitle ? `${activeUnitTitle} — ${definition.label}` : definition.label)
    form.elements.content.value = record?.content ?? ''
    root.querySelector('#format-content').placeholder = definition.placeholder
    root.querySelector('#format-source-note').textContent = record
      ? `Estado: ${record.status === 'approved' ? 'Aprobado' : record.status === 'reviewed' ? 'Revisado' : 'Borrador'} · ${record.is_stale ? 'DESACTUALIZADO: requiere comparar con el contenido madre vigente' : 'Vinculado a la versión madre vigente'} · Última edición: ${date(record.updated_at)}`
      : 'Aún no existe este borrador. Al guardarlo quedará vinculado a la última versión madre.'
  }

  async function loadFormats() {
    const list = root.querySelector('#format-list')
    list.innerHTML = '<p class="muted small">Cargando los seis formatos…</p>'
    try {
      formatRecords = await EditorialService.formats(activeUnitId)
      list.innerHTML = formatDefinitions.map(definition => {
        const record = formatRecords.find(item => item.format_type === definition.type)
        const state = !record ? 'Sin borrador' : record.is_stale ? 'Desactualizado' : record.status === 'approved' ? 'Aprobado' : record.status === 'reviewed' ? 'Revisado' : 'Borrador'
        const stateClass = record?.is_stale ? 'format-state stale' : 'format-state'
        return `<article class="format-card">
          <div><strong>${esc(definition.label)}</strong><span>${esc(definition.detail)}</span><small class="${stateClass}">${esc(state)}</small></div>
          <button type="button" class="button ghost edit-format" data-format-type="${esc(definition.type)}">${record ? 'Editar' : 'Crear borrador'}</button>
        </article>`
      }).join('')
      list.querySelectorAll('.edit-format').forEach(button => button.addEventListener('click', () => selectFormat(button.dataset.formatType)))
      const current = root.querySelector('#format-type').value
      selectFormat(current)
    } catch (error) {
      list.innerHTML = `<p class="muted small">No se pudieron cargar los formatos: ${esc(error.message)}</p>`
    }
  }

  function canManageWork() { return currentRoles.some(role => ['editor', 'admin'].includes(role)) }

  function workLane(item) {
    if (item.status === 'published') return 'Publicado'
    if (item.status === 'reviewed') return 'Revisado'
    if (item.latest_review_current && item.latest_review?.event_type === 'review_requested') return 'Esperando revisión'
    if (item.latest_review_current && item.latest_review?.event_type === 'changes_requested') return 'Correcciones solicitadas'
    if (item.latest_review && !item.latest_review_current) return 'Revisión desactualizada'
    return 'En producción'
  }

  function renderQueue() {
    const container = root.querySelector('#work-queue-list')
    const filter = root.querySelector('#queue-filter').value
    const now = Date.now()
    const filtered = workQueueItems.filter(item => {
      if (filter === 'mine') return item.assigned_to === user.id || item.created_by === user.id
      if (filter === 'review') return item.status === 'draft' && item.latest_review_current && item.latest_review?.event_type === 'review_requested'
      if (filter === 'overdue') return item.status === 'draft' && item.due_at && new Date(item.due_at).getTime() < now
      if (filter === 'unassigned') return !item.assigned_to && item.status === 'draft'
      return true
    })
    const rank = { urgent: 0, high: 1, normal: 2, low: 3 }
    filtered.sort((a,b) => (rank[a.priority] ?? 2) - (rank[b.priority] ?? 2) || (a.due_at ? new Date(a.due_at).getTime() : Infinity) - (b.due_at ? new Date(b.due_at).getTime() : Infinity) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    if (!filtered.length) { container.innerHTML = '<p class="muted small">No hay unidades en esta vista.</p>'; return }
    const names = new Map(workAssignees.map(person => [person.id, person.display_name || ('Integrante ' + person.id.slice(0,8))]))
    const labels = { low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente' }
    container.innerHTML = filtered.map(item => {
      const overdue = item.status === 'draft' && item.due_at && new Date(item.due_at).getTime() < now
      const assignee = item.assigned_to === user.id ? 'Vos' : (names.get(item.assigned_to) || (item.assigned_to ? 'Otro integrante' : 'Sin asignar'))
      const due = item.due_at ? date(item.due_at) : 'Sin fecha límite'
      return '<article class="queue-card"><div class="queue-card-main"><div class="queue-card-top"><span class="queue-lane">' + esc(workLane(item)) + '</span><span class="queue-priority priority-' + esc(item.priority || 'normal') + '">' + esc(labels[item.priority] || 'Normal') + '</span></div><strong>' + esc(item.title) + '</strong><p>' + esc(item.summary || 'Sin resumen inicial.') + '</p><div class="queue-meta"><span>Responsable: ' + esc(assignee) + '</span><span class="' + (overdue ? 'queue-overdue' : '') + '">Vence: ' + esc(due) + (overdue ? ' · VENCIDA' : '') + '</span></div></div><button type="button" class="button ghost queue-open" data-id="' + esc(item.id) + '">Abrir unidad</button></article>'
    }).join('')
    container.querySelectorAll('.queue-open').forEach(button => button.addEventListener('click', () => openUnit(button.dataset.id)))
  }

  async function loadWorkQueue() {
    const container = root.querySelector('#work-queue-list')
    container.innerHTML = '<p class="muted small">Actualizando bandeja…</p>'
    try {
      const result = await EditorialService.workQueue(currentRoles)
      workQueueItems = result.items; workAssignees = result.assignees
      const pending = workQueueItems.filter(item => item.status === 'draft' && item.latest_review_current && item.latest_review?.event_type === 'review_requested').length
      const overdue = workQueueItems.filter(item => item.status === 'draft' && item.due_at && new Date(item.due_at).getTime() < Date.now()).length
      root.querySelector('#queue-metrics').innerHTML = '<span><strong>' + workQueueItems.length + '</strong> unidades</span><span><strong>' + pending + '</strong> en revisión</span><span><strong>' + overdue + '</strong> vencidas</span>'
      renderQueue()
    } catch (error) { container.innerHTML = '<p class="muted small">No se pudo cargar la bandeja: ' + esc(error.message) + '</p>' }
  }

  async function loadWorkAssignment(unitId) {
    const section = root.querySelector('.work-assignment')
    section.hidden = !canManageWork()
    if (!canManageWork()) return
    const select = root.querySelector('#work-assignee')
    select.innerHTML = '<option value="">Sin asignar</option>' + workAssignees.map(person => '<option value="' + esc(person.id) + '">' + esc(person.display_name || ('Integrante ' + person.id.slice(0,8))) + '</option>').join('')
    const unit = await EditorialService.get(unitId)
    select.value = unit.assigned_to || ''
    root.querySelector('#work-priority').value = unit.priority || 'normal'
    root.querySelector('#work-due').value = unit.due_at ? new Date(new Date(unit.due_at).getTime() - new Date(unit.due_at).getTimezoneOffset()*60000).toISOString().slice(0,16) : ''
    root.querySelector('#work-note').value = ''
    const history = await EditorialService.workHistory(unitId)
    root.querySelector('#work-history').innerHTML = history.length ? history.map(item => {
      const person = workAssignees.find(person => person.id === item.to_assigned_to)
      const assignee = item.to_assigned_to === user.id ? 'Vos' : (person?.display_name || (item.to_assigned_to ? 'Integrante ' + item.to_assigned_to.slice(0,8) : 'Sin asignar'))
      return '<article class="review-event"><strong>' + esc(assignee) + ' · Prioridad ' + esc(item.to_priority) + '</strong><span>' + date(item.created_at) + ' · Responsable ' + esc(item.created_by.slice(0,8)) + '</span><p>' + esc(item.note) + ' · Vencimiento: ' + (item.to_due_at ? date(item.to_due_at) : 'Sin fecha') + '</p></article>'
    }).join('') : '<p class="muted small">Todavía no hay cambios de planificación.</p>'
  }

  root.querySelector('#queue-filter').addEventListener('change', renderQueue)
  root.querySelector('#save-work-assignment').addEventListener('click', async () => {
    if (!activeUnitId || !canManageWork()) return
    const button = root.querySelector('#save-work-assignment')
    const note = root.querySelector('#work-note').value.trim()
    if (note.length < 3) { notice.textContent = 'Indicá el motivo de la asignación o cambio de planificación.'; return }
    button.disabled = true
    try {
      const dueValue = root.querySelector('#work-due').value
      await EditorialService.assignWork(activeUnitId, { assigned_to: root.querySelector('#work-assignee').value, priority: root.querySelector('#work-priority').value, due_at: dueValue ? new Date(dueValue).toISOString() : null, note })
      await loadWorkQueue(); await loadWorkAssignment(activeUnitId); await loadUnits()
      notice.textContent = 'Planificación guardada y registrada en el historial.'
    } catch (error) { notice.textContent = error.message }
    finally { button.disabled = false }
  })

  function canRequestReview(unit) {
    return unit?.status === 'draft' && (
      unit.created_by === user.id || unit.assigned_to === user.id ||
      currentRoles.includes('editor') || currentRoles.includes('admin')
    )
  }

  async function loadReviewHistory(unitId) {
    const container = root.querySelector('#review-history')
    const requestButton = root.querySelector('#request-review')
    const changesButton = root.querySelector('#request-changes')
    const approveButton = root.querySelector('#approve-review')
    container.innerHTML = '<p class="muted small">Cargando historial…</p>'
    try {
      const [events, latestVersion] = await Promise.all([
        EditorialService.reviewHistory(unitId),
        EditorialService.latestVersionId(unitId)
      ])
      const latest = events[0]
      const latestIsCurrent = Boolean(latest && latest.source_version_id === latestVersion.id)
      const labels = {
        review_requested: 'Revisión solicitada',
        changes_requested: 'Correcciones solicitadas',
        approved: 'Aprobado · estado Revisado'
      }
      container.innerHTML = events.length ? events.map(item => `
        <article class="review-event">
          <strong>${esc(labels[item.event_type] || item.event_type)}</strong>
          <span>${date(item.created_at)} · Responsable ${esc(item.created_by.slice(0, 8))}</span>
          <p>${esc(item.note)}</p>
        </article>`).join('') : '<p class="muted small">Todavía no hay decisiones registradas.</p>'

      const lastType = latestIsCurrent ? latest?.event_type ?? null : (latest ? 'stale' : null)
      requestButton.hidden = !canRequestReview(activeUnit) || (lastType !== null && lastType !== 'changes_requested' && lastType !== 'stale')
      changesButton.hidden = !(activeRolesCanReview() && activeUnit?.status === 'draft' && lastType === 'review_requested')
      approveButton.hidden = !(activeRolesCanEdit() && activeUnit?.status === 'draft' && lastType === 'review_requested')
      if (activeUnit?.status !== 'draft') {
        requestButton.hidden = true
        changesButton.hidden = true
        approveButton.hidden = true
      }
    } catch (error) {
      container.innerHTML = '<p class="muted small">No se pudo cargar el historial: ' + esc(error.message) + '</p>'
      requestButton.hidden = true
      changesButton.hidden = true
      approveButton.hidden = true
    }
  }

  function activeRolesCanReview() {
    return currentRoles.some(role => ['reviewer', 'editor', 'admin'].includes(role))
  }

  function activeRolesCanEdit() {
    return currentRoles.some(role => ['editor', 'admin'].includes(role))
  }

  root.querySelector('.review-actions').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-event]')
    if (!button || !activeUnitId) return
    const note = root.querySelector('#review-note').value.trim()
    if (note.length < 3) {
      notice.textContent = 'Escribí una nota de al menos 3 caracteres para registrar la decisión.'
      return
    }
    button.disabled = true
    try {
      await EditorialService.recordReviewEvent(activeUnitId, button.dataset.event, note)
      const refreshed = await EditorialService.get(activeUnitId)
      activeUnit = refreshed
      root.querySelector('#detail-status').value = refreshed.status === 'published' ? 'Publicado' : refreshed.status === 'reviewed' ? 'Revisado' : 'Borrador'
      root.querySelector('#review-note').value = ''
      await loadReviewHistory(activeUnitId)
      await Promise.all([loadUnits(), loadWorkQueue()])
      notice.textContent = button.dataset.event === 'approved'
        ? 'Aprobación humana registrada. La unidad pasó a Revisado.'
        : button.dataset.event === 'changes_requested'
          ? 'Correcciones solicitadas y decisión registrada.'
          : 'Solicitud de revisión registrada.'
    } catch (error) {
      notice.textContent = error.message
    } finally {
      button.disabled = false
    }
  })

  async function loadVersions(unitId) {
    const list = root.querySelector('#version-list')
    list.innerHTML = '<p class="muted small">Cargando historial…</p>'
    try {
      const versions = await EditorialService.versions(unitId)
      if (!versions.length) {
        list.innerHTML = '<p class="muted small">Todavía no hay versiones registradas.</p>'
        return
      }
      list.innerHTML = versions.map(item => `
        <article class="version-item">
          <div><strong>Versión ${esc(item.version_number)}</strong><span>${date(item.created_at)}</span><p>${esc(item.change_note || 'Sin motivo consignado')}</p></div>
          <button type="button" class="button ghost restore-version" data-version-id="${esc(item.id)}">Restaurar</button>
        </article>`).join('')
      list.querySelectorAll('.restore-version').forEach(button => button.addEventListener('click', async () => {
        const version = versions.find(item => item.id === button.dataset.versionId)
        if (!version?.snapshot) return
        if (!window.confirm(`¿Restaurar la versión ${version.version_number}? Se creará una versión nueva; el historial anterior se conservará.`)) return
        const reason = window.prompt('Indicá el motivo de esta restauración:')
        if (reason === null || reason.trim().length < 3) {
          notice.textContent = 'La restauración requiere un motivo de al menos 3 caracteres.'
          return
        }
        button.disabled = true
        try {
          await EditorialService.update(unitId, {
            title: version.snapshot.title ?? '',
            summary: version.snapshot.summary ?? '',
            content_mother: version.snapshot.content_mother ?? ''
          }, `Restauración de versión ${version.version_number}: ${reason.trim()}`)
          const restored = await EditorialService.get(unitId)
          const form = root.querySelector('#detail-form')
          form.elements.title.value = restored.title ?? ''
          form.elements.summary.value = restored.summary ?? ''
          form.elements.content_mother.value = restored.content_mother ?? ''
          root.querySelector('#change-note').value = ''
          notice.textContent = `Versión ${version.version_number} restaurada como una nueva versión.`
          await loadVersions(unitId)
          await Promise.all([loadUnits(), loadWorkQueue()])
        } catch (error) {
          notice.textContent = error.message
          button.disabled = false
        }
      }))
    } catch (error) {
      list.innerHTML = `<p class="muted small">No se pudo cargar el historial: ${esc(error.message)}</p>`
    }
  }

  async function openUnit(id) {
    try {
      const unit = await EditorialService.get(id)
      activeUnit = unit
      const form = root.querySelector('#detail-form')
      form.elements.id.value = unit.id
      form.elements.title.value = unit.title ?? ''
      form.elements.summary.value = unit.summary ?? ''
      form.elements.content_mother.value = unit.content_mother ?? ''
      root.querySelector('#detail-status').value = unit.status === 'published' ? 'Publicado' : unit.status === 'reviewed' ? 'Revisado' : 'Borrador'
      root.querySelector('#detail-heading').textContent = unit.title
      activeUnitTitle = unit.title
      activeUnitId = unit.id
      root.querySelector('#change-note').value = ''
      root.querySelector('#review-note').value = ''
      await Promise.all([loadVersions(unit.id), loadReviewHistory(unit.id), loadWorkAssignment(unit.id)])
      detailDialog.showModal()
    } catch (error) { notice.textContent = error.message }
  }

  async function loadUnits() {
    const list = root.querySelector('#unit-list')
    list.innerHTML = '<div class="loading">Cargando unidades…</div>'
    try {
      const units = await EditorialService.list()
      if (!units.length) {
        list.innerHTML = '<div class="empty-state"><span class="empty-mark">＋</span><h3>La primera unidad empieza acá</h3><p>Creá una unidad editorial para organizar el tema, las fuentes y el trabajo periodístico.</p><button class="button primary" id="empty-create">Crear primera unidad</button></div>'
        list.querySelector('#empty-create').addEventListener('click', () => createDialog.showModal())
        return
      }
      list.innerHTML = units.map(unit => `<button class="unit-card" data-id="${esc(unit.id)}"><span class="unit-card-top"><span class="state state-${esc(unit.status)}">${unit.status === 'draft' ? 'Borrador' : unit.status === 'reviewed' ? 'Revisado' : 'Publicado'}</span><time>${date(unit.updated_at)}</time></span><strong>${esc(unit.title)}</strong><span class="unit-summary">${esc(unit.summary || 'Sin resumen inicial.')}</span><span class="unit-open">Abrir unidad →</span></button>`).join('')
      list.querySelectorAll('[data-id]').forEach(button => button.addEventListener('click', () => openUnit(button.dataset.id)))
    } catch (error) {
      list.innerHTML = `<div class="empty-state"><h3>No se pudieron cargar las unidades</h3><p>${esc(error.message)}</p><button class="button ghost" id="retry">Reintentar</button></div>`
      list.querySelector('#retry').addEventListener('click', loadUnits)
    }
  }
  await Promise.all([loadUnits(), loadWorkQueue()])
}
