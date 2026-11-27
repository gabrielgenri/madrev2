/**
 * Reglas editoriales operativas de Madre.
 * Síntesis de trabajo basada en la Guía de Estilo Editorial de referencia.
 * La guía institucional completa debe validarse y versionarse antes de adoptarse.
 */
export const EDITORIAL_GUIDELINES = Object.freeze({
  principles: [
    'Rigor y veracidad: los datos deben ser comprobables y las fuentes identificables.',
    'Identidad riojana: priorizar el contexto provincial, sus departamentos y comunidades cuando sea pertinente.',
    'Independencia de criterio frente a gobiernos, empresas, anunciantes y actores de poder.',
    'Pluralidad de voces y relevancia social, incluyendo sectores con menor acceso a la representación.',
    'Memoria y contexto: relacionar la actualidad con antecedentes documentales, históricos, sociales y económicos.'
  ],
  distinctions: [
    'Hechos comprobados',
    'Declaraciones atribuidas',
    'Estimaciones y proyecciones',
    'Interpretaciones y análisis',
    'Denuncias no acreditadas',
    'Información desconocida o pendiente de confirmación'
  ],
  checks: [
    'El titular comunica el hecho central y no promete más de lo que la evidencia demuestra.',
    'La entrada identifica qué ocurrió, quién intervino, dónde y cuándo, según la información disponible.',
    'Las afirmaciones relevantes tienen fuentes identificables y atribución correcta.',
    'Las cifras conservan período, unidad, alcance y metodología cuando corresponda.',
    'Las dudas, contradicciones y vacíos no se convierten en certezas.',
    'El lenguaje evita estigmatizar o reducir a las personas a una condición.',
    'La publicación tiene responsable editorial y autorización humana registrada.'
  ]
})

export function buildEditorialInstructions({ format = 'general' } = {}) {
  return [
    `Aplicá estas reglas editoriales al formato ${format}:`,
    ...EDITORIAL_GUIDELINES.principles.map((item) => `- ${item}`),
    'Distinguir siempre hechos comprobados, declaraciones, estimaciones, interpretaciones y datos pendientes.',
    'No inventar datos, citas, fuentes, antecedentes ni enlaces.',
    'No ocultar contradicciones ni completar vacíos mediante suposiciones.',
    'Si una afirmación no tiene respaldo suficiente, marcarla como pendiente de verificación.',
    'La IA asiste; la responsabilidad editorial y la autorización de publicación corresponden a personas.'
  ].join('\n')
}
