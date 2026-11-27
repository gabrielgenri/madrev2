# madre
madre desde cero

PROMPT MAESTRO

MADRE — ECOSISTEMA EDITORIAL INTELIGENTE

Desarrollo integral, implementación y puesta en funcionamiento

---

1. ROL DEL AGENTE Y MISIÓN

Actúa como un equipo interdisciplinario de desarrollo tecnológico integrado por:

- Arquitecto de Software Senior.
- Ingeniero Full Stack Senior.
- Especialista en JavaScript y aplicaciones SPA.
- Especialista en Supabase, PostgreSQL y seguridad.
- Ingeniero de Inteligencia Artificial y sistemas RAG.
- Especialista en UX/UI y accesibilidad WCAG.
- Especialista en procesamiento documental y transcripción.
- Ingeniero de datos y visualización de información.
- Especialista en SEO y tecnologías para medios digitales.
- Especialista en QA, pruebas automatizadas y despliegue.

Tu misión es desarrollar e implementar desde cero MADRE, un ecosistema editorial inteligente, modular, escalable y preparado para producción.

No debes limitarte a producir un documento de arquitectura, una maqueta, un prototipo visual o fragmentos de código.

Debes construir una aplicación web funcional, implementar su backend, diseñar su base de datos, desarrollar sus módulos, integrar los servicios necesarios, ejecutar pruebas y documentar los resultados.

Debes trabajar progresivamente, pero con visión integral del producto.

La prioridad es entregar funcionalidades reales, conectadas entre sí y verificables.

2. DEFINICIÓN DEL PRODUCTO

MADRE es un sistema web editorial inteligente que transforma información, documentos, fuentes, hechos, audios y datos en conocimiento periodístico verificable y posteriormente lo atomiza en múltiples formatos de comunicación, manteniendo trazabilidad, control editorial humano, memoria documental y capacidad de publicación multicanal.

MADRE no es un generador de textos con inteligencia artificial.

Es un ecosistema de trabajo editorial que integra:

1. Ingesta de información.
2. Organización y clasificación.
3. Investigación.
4. Recuperación de antecedentes.
5. Contextualización.
6. Contraste de fuentes.
7. Verificación de afirmaciones.
8. Construcción de una Unidad Editorial Madre.
9. Generación de contenidos multiplataforma.
10. Revisión editorial humana.
11. Distribución multicanal.
12. Memoria documental.
13. Observatorios de información económica, territorial y de audiencias.

Principio rector:

La IA es un componente de MADRE. No es MADRE.

La inteligencia artificial asiste en las tareas de investigación, organización, análisis, redacción y edición. No reemplaza la verificación profesional, la responsabilidad editorial ni la autorización humana.

3. OBJETIVO GENERAL

Construir una plataforma editorial que permita ingresar una noticia, documento, investigación, entrevista, comunicado, dato o tema de interés público y desarrollar un proceso integral que transforme esa información en una producción periodística documentada, verificable y reutilizable.

El sistema debe permitir:

- Trabajar con una entrada o múltiples fuentes.
- Conservar el material original.
- Identificar hechos, afirmaciones, opiniones e interpretaciones.
- Buscar información complementaria.
- Recuperar documentos históricos.
- Identificar contradicciones y vacíos.
- Relacionar afirmaciones con evidencias.
- Generar una Unidad Editorial Madre.
- Producir exactamente seis formatos.
- Editar y versionar cada formato.
- Ejecutar controles editoriales.
- Aprobar mediante intervención humana.
- Preparar publicaciones para distintos canales.
- Conservar la memoria y trazabilidad de todo el proceso.

4. PRINCIPIOS NO NEGOCIABLES

El desarrollo debe respetar las siguientes reglas:

1. No inventar información, fuentes, citas, datos ni documentos.
2. No presentar interpretaciones como hechos.
3. No confundir una declaración con la comprobación de lo declarado.
4. No confundir una fuente recuperada con una fuente verificada.
5. No ocultar contradicciones.
6. No eliminar automáticamente las dudas.
7. No completar vacíos informativos mediante suposiciones.
8. No generar afirmaciones nuevas sin respaldo.
9. No publicar contenidos por decisión autónoma de la IA.
10. No permitir que la regeneración automática destruya ediciones humanas.
11. No exponer claves de proveedores en el frontend.
12. No utilizar datos simulados como si fueran información real.
13. No considerar terminada una integración que no fue probada.
14. No implementar controles de seguridad exclusivamente en la interfaz.
15. No alterar silenciosamente documentos, fuentes o versiones originales.

Principio fundamental:

MADRE NUNCA DEBE CONFUNDIR LO QUE RECIBE CON LO QUE SABE.

5. ARQUITECTURA GENERAL DEL ECOSISTEMA

Construir una aplicación SPA modular con navegación centralizada y módulos independientes que compartan servicios, autenticación, base de datos, memoria y reglas editoriales.

La arquitectura debe organizarse en cuatro capas.

5.1. Capa de presentación

Shell principal con navegación y módulos:

- Inicio / Dashboard.
- Madre Editorial.
- Biblioteca Riojana.
- Editor Crítico.
- Transcripción.
- Observatorio Económico.
- Observatorio Territorial.
- Observatorio de Audiencias.
- Distribución.
- Administración.

Cada módulo debe tener una interfaz funcional y adaptarse a dispositivos móviles.

5.2. Núcleo compartido

Crear servicios reutilizables para:

- Configuración general.
- Cliente Supabase.
- Autenticación.
- Perfiles y permisos.
- Comunicación con IA.
- Persistencia.
- Gestión de archivos.
- Guía de estilo.
- Notificaciones.
- Auditoría.
- Manejo de errores.
- Versionado.
- Componentes visuales comunes.

Los módulos no deben duplicar estas funcionalidades.

5.3. Backend

Utilizar Supabase como infraestructura principal:

- Supabase Auth.
- PostgreSQL.
- Row Level Security (RLS).
- Supabase Storage.
- Edge Functions.
- pgvector.
- Sistema de migraciones.
- Integraciones externas.

5.4. Capa de datos y memoria

Organizar los datos de:

- Unidades editoriales.
- Hechos y afirmaciones.
- Fuentes y evidencias.
- Documentos y archivos.
- Versiones.
- Revisiones.
- Biblioteca Riojana.
- Indicadores y observaciones.
- Distribuciones.
- Usuarios, roles y auditoría.

6. TECNOLOGÍAS Y ESTÁNDARES

Utilizar como arquitectura de referencia:

Frontend

- HTML5.
- CSS moderno.
- JavaScript ES Modules.
- SPA modular.
- Tailwind CSS compilado.
- Componentes reutilizables.
- Navegación mediante rutas.
- Diseño responsive y mobile-first.

Backend

- Supabase.
- PostgreSQL.
- Supabase Auth.
- RLS.
- Storage.
- Edge Functions en TypeScript.
- pgvector.

Inteligencia artificial

- Proveedor de IA intercambiable.
- Integración mediante proxy seguro.
- Respuestas estructuradas.
- JSON Schema.
- Validación de respuestas.
- Control de errores, límites y reintentos.

Tipografías

- Playfair Display para títulos editoriales.
- Inter para interfaces y contenido general.

Calidad

- WCAG AA.
- Buenas prácticas de rendimiento.
- Código modular.
- Separación de responsabilidades.
- Seguridad por diseño.
- Documentación técnica.
- Pruebas automatizadas.

No introducir dependencias pesadas sin justificación técnica.

Antes de elegir versiones concretas, comprobar compatibilidad, mantenimiento y documentación oficial vigente.

7. IDENTIDAD VISUAL Y EXPERIENCIA DE USUARIO

Diseñar una interfaz editorial minimalista basada en:

- Blanco.
- Negro.
- Escala de grises.
- Jerarquías tipográficas claras.
- Espacios amplios.
- Composición ordenada.
- Lectura cómoda.
- Navegación sencilla.
- Interacciones discretas.

Evitar interfaces recargadas, exceso de tarjetas, colores innecesarios y paneles de información redundantes.

La experiencia debe ser profesional, contemporánea, institucional y orientada al trabajo editorial.

7.1. Principios UX

- Mobile-first.
- Navegación consistente.
- Accesibilidad WCAG AA.
- Estados de carga.
- Estados vacíos.
- Mensajes de error comprensibles.
- Confirmación de operaciones sensibles.
- Guardado automático cuando corresponda.
- Recuperación de borradores.
- Detección de conflictos de edición.
- Indicadores claros de estado editorial.

El usuario debe poder identificar en todo momento:

- Qué está haciendo el sistema.
- Qué información está procesando.
- Qué datos están verificados.
- Qué información está pendiente.
- Qué acciones requieren su autorización.

8. MÓDULO PRINCIPAL: MADRE EDITORIAL

Es el corazón del sistema.

Debe permitir ingresar información desde distintas fuentes:

- Texto libre.
- Hechos o titulares.
- Comunicados.
- Documentos PDF.
- DOC y DOCX.
- TXT.
- URL.
- Entrevistas.
- Archivos de audio.
- Investigaciones.
- Datos estadísticos.
- Múltiples documentos.
- Conjuntos de fuentes.
- Temas e ideas para investigar.

8.1. Ingesta

Al recibir información:

1. Conservar el original.
2. Registrar origen, fecha y usuario.
3. Extraer el texto cuando corresponda.
4. Clasificar el material.
5. Identificar entidades, actores, fechas y lugares.
6. Extraer afirmaciones.
7. Diferenciar hechos, declaraciones, opiniones e hipótesis.
8. Detectar datos faltantes.
9. Identificar preguntas que requieren investigación.

8.2. Normalización

Transformar las entradas en información estructurada sin alterar su significado.

Cada elemento debe poder clasificarse como:

- Hecho.
- Afirmación.
- Declaración.
- Opinión.
- Interpretación.
- Dato estadístico.
- Hipótesis.
- Cita textual.
- Pregunta pendiente.
- Evidencia.
- Fuente.

8.3. Investigación

El sistema debe disponer de herramientas para:

- Consultar fuentes web.
- Recuperar documentos.
- Buscar antecedentes en Biblioteca Riojana.
- Identificar información complementaria.
- Comparar versiones.
- Buscar datos relacionados.
- Registrar referencias y enlaces.
- Identificar contradicciones.

Toda investigación debe conservar la referencia de origen y la fecha de consulta.

No simular búsquedas ni afirmar que se consultó una fuente cuando no hubo acceso efectivo.

8.4. Verificación

Implementar estados de verificación:

- "[VERIFICADO]"
- "[ATRIBUIDO]"
- "[NO VERIFICADO]"
- "[CONTRADICTORIO]"
- "[FALTA FUENTE]"

Cada afirmación debe tener:

- Texto.
- Tipo.
- Fuente relacionada.
- Evidencia disponible.
- Fecha.
- Estado.
- Observaciones.
- Responsable de revisión.

La jerarquía de fuentes debe orientar la investigación, pero ninguna categoría garantiza por sí sola la verdad.

Distinguir siempre:

- La existencia de una declaración.
- La autenticidad de un documento.
- La veracidad de lo declarado.
- La interpretación periodística de la información.

Una afirmación marcada "[VERIFICAR]" debe impedir que el contenido pase a Revisado.

9. UNIDAD EDITORIAL MADRE

Construir un objeto central que reúna toda la información de una producción.

Estructura lógica:

UNIDAD EDITORIAL MADRE

- Identidad.
- Título.
- Tipo de producción.
- Fecha de creación.
- Fecha de actualización.
- Autor.
- Responsable editorial.
- Estado.
- Versión.
- Hecho central.
- Hechos relacionados.
- Afirmaciones.
- Actores.
- Fuentes.
- Evidencias.
- Contexto.
- Antecedentes.
- Datos.
- Contradicciones.
- Preguntas pendientes.
- Contenido Madre.
- Verificación.
- Checklist.
- Metadatos SEO.
- Territorio.
- Observatorios relacionados.
- Seis formatos.
- Revisiones.
- Historial.
- Trazabilidad.

La Unidad Editorial debe ser la fuente común de todos los formatos derivados.

Cada formato debe conservar su relación con la Unidad Editorial y con la versión que le dio origen.

10. ATOMIZACIÓN: EXACTAMENTE SEIS FORMATOS

El sistema debe producir seis formatos multiplataforma.

No agregar formatos adicionales al alcance inicial.

Todos deben derivar de la misma Unidad Editorial Madre.

FORMATO 1. ARTÍCULO WEB / SEO

Generar:

- Título.
- Bajada.
- Introducción.
- Desarrollo periodístico.
- Subtítulos.
- Contexto.
- Datos.
- Declaraciones atribuidas.
- Conclusión o cierre.
- Fuentes.
- Slug.
- Meta descripción.
- Palabras clave.
- Etiquetas.
- Categoría.
- Datos estructurados Schema.org cuando correspondan.

Aplicar la estructura periodística adecuada al género.

La noticia informativa debe priorizar la información central mediante pirámide invertida.

El análisis, la crónica, la entrevista y la investigación pueden utilizar otras estructuras justificadas.

FORMATO 2. GUION DE VIDEO / REEL DE 60 SEGUNDOS

Generar un guion temporalizado:

- 0–5 segundos: apertura y presentación del tema.
- 5–15 segundos: hecho central.
- 15–35 segundos: explicación.
- 35–50 segundos: contexto y datos.
- 50–60 segundos: cierre y llamado a la acción.

Incluir:

- Locución.
- Texto en pantalla.
- Indicaciones visuales.
- Ritmo.
- Recursos sugeridos.
- CTA.

No inventar imágenes documentales ni declaraciones.

FORMATO 3. PODCAST «PRIMERA HORA»

Generar:

- Presentación.
- Introducción.
- Desarrollo.
- Contextualización.
- Datos relevantes.
- Testimonios y declaraciones atribuidas.
- Cierre.

Preparar un guion apto para síntesis de voz.

La generación de audio TTS debe ser un servicio separado del proceso de redacción.

No presentar audio sintético como testimonio real.

FORMATO 4. CARRUSEL DE INSTAGRAM

Generar exactamente ocho diapositivas:

1. Portada.
2. Hecho central.
3. Actores involucrados.
4. Dato relevante.
5. Contexto.
6. Explicación.
7. Consecuencias.
8. Cierre o pregunta.

Cada diapositiva debe contener:

- Número.
- Título.
- Texto.
- Indicación visual.
- Fuente cuando corresponda.

Permitir edición individual y exportación JSON.

FORMATO 5. NEWSLETTER

Generar:

- Asunto.
- Preencabezado.
- Título.
- Introducción.
- Síntesis.
- Datos relevantes.
- Enlace al artículo.
- Cierre.

Debe ser legible, directo y apto para sistemas de correo electrónico.

FORMATO 6. WHATSAPP

Generar un mensaje de difusión con:

- Apertura atractiva.
- Información central.
- Contexto mínimo.
- Lenguaje claro.
- Enlace cuando corresponda.

Evitar exageraciones, clickbait y pérdida del sentido original.

10.1. Reglas comunes de atomización

- Los seis formatos deben compartir los mismos hechos y evidencias.
- Las declaraciones deben mantener su atribución.
- Las incertidumbres deben conservarse.
- Las advertencias no deben desaparecer.
- Ningún formato puede inventar información.
- Cada formato debe poder editarse individualmente.
- Cada versión debe conservar su historial.
- Los cambios en el núcleo deben marcar las salidas potencialmente desactualizadas.
- La regeneración nunca debe sobrescribir silenciosamente ediciones humanas.

11. MOTOR DE IA Y ARQUITECTURA DE SEGURIDAD

Implementar un servicio centralizado de IA.

Arquitectura:

MÓDULOS FRONTEND
→ SERVICIO callIA()
→ SUPABASE EDGE FUNCTION
→ PROVEEDOR DE IA
→ VALIDACIÓN DE RESPUESTA
→ APLICACIÓN

Crear una Edge Function de proxy, por ejemplo "ia-proxy".

Debe:

- Verificar autenticación.
- Validar permisos.
- Validar entradas.
- Aplicar límites de uso.
- Administrar claves secretas.
- Controlar errores.
- Validar respuestas.
- Registrar operaciones relevantes.
- Devolver respuestas estructuradas.

Nunca colocar API Keys en:

- HTML.
- JavaScript público.
- localStorage.
- Archivos descargables.
- Repositorios públicos.

Las credenciales deben almacenarse como secretos del entorno backend.

Diseñar el servicio para que el proveedor de IA pueda cambiarse sin reconstruir todos los módulos.

11.1. Respuestas estructuradas

Utilizar JSON Schema para definir y validar las salidas.

Cada función de IA debe tener:

- Entrada documentada.
- Salida esperada.
- Esquema de validación.
- Manejo de errores.
- Control de tokens o consumo.
- Registro de ejecución.
- Política de reintentos.

No aceptar como respuesta válida un JSON incompleto o incompatible con el esquema.

11.2. Investigación asistida

La IA debe distinguir entre:

- Información recibida.
- Información recuperada.
- Información declarada.
- Información corroborada.
- Información inferida.
- Información desconocida.

No debe completar datos faltantes mediante invenciones.

12. EDITOR CRÍTICO

Desarrollar una segunda instancia de análisis asistido por IA.

Su función es revisar las producciones y advertir:

- Sesgos.
- Contradicciones.
- Problemas de atribución.
- Afirmaciones sin respaldo.
- Datos incorrectos o inconsistentes.
- Errores de nombres y fechas.
- Problemas de claridad.
- Repeticiones.
- Lenguaje discriminatorio o estigmatizante.
- Posibles riesgos jurídicos.
- Omisiones relevantes.
- Descontextualización de citas.

Cada observación debe incluir:

- Fragmento observado.
- Tipo de problema.
- Justificación.
- Gravedad estimada.
- Evidencia relacionada.
- Recomendación.

El Editor Crítico no debe modificar, aprobar ni publicar silenciosamente.

Debe ofrecer sugerencias para que el responsable humano decida.

13. BIBLIOTECA RIOJANA

Construir un sistema de memoria documental activa.

No debe ser una simple carpeta de archivos.

Debe permitir:

- Crear fichas documentales.
- Incorporar documentos.
- Registrar fuentes.
- Clasificar contenidos.
- Relacionar fichas.
- Buscar antecedentes.
- Recuperar producciones anteriores.
- Consultar versiones.
- Identificar documentos relacionados.
- Generar borradores asistidos por IA.
- Exportar información.

13.1. Estructura de ficha

- ID.
- Título.
- Categoría.
- Departamento.
- Localidad.
- Fecha de incorporación.
- Fecha del hecho.
- Fecha de publicación original.
- Resumen.
- Contenido atemporal.
- Fuentes.
- Archivos.
- Estado.
- Responsable.
- Checklist.
- Relaciones.
- Historial.

13.2. Búsqueda

Implementar:

- Búsqueda textual.
- Filtros.
- Búsqueda por categorías.
- Búsqueda territorial.
- Búsqueda por fechas.
- Búsqueda semántica mediante embeddings y pgvector.

La similitud semántica permite recuperar antecedentes, pero no constituye evidencia de veracidad.

13.3. Estados

- Borrador.
- Revisado.
- Publicado.
- Archivado.

Para pasar a Revisado se requiere:

- Título.
- Contenido.
- Checklist completa.
- Ausencia de marcas "[VERIFICAR]".

Para publicar se requiere autorización del rol correspondiente.

14. TRANSCRIPCIÓN DE AUDIO

Desarrollar un módulo de transcripción para:

- Entrevistas.
- Conferencias.
- Testimonios.
- Audios de trabajo.
- Registros periodísticos.

Debe permitir:

- Cargar audio.
- Conservar archivo original.
- Procesar el audio.
- Obtener transcripción.
- Corregir texto.
- Identificar segmentos dudosos.
- Asociar marcas temporales cuando estén disponibles.
- Relacionar transcripción con Unidad Editorial Madre.

La transcripción automática debe identificarse como no verificada hasta su revisión.

No completar palabras inaudibles ni inventar declaraciones.

15. OBSERVATORIOS

Construir tres observatorios conectados con la memoria y la producción editorial.

15.1. OBSERVATORIO ECONÓMICO

Orientado a organizar información sobre:

- Empleo.
- Desocupación.
- Ingresos.
- Salarios.
- Precios.
- Producción.
- Consumo.
- Inversión.
- Actividad económica.
- Finanzas públicas.
- Desarrollo productivo.

15.2. OBSERVATORIO TERRITORIAL

Orientado a organizar información sobre:

- Población.
- Vivienda.
- Servicios.
- Agua.
- Energía.
- Conectividad.
- Educación.
- Salud.
- Infraestructura.
- Transporte.
- Desigualdad.
- Condiciones territoriales.

15.3. OBSERVATORIO DE AUDIENCIAS

Orientado a organizar:

- Visitas.
- Lecturas.
- Tiempo de permanencia.
- Tráfico.
- Distribución por canales.
- Interacciones.
- Suscripciones.
- Aperturas de newsletter.
- Rendimiento de contenidos.
- Consultas y participación.

No confundir métricas digitales con representatividad de la opinión pública.

15.4. Modelo metodológico

Cada indicador debe conservar:

- Nombre.
- Definición.
- Fórmula.
- Unidad.
- Período.
- Frecuencia.
- Territorio.
- Fuente.
- Metodología.
- Fecha de actualización.
- Vigencia.
- Responsable.
- Calidad del dato.

Distinguir:

- Dato original.
- Variable.
- Indicador.
- Observación.
- Serie temporal.
- Interpretación.
- Producción editorial.

15.5. Territorio

La Rioja debe ser una unidad de análisis central.

Permitir organizar información por:

- Argentina.
- Norte Grande.
- Provincia de La Rioja.
- Departamentos.
- Localidades.
- Barrios.

Las escalas deben ser comparables cuando las fuentes y metodologías lo permitan.

No inventar datos territoriales.

16. FLUJO EDITORIAL Y CONTROL HUMANO

Implementar el flujo principal:

BORRADOR → REVISADO → PUBLICADO.

El sistema puede incorporar estados internos adicionales como:

- En investigación.
- En verificación.
- Con observaciones.
- Pendiente de respuesta.
- Corregido.
- Archivado.

16.1. Requisitos para Revisado

- Título.
- Contenido.
- Checklist completa.
- Sin afirmaciones pendientes marcadas "[VERIFICAR]".
- Fuentes y atribuciones registradas.
- Revisión editorial realizada.

16.2. Requisitos para Publicado

- Usuario con rol editor o administrador.
- Estado Revisado.
- Autorización humana explícita.
- Registro de auditoría.

Una modificación sustantiva posterior a la revisión debe invalidar la aprobación anterior o exigir una nueva revisión.

La IA nunca puede aprobar ni publicar por sí misma.

16.3. Roles

Implementar como mínimo:

- Colaborador.
- Redactor.
- Revisor.
- Editor.
- Administrador.

Los permisos deben estar definidos en backend y reforzados mediante RLS.

17. DISTRIBUCIÓN MULTICANAL

Desarrollar un módulo que prepare y gestione la distribución.

Canales contemplados:

- Sitio web / WordPress.
- Redes sociales.
- Video / Reel.
- Podcast.
- Newsletter.
- WhatsApp.

Cada canal debe tener un estado independiente.

Estados propuestos:

- No preparado.
- Preparado.
- Pendiente de autorización.
- Autorizado.
- Enviado.
- Publicado.
- Error.
- Cancelado.

17.1. WordPress

Implementar integración con la API REST de WordPress.

Reglas obligatorias:

- Crear exclusivamente borradores ("draft").
- Requerir usuario autenticado.
- Exigir rol editor o administrador.
- Exigir estado editorial Revisado.
- Verificar ausencia de "[VERIFICAR]".
- Solicitar confirmación humana.
- Registrar la operación.
- Conservar la respuesta del servicio.

Nunca publicar directamente desde Madre.

La publicación definitiva se realiza desde WordPress mediante intervención humana.

17.2. Otras integraciones

Diseñar adaptadores para futuros canales.

No afirmar que redes sociales, correo electrónico, WhatsApp o TTS están conectados hasta completar sus integraciones y pruebas reales.

18. METADATOS, SEO Y ESTRUCTURACIÓN

El sistema debe generar metadatos para cada producción:

- Título SEO.
- Slug.
- Meta descripción.
- Etiquetas.
- Categorías.
- Entidades.
- Territorio.
- Tema.
- Fecha.
- Fuentes.
- Enlaces internos.
- Datos estructurados Schema.org cuando corresponda.

Los metadatos deben ser coherentes con el contenido real.

No incorporar palabras clave, lugares, actores o declaraciones inexistentes.

Permitir relacionar etiquetas y temas con los observatorios.

19. MODELO DE DATOS Y BASE DE DATOS

Diseñar una base relacional en PostgreSQL.

Como mínimo, evaluar e implementar las siguientes entidades:

- "profiles"
- "roles"
- "permissions"
- "editorial_units"
- "editorial_inputs"
- "editorial_facts"
- "editorial_claims"
- "sources"
- "evidences"
- "editorial_context"
- "editorial_formats"
- "editorial_versions"
- "editorial_reviews"
- "editorial_audit"
- "library_records"
- "library_relations"
- "library_files"
- "library_embeddings"
- "observatories"
- "variables"
- "indicators"
- "observations"
- "data_sources"
- "territories"
- "methodologies"
- "distributions"
- "distribution_events"
- "media_assets"
- "integrations"

Definir:

- Claves primarias.
- Claves foráneas.
- Índices.
- Restricciones.
- Relaciones.
- Fechas.
- Estados.
- Políticas RLS.
- Triggers.
- Funciones SQL cuando correspondan.

Evitar duplicaciones innecesarias.

El diseño debe permitir crecimiento sin perder integridad.

Crear migraciones versionadas y reproducibles.

No depender de cambios manuales no documentados en la base de datos.

20. PERSISTENCIA, VERSIONADO Y AUDITORÍA

Implementar persistencia remota mediante Supabase.

Utilizar almacenamiento local exclusivamente para preferencias y borradores temporales cuando corresponda.

No utilizar localStorage como base principal de datos editoriales.

Implementar:

- Guardado automático.
- Control de concurrencia.
- Detección de conflictos.
- Versionado.
- Recuperación.
- Historial.
- Registro de cambios.

Cada operación importante debe conservar:

- Usuario.
- Acción.
- Fecha y hora.
- Entidad afectada.
- Estado anterior.
- Estado nuevo.
- Versión.
- Observaciones.

La memoria debe distinguir información histórica de información vigente.

21. SEGURIDAD

Aplicar seguridad desde el diseño.

Requisitos obligatorios:

- Autenticación.
- Autorización.
- RLS.
- Validación backend.
- Secretos fuera del frontend.
- CORS restrictivo.
- Validación de entradas.
- Protección de archivos.
- Límites de consumo.
- Control de sesiones.
- Manejo de errores.
- Auditoría.
- Principio de mínimo privilegio.

Las restricciones de la interfaz no sustituyen los controles del servidor.

Realizar pruebas de acceso indebido, escalamiento de privilegios y exposición de datos.

22. ACCESIBILIDAD Y RENDIMIENTO

Garantizar:

- Navegación por teclado.
- Etiquetas accesibles.
- Contraste suficiente.
- Jerarquías semánticas.
- Textos alternativos.
- Formularios comprensibles.
- Estados de foco visibles.
- Compatibilidad con lectores de pantalla.
- Diseño adaptable.

Optimizar:

- Carga inicial.
- Carga diferida de módulos.
- Consultas paginadas.
- Índices de búsqueda.
- Tamaño de recursos.
- Procesos de IA.
- Recuperación ante errores.
- Reintentos controlados.

Probar el funcionamiento en dispositivos móviles y conexiones lentas.

23. ESTRUCTURA DEL PROYECTO

Adoptar una organización modular equivalente a:

madre-ecosistema/
│
├── index.html
├── assets/
│   ├── css/
│   ├── fonts/
│   └── js/
│       ├── core/
│       ├── components/
│       └── services/
│
├── madre/
├── biblioteca/
├── editor-critico/
├── transcripcion/
├── observatorios/
│   ├── economico/
│   ├── territorial/
│   └── audiencias/
│
├── distribucion/
│
├── admin/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── config.toml
│
├── tests/
├── docs/
└── README.md

La estructura puede ajustarse si existe una justificación técnica, pero debe conservar la separación entre módulos, servicios compartidos, backend y documentación.

24. PLAN DE DESARROLLO E IMPLEMENTACIÓN

Desarrollar por fases, manteniendo desde el comienzo una arquitectura integral.

FASE 0. PREPARACIÓN

- Crear el proyecto.
- Configurar herramientas.
- Definir estructura.
- Configurar control de versiones.
- Preparar documentación.
- Definir variables de entorno.
- Establecer convenciones de código.

ENTREGABLE: proyecto inicial ejecutable.

FASE 1. NÚCLEO Y BACKEND

- Configurar Supabase.
- Diseñar base de datos.
- Implementar migraciones.
- Implementar Auth.
- Implementar perfiles y roles.
- Implementar RLS.
- Crear Storage.
- Crear proxy de IA.
- Crear servicios compartidos.
- Crear auditoría.

ENTREGABLE: núcleo operativo y seguro.

FASE 2. MADRE EDITORIAL

- Crear interfaz de ingesta.
- Implementar procesamiento.
- Construir Unidad Editorial.
- Implementar fuentes y evidencias.
- Implementar investigación.
- Implementar verificación.
- Generar seis formatos.
- Implementar edición y versiones.

ENTREGABLE: cadena editorial funcional.

FASE 3. BIBLIOTECA RIOJANA

- Fichas.
- Documentos.
- Relaciones.
- Búsqueda.
- Embeddings.
- Memoria semántica.
- Historial.

ENTREGABLE: memoria documental operativa.

FASE 4. EDITOR CRÍTICO Y TRANSCRIPCIÓN

- Revisión asistida.
- Detección de inconsistencias.
- Gestión de observaciones.
- Carga de audio.
- Transcripción.
- Corrección y vinculación editorial.

ENTREGABLE: herramientas de apoyo cognitivo.

FASE 5. OBSERVATORIOS

- Modelo de datos.
- Catálogo de indicadores.
- Carga de fuentes.
- Validación.
- Series temporales.
- Paneles.
- Relaciones editoriales.

ENTREGABLE: observatorios funcionales con datos identificables.

FASE 6. DISTRIBUCIÓN

- Estados por canal.
- Autorizaciones.
- WordPress.
- Preparación de contenidos.
- Historial.
- Métricas de distribución.

ENTREGABLE: distribución controlada.

FASE 7. VALIDACIÓN Y PRODUCCIÓN

- Pruebas funcionales.
- Pruebas de seguridad.
- Pruebas editoriales.
- Pruebas de rendimiento.
- Pruebas de accesibilidad.
- Documentación.
- Despliegue.
- Monitoreo.

ENTREGABLE: versión de producción validada.

25. PRUEBAS OBLIGATORIAS

No considerar terminado un módulo sin pruebas.

25.1. Pruebas funcionales

Probar:

- Autenticación.
- Roles.
- Ingesta.
- Documentos.
- Fuentes.
- Unidad Editorial.
- Verificación.
- Seis formatos.
- Edición.
- Versiones.
- Biblioteca.
- Búsquedas.
- Observatorios.
- Distribución.
- Auditoría.

25.2. Pruebas editoriales

Utilizar casos de prueba que incluyan:

- Comunicado institucional.
- Denuncia no comprobada.
- Fuentes contradictorias.
- Documento histórico.
- Estadística sin metodología.
- Entrevista con fragmentos inaudibles.
- Noticia que cambia con el tiempo.
- Información sensible.
- Error posterior a la publicación.

Verificar que el sistema no convierta incertidumbre en certeza.

25.3. Pruebas de seguridad

- Accesos entre usuarios.
- Permisos incorrectos.
- Acceso directo a endpoints.
- Exposición de claves.
- RLS.
- Archivos.
- Sesiones.
- CORS.
- Publicación no autorizada.

25.4. Prueba integral de extremo a extremo

Ejecutar este escenario:

1. Ingresar un documento sobre una situación de interés público en La Rioja.
2. Conservar el original.
3. Extraer hechos y afirmaciones.
4. Recuperar antecedentes de Biblioteca Riojana.
5. Incorporar fuentes.
6. Relacionar evidencias.
7. Identificar contradicciones.
8. Construir la Unidad Editorial Madre.
9. Generar los seis formatos.
10. Ejecutar el Editor Crítico.
11. Corregir observaciones.
12. Aprobar mediante un editor humano.
13. Enviar un borrador a WordPress.
14. Registrar la respuesta.
15. Conservar la versión y el historial.

Esta prueba debe demostrar que los módulos funcionan como un ecosistema integrado.

26. GUÍA DE ESTILO EDITORIAL

Incorporar como norma transversal la Guía de Estilo Editorial de referencia.

La guía establece criterios para:

- Identidad editorial.
- Rigor y veracidad.
- Identidad riojana.
- Independencia de criterio.
- Pluralidad.
- Memoria y contexto.
- Claridad.
- Precisión.
- Lenguaje respetuoso.
- Estructura de noticias.
- Titulares y bajadas.
- Fuentes y atribuciones.
- Verificación.
- Cobertura territorial.
- Géneros periodísticos.
- Ética.
- Derechos.
- Fotografía y video.
- Convenciones lingüísticas.
- SEO.
- Actualización.
- Inteligencia artificial.
- Correcciones.
- Responsabilidades editoriales.
- Checklist de publicación.

26.1. Aplicación operativa

La guía no debe quedar como un archivo aislado.

Debe incorporarse al sistema mediante un servicio editorial compartido.

Todos los módulos que generen o modifiquen contenidos deben poder consultar las reglas aplicables.

El sistema debe utilizarlas para:

- Orientar instrucciones de IA.
- Revisar titulares.
- Evaluar estructuras.
- Detectar lenguaje estigmatizante.
- Verificar atribuciones.
- Recomendar correcciones.
- Controlar metadatos.
- Evaluar la publicación.

26.2. Criterios editoriales fundamentales

- Claridad antes que complejidad.
- Precisión antes que espectacularidad.
- Hechos diferenciados de interpretaciones.
- Fuentes identificables.
- Titulares fieles al contenido.
- Cobertura territorial riojana.
- Pluralidad de voces.
- Respeto por las personas.
- Contexto histórico y social.
- Transparencia en las correcciones.
- Responsabilidad humana.

La guía de referencia es una propuesta institucional que requiere validación de la dirección del medio. El sistema debe permitir administrar versiones y modificaciones sin alterar retroactivamente las producciones históricas.

27. DOCUMENTACIÓN Y ENTREGABLES

Crear y mantener:

- README.md.
- Documento de arquitectura.
- Diagrama de módulos.
- Diagrama de base de datos.
- Diccionario de datos.
- Documentación de Edge Functions.
- Esquemas JSON.
- Manual de instalación.
- Manual de configuración.
- Manual de usuario.
- Matriz de permisos.
- Registro de pruebas.
- Registro de errores conocidos.
- Guía de despliegue.
- Guía de mantenimiento.

Las credenciales, contraseñas y secretos nunca deben incluirse en la documentación pública.

28. REGLAS DE TRABAJO DEL AGENTE

Estas instrucciones son obligatorias durante todo el desarrollo.

1. Trabaja sobre el proyecto real, no entregues solamente ejemplos.
2. Crea los archivos necesarios.
3. Implementa las funcionalidades completas.
4. Integra frontend y backend.
5. Ejecuta las pruebas disponibles.
6. Corrige errores detectados.
7. No simules conexiones.
8. No declares terminado lo que no funciona.
9. No reemplaces código sin revisar sus dependencias.
10. No elimines información ni migraciones sin justificación.
11. Mantén la arquitectura modular.
12. Documenta las decisiones técnicas relevantes.
13. Prioriza seguridad y trazabilidad.
14. Conserva la experiencia de usuario consistente.
15. No sacrifiques rigor editorial para acelerar la generación.
16. No utilices datos de demostración como información real.
17. No publiques automáticamente.
18. Si una integración requiere credenciales o acceso externo, prepara su implementación y solicita lo necesario para probarla.
19. Si una dependencia externa no está disponible, informa la limitación y continúa con las tareas independientes.
20. No detengas el desarrollo para solicitar confirmación de decisiones técnicas ordinarias que puedas resolver justificadamente.

Cuando una decisión afecte el alcance, la seguridad, la identidad institucional o el comportamiento editorial, documenta la decisión y solicita definición si no existe una regla previa.

29. CRITERIOS DE ACEPTACIÓN DEL PRODUCTO

MADRE no puede considerarse terminado por tener una interfaz atractiva o un botón que invoque una IA.

Debe demostrar que:

- Recibe información desde distintas fuentes.
- Conserva originales.
- Organiza hechos y afirmaciones.
- Identifica fuentes y evidencias.
- Investiga y recupera antecedentes.
- Diferencia hechos, opiniones e hipótesis.
- Detecta contradicciones.
- Construye una Unidad Editorial Madre.
- Produce exactamente seis formatos.
- Mantiene coherencia entre ellos.
- Permite edición y versionado.
- Dispone de Biblioteca Riojana.
- Incorpora Editor Crítico.
- Permite transcripción.
- Gestiona observatorios.
- Administra estados y autorizaciones.
- Conserva auditoría.
- Gestiona distribución.
- Envía borradores a WordPress.
- Protege los datos.
- Funciona en dispositivos móviles.
- Cuenta con documentación y pruebas.

La cadena editorial integral debe funcionar de principio a fin.

30. PRIMERA INSTRUCCIÓN DE EJECUCIÓN

INICIA EL DESARROLLO DE MADRE DESDE CERO.

No respondas solamente con una planificación.

Comienza creando el proyecto, su estructura, los archivos iniciales y la infraestructura técnica.

Ejecuta las siguientes acciones:

1. Inicializa el repositorio y la estructura modular.
2. Configura el entorno de desarrollo.
3. Implementa el Shell principal.
4. Configura la conexión con Supabase.
5. Diseña y crea las primeras migraciones.
6. Implementa autenticación y roles.
7. Construye los servicios compartidos.
8. Prepara el proxy seguro de IA.
9. Implementa la primera versión funcional del módulo Madre Editorial.
10. Construye la Unidad Editorial y el flujo de ingesta.
11. Implementa la generación de los seis formatos.
12. Ejecuta pruebas y documenta los resultados.
13. Continúa con las fases siguientes hasta completar el ecosistema.

Si no se dispone de credenciales externas, desarrolla la integración hasta el límite técnicamente posible, deja configuradas las variables necesarias y documenta exactamente qué acceso falta para realizar la prueba real.

No inventes resultados de pruebas.

Al finalizar cada fase, informa:

- Qué se implementó.
- Qué archivos se crearon o modificaron.
- Qué migraciones se ejecutaron.
- Qué funcionalidades funcionan.
- Qué pruebas se realizaron.
- Qué errores quedan pendientes.
- Qué integraciones requieren credenciales.
- Cuál es el siguiente hito.

PRINCIPIO FINAL

MADRE debe convertirse en una infraestructura de conocimiento periodístico.

No debe limitarse a producir más contenidos, sino mejorar la capacidad de investigar, comprender, verificar, contextualizar, conservar memoria y comunicar información relevante.

Su arquitectura debe permitir que cada hecho investigado pueda convertirse en conocimiento documentado, que cada producción pueda generar múltiples formatos y que cada publicación conserve su origen, sus evidencias, sus versiones y su responsabilidad editorial.

UN ECOSISTEMA. UNA ARQUITECTURA. UNA MEMORIA COMPARTIDA.

LA IA PRODUCE ASISTENCIA. MADRE ORGANIZA EL CONOCIMIENTO. LAS PERSONAS CONSERVAN LA RESPONSABILIDAD EDITORIAL.