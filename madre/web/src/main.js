import "./styles.css";
import { createClient } from "@supabase/supabase-js";

const state = {
  section: "inicio",
  topic: "",
  source: "",
  formats: {},
  activeFormat: "web_seo",
  history: JSON.parse(localStorage.getItem("madre:web:history") || "[]"),
  status: "Listo",
  supabase: null
};

const FORMAT_META = {
  web_seo: { label: "Artículo Web / SEO", icon: "WEB" },
  video_reel_60: { label: "Reel · 60 s", icon: "REEL" },
  podcast_primera_hora: { label: "Podcast · Primera Hora", icon: "POD" },
  instagram_carousel_8: { label: "Carrusel · 8 placas", icon: "CAR" },
  newsletter: { label: "Newsletter", icon: "NEWS" },
  whatsapp: { label: "WhatsApp", icon: "WA" }
};

const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
const slugify = (v="") => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
const saveHistory = () => localStorage.setItem("madre:web:history", JSON.stringify(state.history.slice(0,30)));
const notify = msg => { state.status = msg; render(); };

function initSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (url && key) state.supabase = createClient(url, key);
}

function generateLocalFormats(topic, source) {
  const clean = topic.trim() || "Tema editorial pendiente";
  const evidence = source.trim() || "Fuente pendiente de incorporación.";
  const common = `Tema: ${clean}\n\nBase disponible:\n${evidence}\n\nEstado editorial: BORRADOR\n\nNota: este borrador debe contrastarse con fuentes y evidencias antes de considerarse revisado.`;
  const reel = [
    "0–5 s · APERTURA", `¿Qué está pasando con ${clean}?`,
    "5–15 s · HECHO CENTRAL", "Presentar el hecho principal únicamente con la información disponible y atribuir la fuente.",
    "15–35 s · EXPLICACIÓN", "Explicar qué se conoce, qué falta comprobar y por qué importa.",
    "35–50 s · CONTEXTO", "Incorporar antecedentes, cifras o actores solo cuando estén respaldados.",
    "50–60 s · CIERRE", "Cerrar con la información útil y recordar que el contenido está sujeto a verificación editorial."
  ].join("\n\n");
  const carousel = [
    ["1","PORTADA",clean],["2","HECHO CENTRAL","Qué sabemos hasta ahora."],["3","ACTORES","Quiénes intervienen y cómo están vinculados."],
    ["4","DATO RELEVANTE","Dato respaldado por una fuente identificable."],["5","CONTEXTO","Antecedentes necesarios para comprender el tema."],
    ["6","EXPLICACIÓN","Qué significa la información disponible."],["7","QUÉ FALTA","Preguntas, contradicciones o puntos pendientes."],["8","CIERRE","Información útil para seguir la historia."]
  ].map(([n,t,b]) => `PLACA ${n}\n${t}\n${b}`).join("\n\n");
  return {
    web_seo: `TÍTULO\n${clean}\n\nBAJADA\nInformación central pendiente de verificación editorial.\n\nINTRODUCCIÓN\n${common}\n\nDESARROLLO\nOrganizar aquí hechos, declaraciones atribuidas, contexto y antecedentes. No agregar datos no respaldados.\n\nFUENTES\n${evidence}\n\nSLUG\n${slugify(clean)}\n\nMETA DESCRIPCIÓN\nSíntesis informativa de ${clean}.\n\nETIQUETAS\n${clean.split(/\s+/).slice(0,6).join(", ")}`,
    video_reel_60: reel,
    podcast_primera_hora: `PRESENTACIÓN\nBienvenidos a Primera Hora.\n\nTEMA\n${clean}\n\nDESARROLLO\n${common}\n\nCONTEXTO\nExplicar antecedentes y actores con atribución precisa.\n\nCIERRE\nSeparar hechos comprobados de lo que todavía requiere verificación.\n\nFUENTE BASE\n${evidence}`,
    instagram_carousel_8: carousel,
    newsletter: `ASUNTO\n${clean}\n\nPREENCABEZADO\nLas claves de una historia que requiere seguimiento.\n\nSÍNTESIS\n${common}\n\nDATOS RELEVANTES\nAñadir únicamente datos respaldados.\n\nCIERRE\nSeguir la evolución de la historia y consultar la publicación completa cuando esté disponible.`,
    whatsapp: `${clean}\n\n${common}\n\nFuente: ${evidence}`
  };
}

function shell() {
  return `
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">M</span><div><strong>MADRE</strong><small>Ecosistema editorial</small></div></div>
      <nav aria-label="Navegación principal">
        ${["inicio","editorial","investigacion","formatos","biblioteca","editor-critico","distribucion"].map(s => `
          <button class="nav-item ${state.section===s?"active":""}" data-section="${s}">
            <span>${({inicio:"01",editorial:"02",investigacion:"03",formatos:"04",biblioteca:"05","editor-critico":"06",distribucion:"07"})[s]}</span>
            ${({inicio:"Inicio",editorial:"Madre Editorial",investigacion:"Investigación",formatos:"Seis formatos",biblioteca:"Biblioteca Riojana","editor-critico":"Editor Crítico",distribucion:"Distribución"})[s]}
          </button>`).join("")}
      </nav>
      <div class="sidebar-foot">Control humano · trazabilidad · verificación</div>
    </aside>
    <main class="main">
      <header class="topbar"><div><span class="eyebrow">MADRE / ${state.section.toUpperCase()}</span><h1>${titleFor(state.section)}</h1></div><div class="status"><i></i>${esc(state.status)}</div></header>
      <section class="content">${sectionFor(state.section)}</section>
    </main>
  </div>`;
}
function titleFor(s){ return ({inicio:"Centro editorial",editorial:"Unidad Editorial Madre",investigacion:"Investigación y verificación",formatos:"Atomización multiplataforma",biblioteca:"Biblioteca Riojana","editor-critico":"Editor Crítico",distribucion:"Distribución segura"})[s] || "Madre"; }

function sectionFor(s){
  if(s==="inicio") return `
    <div class="hero"><div><span class="kicker">DESDE CERO · VERSIÓN WEB</span><h2>Una información.<br><em>Una base editorial.</em><br>Seis formas de comunicar.</h2><p>Madre organiza la investigación, conserva la trazabilidad y transforma una Unidad Editorial en seis formatos sin perder hechos, fuentes ni advertencias.</p><button class="button primary" data-action="start">Crear producción</button></div><div class="hero-note"><div class="big">06</div><p>formatos editoriales conectados a una misma versión madre.</p></div></div>
    <div class="grid-3"><div class="metric"><b>01</b><span>Investigación</span><small>Fuentes · afirmaciones · evidencias</small></div><div class="metric"><b>02</b><span>Control</span><small>Checklist · observaciones · revisión humana</small></div><div class="metric"><b>03</b><span>Memoria</span><small>Versiones · historial · Biblioteca</small></div></div>`;
  if(s==="editorial") return editorialSection();
  if(s==="investigacion") return researchSection();
  if(s==="formatos") return formatsSection();
  if(s==="biblioteca") return librarySection();
  if(s==="editor-critico") return criticalSection();
  return distributionSection();
}

function editorialSection(){
 return `<div class="workspace">
  <div class="panel"><div class="panel-head"><span class="kicker">01 · INGESTA</span><span class="badge draft">BORRADOR</span></div>
    <label for="topic">Hecho, titular o tema</label><textarea id="topic" rows="4" placeholder="Ingresá el hecho o tema a investigar...">${esc(state.topic)}</textarea>
    <label for="source">Fuente / material disponible</label><textarea id="source" rows="6" placeholder="Pegá comunicado, datos, transcripción, URL o notas...">${esc(state.source)}</textarea>
    <div class="actions"><button class="button primary" data-action="generate">Generar seis borradores</button><button class="button" data-action="clear">Limpiar</button></div>
  </div>
  <div class="panel"><div class="panel-head"><span class="kicker">02 · PRINCIPIOS</span></div><ul class="rules"><li>La IA asiste; la decisión editorial es humana.</li><li>No inventar datos, citas, fuentes ni documentos.</li><li>Una marca [VERIFICAR] bloquea el paso a Revisado.</li><li>Las regeneraciones no deben destruir ediciones humanas.</li><li>Las claves de proveedores permanecen fuera del frontend.</li></ul></div>
 </div>
 <div class="section-title"><span>03 · ESTADO</span><h3>Salida editorial</h3></div>
 <div class="format-strip">${Object.entries(FORMAT_META).map(([k,v])=>`<button class="format-tab ${state.activeFormat===k?"active":""}" data-format="${k}">${v.icon}<span>${v.label}</span></button>`).join("")}</div>
 <div class="editor-output"><textarea id="format-editor" aria-label="Editor del formato seleccionado">${esc(state.formats[state.activeFormat]||"Generá una producción para comenzar.")}</textarea><div class="actions"><button class="button" data-action="copy">Copiar</button><button class="button" data-action="download">Descargar TXT</button><button class="button" data-action="save">Guardar en historial</button></div></div>`;
}

function researchSection(){return `<div class="section-title"><span>01 · FLUJO</span><h3>De la fuente a la afirmación</h3></div><div class="flow">${["Fuentes","Afirmaciones","Evidencias","Verificación","Revisión humana"].map((x,i)=>`<div><b>0${i+1}</b><span>${x}</span><small>${["Origen y referencia","Qué se afirma","Qué lo respalda","Estado comprobado","Decisión responsable"][i]}</small></div>`).join("")}</div><div class="notice"><b>Regla editorial.</b> Una fuente recuperada no equivale automáticamente a una fuente verificada. El sistema debe conservar contradicciones, dudas y preguntas pendientes.</div>`; }
function formatsSection(){return `<div class="section-title"><span>01 · MOTOR MADRE</span><h3>Exactamente seis formatos</h3></div><div class="cards">${Object.entries(FORMAT_META).map(([k,v])=>`<article class="format-card"><span class="mono">${v.icon}</span><h3>${v.label}</h3><p>${k==="web_seo"?"Artículo desarrollado, SEO y trazabilidad.":k==="video_reel_60"?"Guion temporalizado para 60 segundos.":k==="podcast_primera_hora"?"Guion apto para síntesis de voz.":k==="instagram_carousel_8"?"Ocho diapositivas editables.":k==="newsletter"?"Asunto, preencabezado y síntesis.":"Difusión breve sin clickbait."}</p><button class="text-button" data-section="editorial">Abrir editor →</button></article>`).join("")}</div>`; }
function librarySection(){return `<div class="empty"><span class="big">◎</span><h3>Biblioteca Riojana</h3><p>La interfaz queda preparada para conectar documentos, antecedentes y memoria semántica mediante el backend existente. No se crean datos simulados.</p><button class="button" data-section="editorial">Volver a Madre Editorial</button></div>`; }
function criticalSection(){return `<div class="section-title"><span>01 · SEGUNDA INSTANCIA</span><h3>Editor Crítico</h3></div><div class="check-grid">${["Sesgos potenciales","Afirmaciones sin respaldo","Problemas de atribución","Riesgos legales potenciales","Fechas o nombres dudosos","Contradicciones entre fuentes","Diferencias entre formatos","Información pendiente"].map(x=>`<div class="check"><span>—</span><b>${x}</b><small>Detectar · señalar · dejar decisión humana</small></div>`).join("")}</div><div class="notice"><b>Importante.</b> El Editor Crítico no modifica silenciosamente, no aprueba y no publica. Produce observaciones que el equipo puede resolver, aceptar o descartar dejando registro.</div>`; }
function distributionSection(){return `<div class="empty"><span class="big">→</span><h3>Distribución segura</h3><p>La salida hacia WordPress y otros canales debe pasar por backend, rol autorizado, pieza revisada, ausencia de [VERIFICAR] y confirmación humana explícita.</p><div class="badge draft">WORDPRESS · SOLO BORRADOR</div></div>`; }

function render(){document.querySelector("#app").innerHTML=shell(); bind(); syncOutput();}
function syncOutput(){const el=document.querySelector("#format-editor"); if(el && document.activeElement!==el) el.value=state.formats[state.activeFormat]||"Generá una producción para comenzar.";}
function bind(){
 document.querySelectorAll("[data-section]").forEach(b=>b.onclick=()=>{state.section=b.dataset.section;render();});
 document.querySelectorAll("[data-format]").forEach(b=>b.onclick=()=>{state.activeFormat=b.dataset.format;render();});
 const topic=document.querySelector("#topic"); if(topic) topic.oninput=e=>state.topic=e.target.value;
 const source=document.querySelector("#source"); if(source) source.oninput=e=>state.source=e.target.value;
 const out=document.querySelector("#format-editor"); if(out) out.oninput=e=>state.formats[state.activeFormat]=e.target.value;
 document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>actions(b.dataset.action));
}
async function actions(a){
 if(a==="start"){state.section="editorial";render();return;}
 if(a==="clear"){state.topic="";state.source="";state.formats={};render();return;}
 if(a==="generate"){state.formats=generateLocalFormats(state.topic,state.source);state.activeFormat="web_seo";notify("Seis borradores generados · requieren verificación");return;}
 if(a==="copy"){await navigator.clipboard?.writeText(state.formats[state.activeFormat]||"");notify("Formato copiado al portapapeles");return;}
 if(a==="download"){const blob=new Blob([state.formats[state.activeFormat]||""],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${slugify(state.topic)||"madre"}-${state.activeFormat}.txt`;a.click();URL.revokeObjectURL(url);notify("TXT descargado");return;}
 if(a==="save"){state.history.unshift({id:crypto.randomUUID(),topic:state.topic,source:state.source,formats:{...state.formats},createdAt:new Date().toISOString()});saveHistory();notify("Producción guardada en historial local");return;}
}

initSupabase(); render();
