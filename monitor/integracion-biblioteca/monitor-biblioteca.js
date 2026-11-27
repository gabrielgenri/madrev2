/*
 * Puente de solo lectura entre MonitorV3.2 y Biblioteca riojana.
 * Instalar como módulo ES en la página de Biblioteca (ver README.md).
 */
const MONITOR_DATA_URL = 'https://gabrielgenri.github.io/Monitor/data/monitor_v3_noticias.json';
const CATEGORIES = {
  'Política y Gestión': 'Instituciones',
  'Economía, Finanzas y Producción': 'Economía y producción',
  'Ciencia, Tecnología y Educación': 'Otra',
  'Sociedad, Salud y Justicia': 'Otra',
  'Normativa y Datos Oficiales': 'Instituciones',
  'Cultura y Deportes': 'Cultura y tradiciones'
};

const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

function safeURL(value) {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no informada' :
    new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: 'America/Argentina/La_Rioja' }).format(date);
}

function addStyles() {
  if (document.getElementById('brm-styles')) return;
  const style = document.createElement('style');
  style.id = 'brm-styles';
  style.textContent = `
    #brm-panel{max-width:56rem;margin:0 auto;padding:1rem 0 3rem;color:#172033}
    #brm-panel[hidden]{display:none!important}
    .brm-card{background:#fff;border:1px solid #dce4ef;border-radius:1rem;padding:1rem 1.15rem;margin:.75rem 0;box-shadow:0 1px 2px #1720330a}
    .brm-muted{color:#64748b;font-size:.78rem}
    .brm-title{font-family:Georgia,'Times New Roman',serif;font-size:1.08rem;line-height:1.35;margin:.35rem 0}
    .brm-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(12rem,.6fr);gap:.65rem;margin-top:.85rem}
    .brm-controls input,.brm-controls select{width:100%;min-height:44px;border:1px solid #cbd5e1;border-radius:.7rem;padding:.65rem .75rem;background:#fff;color:#172033}
    .brm-chip{display:inline-block;border-radius:999px;background:#f1f5f9;padding:.22rem .55rem;font-size:.68rem;color:#334155;margin-right:.3rem}
    .brm-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem}
    .brm-actions a,.brm-actions button,.brm-button{min-height:42px;display:inline-flex;align-items:center;justify-content:center;border:1px solid #cbd5e1;border-radius:999px;padding:.5rem .85rem;background:#fff;color:#172033;font:inherit;font-size:.8rem;font-weight:600;text-decoration:none;cursor:pointer}
    .brm-actions .brm-primary,.brm-button{background:#111;color:#fff;border-color:#111}
    .brm-actions button:disabled{opacity:.5;cursor:not-allowed}
    .brm-note{border-left:3px solid #111;padding:.65rem .8rem;background:#f8fafc;border-radius:.3rem;font-size:.78rem;line-height:1.5}
    .brm-empty{padding:2rem;text-align:center;color:#64748b}
    @media(max-width:640px){.brm-controls{grid-template-columns:1fr}.brm-card{padding:.9rem}}
  `;
  document.head.append(style);
}

function makePanel() {
  const main = document.querySelector('main');
  if (!main) return null;
  const section = document.createElement('section');
  section.id = 'brm-panel';
  section.hidden = true;
  section.setAttribute('aria-labelledby', 'brm-heading');
  section.innerHTML = `
    <div class="brm-card">
      <button class="brm-button" id="brm-back" type="button">← Volver a la Biblioteca</button>
      <h2 id="brm-heading" style="font-family:Georgia,'Times New Roman',serif;font-size:1.65rem;margin:.9rem 0 .25rem">Actualidad riojana</h2>
      <p class="brm-muted" id="brm-status" role="status" aria-live="polite">Cargando noticias de Monitor…</p>
      <p class="brm-note">Usá estas noticias como referencias de investigación. La Biblioteca publica fichas atemporales: el borrador conserva el enlace y queda abierto para redactar contexto, contrastar datos y revisar fuentes.</p>
      <div class="brm-controls">
        <div><label for="brm-search" class="brm-muted">Buscar en las noticias</label><input id="brm-search" type="search" placeholder="Título, medio o tema"></div>
        <div><label for="brm-taxonomy" class="brm-muted">Tema de Monitor</label><select id="brm-taxonomy"><option value="">Todos los temas</option></select></div>
      </div>
      <div class="brm-actions"><button id="brm-refresh" type="button">Actualizar noticias</button></div>
    </div>
    <div id="brm-results" aria-live="polite"></div>`;
  main.append(section);
  return section;
}

function install() {
  const main = document.querySelector('main');
  const header = document.querySelector('header .flex.items-center.justify-between');
  if (!main || !header || document.getElementById('brm-open')) return;
  addStyles();

  const openButton = document.createElement('button');
  openButton.id = 'brm-open';
  openButton.type = 'button';
  openButton.className = 'text-xs font-medium text-swiss-700 hover:text-black px-3 py-2 rounded-full border border-swiss-300 min-h-[44px]';
  openButton.textContent = 'Monitor';
  openButton.setAttribute('aria-controls', 'brm-panel');
  const newFichaButton = document.getElementById('btn-nueva');
  header.insertBefore(openButton, newFichaButton || null);

  const panel = makePanel();
  if (!panel) return;
  let previousVisibility = [];
  let news = [];

  const setStatus = (message) => { panel.querySelector('#brm-status').textContent = message; };
  const render = () => {
    const query = panel.querySelector('#brm-search').value.trim().toLocaleLowerCase('es-AR');
    const taxonomy = panel.querySelector('#brm-taxonomy').value;
    const shown = news.filter((item) => {
      const haystack = `${item.titulo || ''} ${item.copete || ''} ${item.fuente_nombre || ''} ${(item.etiquetas || []).join(' ')}`.toLocaleLowerCase('es-AR');
      return (!query || haystack.includes(query)) && (!taxonomy || item.taxonomia === taxonomy);
    });
    const results = panel.querySelector('#brm-results');
    if (!shown.length) {
      results.innerHTML = '<div class="brm-card brm-empty">No hay noticias para esos filtros.</div>';
      return;
    }
    results.innerHTML = shown.map((item) => {
      const href = safeURL(item.url);
      const title = item.titulo || 'Nota sin título';
      return `<article class="brm-card">
        <span class="brm-chip">${escapeHTML(item.taxonomia || 'Sin tema')}</span>
        <span class="brm-chip">${escapeHTML(item.fuente_nombre || 'Fuente no informada')}</span>
        <span class="brm-muted">${escapeHTML(formatDate(item.fecha))}</span>
        <h3 class="brm-title">${escapeHTML(title)}</h3>
        ${item.copete ? `<p style="font-size:.84rem;line-height:1.55;margin:.35rem 0">${escapeHTML(item.copete)}</p>` : ''}
        <div class="brm-actions">
          ${href ? `<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">Abrir fuente original</a>` : ''}
          <button class="brm-primary" type="button" data-prepare="${escapeHTML(item.id || '')}" ${!href ? 'disabled' : ''}>Preparar borrador de contexto</button>
        </div>
      </article>`;
    }).join('');
  };

  const loadNews = async () => {
    setStatus('Cargando noticias de Monitor…');
    panel.querySelector('#brm-results').innerHTML = '';
    try {
      const response = await fetch(`${MONITOR_DATA_URL}?_=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.notas)) throw new Error('El archivo de Monitor no tiene el formato esperado.');
      news = payload.notas.slice().sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
      const options = [...new Set(news.map((item) => item.taxonomia).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es-AR'));
      panel.querySelector('#brm-taxonomy').innerHTML = '<option value="">Todos los temas</option>' + options.map((value) => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join('');
      const timestamp = payload.actualizado_local || payload.actualizado_utc || payload.actualizado;
      setStatus(`${news.length} noticias · Monitor ${payload.version || 'V3.2'}${timestamp ? ` · Actualizado ${formatDate(timestamp)}` : ''}`);
      render();
    } catch (error) {
      setStatus(`No se pudieron cargar las noticias (${error.message}). Revisá la conexión y volvé a intentar.`);
      panel.querySelector('#brm-results').innerHTML = '<div class="brm-card brm-empty">La Biblioteca sigue disponible; Monitor no respondió.</div>';
    }
  };

  const openPanel = async () => {
    previousVisibility = [...main.children].filter((element) => element !== panel)
      .map((element) => [element, element.hidden, !element.hidden && !element.classList.contains('hidden')]);
    previousVisibility.forEach(([element]) => { element.hidden = true; });
    panel.hidden = false;
    panel.querySelector('#brm-search').focus();
    if (!news.length) await loadNews();
  };

  const closePanel = () => {
    panel.hidden = true;
    previousVisibility.forEach(([element, wasHidden]) => { element.hidden = wasHidden; });
    openButton.focus();
  };

  const fillDraft = async (item) => {
    const editorWasOpen = previousVisibility.some(([element, , wasVisible]) => element.id === 'view-editor' && wasVisible);
    if (editorWasOpen) {
      setStatus('Primero guardá o cerrá la ficha que estás editando; después podrás preparar otra desde Monitor.');
      return;
    }
    const authView = document.getElementById('view-auth');
    const createButton = document.getElementById('btn-nueva');
    if (!createButton || createButton.hidden || (authView && !authView.classList.contains('hidden'))) {
      closePanel();
      document.querySelector('#auth-email')?.focus();
      return;
    }
    const href = safeURL(item.url);
    if (!href) return;
    closePanel();
    createButton.click();
    const editor = document.getElementById('view-editor');
    const ready = editor && !editor.classList.contains('hidden') ? true : await new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (editor && !editor.classList.contains('hidden')) { observer.disconnect(); resolve(true); }
      });
      observer.observe(editor, { attributes: true, attributeFilter: ['class'] });
      setTimeout(() => { observer.disconnect(); resolve(false); }, 8000);
    });
    if (!ready) return;

    const references = [
      `Nota de actualidad: ${item.titulo || 'Sin título'}`,
      `Medio: ${item.fuente_nombre || 'No informado'}`,
      `Fecha de publicación: ${item.fecha || 'No informada'}`,
      `Tema Monitor: ${item.taxonomia || 'No informado'}`,
      `Enlace original: ${href}`,
      'Uso editorial: referencia para elaborar una ficha explicativa atemporal; contrastar los datos y sumar fuentes estables.'
    ].join('\n');
    const setField = (id, value, eventName = 'input') => {
      const field = document.getElementById(id);
      if (!field) return;
      field.value = value;
      field.dispatchEvent(new Event(eventName, { bubbles: true }));
    };
    setField('ed-titulo', `Contexto: ${item.titulo || 'Tema a desarrollar'}`);
    setField('ed-categoria', CATEGORIES[item.taxonomia] || 'Otra', 'change');
    setField('ed-fuentes', references);
    document.getElementById('ed-contenido')?.focus();
  };

  openButton.addEventListener('click', openPanel);
  panel.querySelector('#brm-back').addEventListener('click', closePanel);
  panel.querySelector('#brm-refresh').addEventListener('click', loadNews);
  panel.querySelector('#brm-search').addEventListener('input', render);
  panel.querySelector('#brm-taxonomy').addEventListener('change', render);
  panel.querySelector('#brm-results').addEventListener('click', (event) => {
    const button = event.target.closest('[data-prepare]');
    if (!button) return;
    const item = news.find((entry) => String(entry.id || '') === button.dataset.prepare);
    if (item) void fillDraft(item);
  });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
