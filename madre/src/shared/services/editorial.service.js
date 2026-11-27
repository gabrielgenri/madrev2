import { supabase } from '../../core/supabase/client.js'

function client() {
  if (!supabase) throw new Error('Supabase no está configurado. Revisá .env.local.')
  return supabase
}

async function currentUser() {
  const { data, error } = await client().auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('La sesión expiró. Volvé a ingresar.')
  return data.user
}


function qualityNumberMentions(text) {
  const matches = []
  const regex = /(\d[\d.,]*)(\s?(?:%|por ciento|pesos?|millones?|mil|km|kilómetros?|personas?|casos?|años?|días?|horas?|meses?|votos?|puntos?))/giu
  for (const match of text.matchAll(regex)) {
    const index = match.index ?? 0
    const before = text.slice(Math.max(0, index - 65), index)
    const after = text.slice(index + match[0].length, index + match[0].length + 65)
    const normalizeContext = (value) => value.toLocaleLowerCase('es-AR')
      .replace(/\d[\d.,]*/g, '#').replace(/[^\p{L}#%]+/gu, ' ').trim().split(/\s+/).slice(-5).join(' ')
    const key = normalizeContext(before) + ' # ' + match[2].trim().toLocaleLowerCase('es-AR') + ' ' + normalizeContext(after)
    matches.push({ key, value: match[1].replace(/\./g, '').replace(',', '.'), token: match[0].trim() })
  }
  return matches
}


function qualityDateMentions(text) {
  const matches = []
  const regex = /\b(\d{1,2}[/-]\d{1,2}[/-](?:19|20)\d{2}|\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(?:19|20)\d{2}|(?:19|20)\d{2})\b/giu
  for (const match of text.matchAll(regex)) {
    const index = match.index ?? 0
    const before = text.slice(Math.max(0, index - 65), index)
    const after = text.slice(index + match[0].length, index + match[0].length + 65)
    const normalizeContext = (value) => value.toLocaleLowerCase('es-AR')
      .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:19|20)\d{2}\b/g, '#')
      .replace(/[^\p{L}#]+/gu, ' ').trim().split(/\s+/).slice(-5).join(' ')
    const key = normalizeContext(before) + ' # ' + normalizeContext(after)
    matches.push({ key, value: match[1].toLocaleLowerCase('es-AR') })
  }
  return matches
}

function buildQualityReport({ unit, version, formats, research }) {
  const checklist = []
  const findings = []
  const add = (id, label, passed, detail) => checklist.push({ id, label, passed, detail })
  const finding = (severity, code, message, formatType = null) => findings.push({ severity, code, message, format_type: formatType })
  const words = (value) => (value.trim().match(/\S+/g) ?? []).length
  const sourceUrls = new Set(research.sources.map(item => (item.source_url ?? '').trim().replace(/\/$/, '').toLowerCase()).filter(Boolean))
  const latestVerification = new Map()
  for (const item of [...research.verifications].sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at))) {
    if (!latestVerification.has(item.claim_id)) latestVerification.set(item.claim_id, item.status)
  }

  const unsupportedClaims = research.claims.filter(claim => {
    const hasSourceEvidence = research.evidences.some(item => item.claim_id === claim.id && item.source_id && item.relation === 'supports')
    const status = latestVerification.get(claim.id) ?? claim.verification_status
    return !hasSourceEvidence || ['pending', 'unverified', 'contradictory', 'missing_source'].includes(status)
  })
  add('research-sources', 'Investigación con fuentes registradas', research.sources.length > 0, research.sources.length + ' fuentes registradas')
  if (!research.sources.length) finding('critical', 'no_sources', 'La unidad no tiene fuentes registradas.')
  add('claims-traceability', 'Afirmaciones registradas con respaldo', research.claims.length > 0 && unsupportedClaims.length === 0, research.claims.length ? unsupportedClaims.length + ' afirmaciones requieren atención de trazabilidad' : 'No hay afirmaciones registradas para verificar')
  if (!research.claims.length) finding('warning', 'no_claims', 'No hay afirmaciones desglosadas para controlar su trazabilidad.')
  for (const claim of unsupportedClaims) {
    const status = latestVerification.get(claim.id) ?? claim.verification_status
    const noEvidence = !research.evidences.some(item => item.claim_id === claim.id && item.source_id && item.relation === 'supports')
    finding(claim.importance === 'critical' ? 'critical' : 'warning', 'claim_traceability',
      'Afirmación: “' + claim.claim_text.slice(0, 180) + '”. ' +
      (noEvidence ? 'No tiene evidencia vinculada a una fuente que la respalde. ' : '') +
      'Estado de verificación: ' + status + '.')
  }
  add('research-evidence', 'Evidencias vinculadas a fuentes', research.evidences.some(item => item.source_id),
    research.evidences.length + ' evidencias; ' + research.evidences.filter(item => item.source_id).length + ' vinculadas a fuente')
  if (research.claims.length && !research.evidences.some(item => item.source_id)) {
    finding('warning', 'no_source_evidence', 'Hay afirmaciones registradas, pero ninguna evidencia está vinculada a una fuente.')
  }

  const expected = ['web_seo', 'video_reel_60', 'podcast_primera_hora', 'instagram_carousel_8', 'newsletter', 'whatsapp']
  const present = new Set(formats.map(item => item.format_type))
  add('six-formats', 'Seis formatos disponibles', expected.every(type => present.has(type)),
    expected.filter(type => present.has(type)).length + ' de 6 formatos creados')
  if (expected.some(type => !present.has(type))) {
    finding('warning', 'missing_formats', 'Faltan borradores: ' + expected.filter(type => !present.has(type)).join(', ') + '.')
  }

  for (const type of expected) {
    const format = formats.find(item => item.format_type === type)
    if (!format) continue
    const label = type.replaceAll('_', ' ')
    if (!format.title?.trim() || !format.content?.trim()) {
      finding('warning', 'incomplete_format', 'El formato ' + label + ' necesita título y contenido.', type)
      continue
    }
    if (format.is_stale || format.source_version_id !== version.id) {
      finding('critical', 'stale_format', 'El formato ' + label + ' está vinculado a una versión madre anterior o figura desactualizado.', type)
    }
    const count = words(format.content)
    if (type === 'video_reel_60' && (count < 75 || count > 170)) {
      finding('warning', 'reel_length', 'El guion Reel tiene ' + count + ' palabras; revisá si cabe en 60 segundos.', type)
    }
    if (type === 'whatsapp' && format.content.length > 1800) {
      finding('warning', 'whatsapp_length', 'El mensaje de WhatsApp tiene ' + format.content.length + ' caracteres; revisá su extensión.', type)
    }
    if (type === 'newsletter' && !/(asunto|subject)\s*:/i.test(format.content)) {
      finding('note', 'newsletter_subject', 'No se detectó una línea explícita de asunto en el newsletter.', type)
    }
    if (type === 'instagram_carousel_8') {
      const slideLines = [...format.content.matchAll(/^\s*(?:(?:placa|slide)\s*)?([1-8])[).:\-]\s+\S/gim)]
      const uniqueSlides = new Set(slideLines.map(match => match[1]))
      if (uniqueSlides.size !== 8) {
        finding('warning', 'carousel_slides', 'Se detectaron ' + uniqueSlides.size + ' placas numeradas; el formato requiere exactamente ocho.', type)
      }
    }
    const urls = [...format.content.matchAll(/https?:\/\/[^\s)\]}>,]+/gi)]
      .map(match => match[0].replace(/[.,;:!?]+$/, '').replace(/\/$/, '').toLowerCase())
    const unregistered = [...new Set(urls.filter(url => !sourceUrls.has(url)))]
    if (unregistered.length) {
      finding('warning', 'unregistered_links', 'Hay ' + unregistered.length + ' enlace(s) en el texto que no coinciden con URLs registradas en fuentes. Comprobá y registrá su procedencia.', type)
    }
  }

  const readyFormats = formats.filter(item => item.content?.trim() && item.title?.trim())
  add('source-version', 'Formatos vinculados a la versión madre vigente',
    readyFormats.every(item => !item.is_stale && item.source_version_id === version.id),
    readyFormats.filter(item => !item.is_stale && item.source_version_id === version.id).length + ' de ' + readyFormats.length + ' borradores completos usan la versión actual')

  const numericMentions = new Map()
  for (const format of readyFormats) {
    for (const mention of qualityNumberMentions(format.content)) {
      const current = numericMentions.get(mention.key) ?? new Map()
      const formatsForValue = current.get(mention.value) ?? new Set()
      formatsForValue.add(format.format_type)
      current.set(mention.value, formatsForValue)
      numericMentions.set(mention.key, current)
    }
  }
  const divergent = [...numericMentions.entries()].filter(([, values]) => values.size > 1)
  add('cross-format-figures', 'Cifras repetidas con contexto comparable', divergent.length === 0,
    divergent.length ? divergent.length + ' posible(s) divergencia(s) detectada(s)' : 'No se detectaron divergencias literales con contexto comparable')
  for (const [, values] of divergent) {
    const detail = [...values.entries()].map(([value, types]) => value + ' en ' + [...types].join(', ')).join(' / ')
    finding('warning', 'cross_format_number_mismatch', 'Posible diferencia cuantitativa en pasajes de contexto similar: ' + detail + '. Confirmá si se trata del mismo indicador.')
  }

  const dateMentions = new Map()
  for (const format of readyFormats) {
    for (const mention of qualityDateMentions(format.content)) {
      const current = dateMentions.get(mention.key) ?? new Map()
      const formatsForValue = current.get(mention.value) ?? new Set()
      formatsForValue.add(format.format_type)
      current.set(mention.value, formatsForValue)
      dateMentions.set(mention.key, current)
    }
  }
  const dateDivergences = [...dateMentions.entries()].filter(([, values]) => values.size > 1)
  add('cross-format-dates', 'Fechas repetidas con contexto comparable', dateDivergences.length === 0,
    dateDivergences.length ? dateDivergences.length + ' posible(s) divergencia(s) de fecha' : 'No se detectaron divergencias literales de fecha con contexto comparable')
  for (const [, values] of dateDivergences) {
    const detail = [...values.entries()].map(([value, types]) => value + ' en ' + [...types].join(', ')).join(' / ')
    finding('warning', 'cross_format_date_mismatch', 'Posible diferencia de fecha en pasajes de contexto similar: ' + detail + '. Confirmá si se refiere al mismo acontecimiento.')
  }

  if (readyFormats.length > 1) {
    add('cross-format-human-check', 'Comparación semántica entre formatos', false,
      'La coincidencia literal no demuestra consistencia; requiere lectura editorial comparada.')
    finding('note', 'human_cross_format_review',
      'La revisión automática compara estructura, versión y algunas cifras con contexto similar. No interpreta equivalencia semántica: comparar manualmente fechas, nombres, atribuciones y matices entre formatos.')
  } else {
    add('cross-format-human-check', 'Comparación semántica entre formatos', false,
      'Se necesitan al menos dos borradores completos para una comparación.')
  }

  if (!unit.content_mother?.trim()) finding('critical', 'empty_mother', 'La unidad no tiene contenido madre.')
  const needsAttention = findings.some(item => item.severity === 'critical' || item.severity === 'warning')
  return {
    scope: 'cross_format',
    status: needsAttention ? 'needs_attention' : 'checks_complete',
    checklist,
    findings,
    metrics: {
      format_count: formats.length,
      complete_format_count: readyFormats.length,
      source_count: research.sources.length,
      claim_count: research.claims.length,
      unsupported_claim_count: unsupportedClaims.length,
      evidence_count: research.evidences.length,
      version_number: version.version_number
    }
  }
}

export const EditorialService = {
  async list() {
    const { data, error } = await client().from('editorial_units')
      .select('id,title,summary,status,created_at,updated_at,created_by,assigned_to,priority,due_at')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async create({ title, summary = '' }) {
    const user = await currentUser()
    const { data, error } = await client().from('editorial_units')
      .insert({ title: title.trim(), summary: summary.trim(), created_by: user.id, status: 'draft' })
      .select().single()
    if (error) throw error
    return data
  },

  async update(id, changes, changeNote) {
    const allowed = {}
    for (const key of ['title', 'summary', 'content_mother']) {
      if (key in changes) allowed[key] = changes[key]
    }
    const { data, error } = await client().rpc('update_editorial_unit_with_version', {
      p_unit_id: id,
      p_changes: allowed,
      p_change_note: changeNote
    })
    if (error) throw error
    return data
  },

  async versions(unitId) {
    const { data, error } = await client().from('editorial_versions')
      .select('id,version_number,snapshot,change_note,created_by,created_at')
      .eq('editorial_unit_id', unitId)
      .order('version_number', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async formats(unitId) {
    const { data, error } = await client().from('editorial_formats')
      .select('id,format_type,title,content,status,source_version_id,is_stale,updated_at')
      .eq('editorial_unit_id', unitId)
      .order('format_type')
    if (error) throw error
    return data ?? []
  },

  async latestVersionId(unitId) {
    const { data, error } = await client().from('editorial_versions')
      .select('id,version_number')
      .eq('editorial_unit_id', unitId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()
    if (error) throw error
    return data
  },

  async generateFormat(unitId, formatType) {
    const { data, error } = await client().functions.invoke('generate-editorial-format', {
      body: { unit_id: unitId, format_type: formatType }
    })
    if (error) {
      let detail = ''
      try {
        const response = error.context?.clone ? error.context.clone() : error.context
        const payload = response?.json ? await response.json() : null
        detail = payload?.error ?? ''
      } catch {
        // El SDK puede devolver un error sin cuerpo JSON legible.
      }
      throw new Error(detail || error.message || 'No se pudo generar el borrador.')
    }
    return data
  },

  async saveFormat(unitId, values) {
    const { data, error } = await client().rpc('save_editorial_format', {
      p_unit_id: unitId,
      p_format_type: values.format_type,
      p_title: values.title,
      p_content: values.content
    })
    if (error) throw error
    return data
  },


  async runQualityCheck(unitId) {
    const user = await currentUser()
    const [unit, version, formats, research] = await Promise.all([
      EditorialService.get(unitId),
      EditorialService.latestVersionId(unitId),
      EditorialService.formats(unitId),
      EditorialService.researchBundle(unitId)
    ])
    const report = buildQualityReport({ unit, version, formats, research })
    const { data, error } = await client().from('editorial_quality_reviews').insert({
      editorial_unit_id: unitId,
      source_version_id: version.id,
      scope: report.scope,
      status: report.status,
      checklist: report.checklist,
      findings: report.findings,
      metrics: report.metrics,
      created_by: user.id
    }).select().single()
    if (error) throw error
    return data
  },

  async qualityHistory(unitId) {
    const { data: reviews, error } = await client().from('editorial_quality_reviews')
      .select('id,source_version_id,scope,status,checklist,findings,metrics,created_at,created_by')
      .eq('editorial_unit_id', unitId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) throw error
    const ids = (reviews ?? []).map(item => item.id)
    if (!ids.length) return []
    const { data: observations, error: observationError } = await client().from('editorial_quality_observations')
      .select('id,review_id,severity,note,created_at,created_by')
      .in('review_id', ids)
      .order('created_at', { ascending: false })
    if (observationError) throw observationError
    return (reviews ?? []).map(item => ({
      ...item,
      observations: (observations ?? []).filter(note => note.review_id === item.id)
    }))
  },

  async addQualityObservation(reviewId, values) {
    const user = await currentUser()
    const { data, error } = await client().from('editorial_quality_observations').insert({
      review_id: reviewId,
      severity: values.severity,
      note: values.note.trim(),
      created_by: user.id
    }).select().single()
    if (error) throw error
    return data
  },

  async myRoles() {
    const user = await currentUser()
    const { data, error } = await client().from('user_roles').select('role').eq('user_id', user.id)
    if (error) throw error
    return (data ?? []).map(item => item.role)
  },

  async workQueue(roles = []) {
    const db = client()
    const { data: units, error } = await db.from('editorial_units').select('id,title,summary,status,created_at,updated_at,created_by,assigned_to,priority,due_at').order('updated_at', { ascending: false })
    if (error) throw error
    const ids = (units ?? []).map(item => item.id)
    if (!ids.length) return { items: [], assignees: [] }
    const [reviewResult, workResult, versionResult] = await Promise.all([
      db.from('editorial_review_events').select('id,editorial_unit_id,event_type,source_version_id,note,created_at,created_by').in('editorial_unit_id', ids).order('created_at', { ascending: false }),
      db.from('editorial_work_events').select('id,editorial_unit_id,from_assigned_to,to_assigned_to,from_priority,to_priority,from_due_at,to_due_at,note,created_at,created_by').in('editorial_unit_id', ids).order('created_at', { ascending: false }),
      db.from('editorial_versions').select('id,editorial_unit_id,version_number').in('editorial_unit_id', ids).order('version_number', { ascending: false })
    ])
    if (reviewResult.error) throw reviewResult.error
    if (workResult.error) throw workResult.error
    if (versionResult.error) throw versionResult.error
    const latestReview = new Map()
    for (const event of reviewResult.data ?? []) if (!latestReview.has(event.editorial_unit_id)) latestReview.set(event.editorial_unit_id, event)
    const latestWork = new Map()
    for (const event of workResult.data ?? []) if (!latestWork.has(event.editorial_unit_id)) latestWork.set(event.editorial_unit_id, event)
    const latestVersion = new Map()
    for (const version of versionResult.data ?? []) if (!latestVersion.has(version.editorial_unit_id)) latestVersion.set(version.editorial_unit_id, version.id)
    let assignees = []
    if (roles.includes('editor') || roles.includes('admin')) {
      const [profiles, roleRows] = await Promise.all([db.from('profiles').select('id,display_name').order('display_name'), db.from('user_roles').select('user_id,role')])
      if (profiles.error) throw profiles.error
      if (roleRows.error) throw roleRows.error
      const eligible = new Set((roleRows.data ?? []).filter(row => ['collaborator','writer','reviewer','editor','admin'].includes(row.role)).map(row => row.user_id))
      assignees = (profiles.data ?? []).filter(profile => eligible.has(profile.id))
    }
    return { items: (units ?? []).map(unit => { const review = latestReview.get(unit.id) ?? null; return { ...unit, latest_review: review, latest_review_current: Boolean(review && review.source_version_id === latestVersion.get(unit.id)), latest_work_event: latestWork.get(unit.id) ?? null } }), assignees }
  },

  async assignWork(unitId, values) {
    const { data, error } = await client().rpc('assign_editorial_work', { p_unit_id: unitId, p_assigned_to: values.assigned_to || null, p_priority: values.priority, p_due_at: values.due_at || null, p_note: values.note.trim() })
    if (error) throw error
    return data
  },

  async workHistory(unitId) {
    const { data, error } = await client().from('editorial_work_events').select('id,from_assigned_to,to_assigned_to,from_priority,to_priority,from_due_at,to_due_at,note,created_at,created_by').eq('editorial_unit_id', unitId).order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },
  async reviewHistory(unitId) {
    const { data, error } = await client().from('editorial_review_events')
      .select('id,event_type,note,source_version_id,quality_review_id,created_by,created_at')
      .eq('editorial_unit_id', unitId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async recordReviewEvent(unitId, eventType, note) {
    const { data, error } = await client().rpc('record_editorial_review_event', {
      p_unit_id: unitId,
      p_event_type: eventType,
      p_note: note
    })
    if (error) throw error
    return data
  },

  async get(id) {
    const { data, error } = await client().from('editorial_units').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async researchBundle(unitId) {
    const db = client()
    const [sources, claims] = await Promise.all([
      db.from('sources').select('*').eq('editorial_unit_id', unitId).order('created_at', { ascending: false }),
      db.from('claims').select('*').eq('editorial_unit_id', unitId).order('created_at', { ascending: false })
    ])
    if (sources.error) throw sources.error
    if (claims.error) throw claims.error
    const claimIds = (claims.data ?? []).map(item => item.id)
    let evidences = []
    let verifications = []
    if (claimIds.length) {
      const [evidenceResult, verificationResult] = await Promise.all([
        db.from('evidences').select('*').eq('editorial_unit_id', unitId).order('created_at', { ascending: false }),
        db.from('verifications').select('*').in('claim_id', claimIds).order('checked_at', { ascending: false })
      ])
      if (evidenceResult.error) throw evidenceResult.error
      if (verificationResult.error) throw verificationResult.error
      evidences = evidenceResult.data ?? []
      verifications = verificationResult.data ?? []
    } else {
      const { data, error } = await db.from('evidences').select('*').eq('editorial_unit_id', unitId).order('created_at', { ascending: false })
      if (error) throw error
      evidences = data ?? []
    }
    return { sources: sources.data ?? [], claims: claims.data ?? [], evidences, verifications }
  },

  async addSource(unitId, values) {
    const user = await currentUser()
    const { data, error } = await client().from('sources').insert({
      editorial_unit_id: unitId, title: values.title.trim(), source_type: values.source_type || 'other',
      source_url: values.source_url.trim() || null, publisher: values.publisher.trim() || null,
      author: values.author.trim() || null, original_text: values.original_text.trim() || null,
      notes: values.notes.trim() || null, created_by: user.id
    }).select().single()
    if (error) throw error
    return data
  },

  async addClaim(unitId, values) {
    const user = await currentUser()
    const { data, error } = await client().from('claims').insert({
      editorial_unit_id: unitId, claim_text: values.claim_text.trim(),
      claim_type: values.claim_type, importance: values.importance, context_note: values.context_note.trim() || null,
      created_by: user.id
    }).select().single()
    if (error) throw error
    return data
  },

  async addEvidence(unitId, values) {
    const user = await currentUser()
    const { data, error } = await client().from('evidences').insert({
      editorial_unit_id: unitId, claim_id: values.claim_id || null, source_id: values.source_id || null,
      evidence_text: values.evidence_text.trim(), locator: values.locator.trim() || null,
      relation: values.relation, created_by: user.id
    }).select().single()
    if (error) throw error
    return data
  },

  async addVerification(claimId, values) {
    const user = await currentUser()
    const { data, error } = await client().from('verifications').insert({
      claim_id: claimId, status: values.status, rationale: values.rationale.trim() || null, checked_by: user.id
    }).select().single()
    if (error) throw error
    return data
  }
}
