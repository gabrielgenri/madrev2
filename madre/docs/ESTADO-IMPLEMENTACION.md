# Estado de implementación — núcleo inicial

## Implementado en el repositorio

- Base SPA con Vite y JavaScript ES Modules.
- Cliente Supabase configurado mediante variables de entorno.
- Autenticación por enlace mágico.
- Servicio de datos para crear, listar, consultar y editar unidades editoriales.
- Vista inicial de Madre Editorial.
- Servicio compartido con reglas editoriales operativas.
- Documentación técnica y criterios editoriales iniciales.
- Migración complementaria de seguridad para impedir que un usuario sin rol editor/admin publique una unidad editorial.

## Verificado

- `node --check` sobre los archivos JavaScript del starter original y los archivos modificados.
- El proyecto Supabase `cxuoaydhmvafsgtklwny` está activo y saludable.
- La migración remota fundacional figura en el historial Supabase con versión `20261114034956` y nombre `madre_core_foundation`.
- El esquema remoto contiene diez tablas públicas con RLS habilitado, incluyendo `profiles`, `user_roles`, `editorial_units`, fuentes, afirmaciones, evidencias, verificaciones, formatos y auditoría.
- Las políticas RLS fueron inspeccionadas para `editorial_units` y sus entidades relacionadas.
- Se incorporó y aplicó el guard de publicación `editorial_units_guard_publish`: la transición a `published` requiere rol `editor` o `admin`.
- El proyecto mantiene extensiones `vector`, `pgcrypto` y `uuid-ossp` disponibles.

## Investigación editorial incorporada

- La vista de una unidad permite abrir un espacio de investigación.
- Alta y consulta de fuentes con tipo, URL, autor/organismo, editor, extracto y notas.
- Alta y consulta de afirmaciones con tipo, importancia y contexto.
- Registro de evidencias relacionadas con una afirmación y/o fuente, con localizador y relación (apoya, contradice, contextualiza).
- Consulta del historial de verificaciones y formulario para registrar una revisión humana. La base de datos limita la inserción a roles reviewer/editor/admin; los permisos se validan en RLS.
- La verificación se conserva como historial en `verifications`; la interfaz muestra la última revisión sin sobrescribir directamente el campo de estado de la afirmación, evitando exigir permisos de edición de claims a un revisor.

## Pendiente de verificación

- Instalación de dependencias y `vite build`: el intento anterior de `npm install` no terminó dentro del tiempo disponible; no se declara compilación exitosa.
- Conexión del navegador al proyecto: falta configurar localmente la publishable key.
- Flujo real de autenticación y CRUD con un usuario.
- Pruebas en navegador del flujo fuentes → afirmaciones → evidencias → verificación, incluyendo rechazo de usuarios sin rol de revisor.
- Pruebas de permisos y aislamiento RLS desde un cliente autenticado real.
- Prueba integral de extremo a extremo.
- Incorporación futura de la migración fundacional completa como fuente reproducible del esquema; el archivo remoto `madre_core_foundation` no se puede recuperar byte a byte desde el historial de migraciones mediante las herramientas disponibles.

## Seguridad pendiente

El asesor de Supabase detecta funciones `SECURITY DEFINER` expuestas en el esquema `public` (`audit_editorial_unit`, `handle_new_user`, `has_role`). No se modifica ese diseño automáticamente porque `has_role` participa en las políticas RLS y las otras funciones se utilizan como infraestructura de triggers; queda como tarea explícita de endurecimiento, con pruebas posteriores.

## Decisiones

- El repositorio ya contenía el Prompt Maestro en `README.md` y el registro `supabase.md`; ambos se preservan.
- No se habilita el estado Revisado desde la interfaz inicial: todavía no existen checklist, fuentes y evidencias operativas completas en la UI.
- No se incluye ninguna clave secreta en el repositorio.


## PASO 14 — Versionado editorial y control de cambios

- Se reutiliza la tabla existente `editorial_versions`; no se crea una estructura paralela.
- Un trigger de base de datos registra una instantánea al crear una unidad y ante cambios en título, slug, resumen, contenido madre, estado o metadatos.
- Se incorporó el RPC `update_editorial_unit_with_version`, que actualiza los campos editables permitidos y adjunta el motivo del cambio en la misma transacción.
- La interfaz solicita el motivo de cada modificación y muestra el historial ordenado por número de versión.
- Restaurar una versión recupera título, resumen y contenido madre mediante el mismo flujo de actualización; nunca sobrescribe ni elimina versiones anteriores y genera una nueva entrada.
- Las versiones no admiten UPDATE ni DELETE: un trigger bloquea ambas operaciones, incluso cuando el borrado se intenta por cascada desde la unidad. No hay políticas RLS de modificación sobre el historial.
- Se incorporaron versiones iniciales para las unidades que ya existían al activar el mecanismo.

### Verificación de base de datos

- La migración `editorial_version_history_and_restore` fue aplicada.
- Se comprobó la existencia del RPC, la función de captura y el trigger.
- La consulta de control confirmó dos versiones iniciales y cero unidades sin versión al momento de la comprobación.

### Pendiente de verificación funcional

- Probar una edición autenticada y comprobar el incremento del número de versión.
- Verificar rechazo de usuarios sin permiso de edición mediante RLS.
- Probar restauración desde navegador y confirmar que crea una versión nueva.
- Ejecutar `node --check`, `vite build` y pruebas de extremo a extremo. No se declara compilación ni prueba de navegador como exitosas.


## PASO 15 — Producción y trazabilidad de los seis formatos

Se utiliza la tabla existente `editorial_formats` y se respetan sus seis tipos permitidos: `web_seo`, `video_reel_60`, `podcast_primera_hora`, `instagram_carousel_8`, `newsletter` y `whatsapp`.

- Se incorporó un espacio de trabajo para consultar y editar un borrador por cada formato de una unidad editorial.
- Cada guardado utiliza la RPC `save_editorial_format`, que obtiene la última versión madre vigente y registra su ID en `source_version_id`.
- Guardar una pieza la deja en estado `draft`; no se aprueba ni publica automáticamente.
- Un trigger sobre `editorial_versions` marca como `is_stale = true` los formatos vinculados a versiones anteriores cuando se registra una nueva versión madre.
- Al editar y guardar nuevamente una pieza, se vincula a la versión madre vigente y se limpia la marca de desactualización.
- El guardado se ejecuta con `SECURITY INVOKER`, por lo que conserva la aplicación de RLS existente. La RPC valida autenticación, formato permitido, título y longitud máxima del contenido.

### Límite funcional explícito

Esta entrega implementa persistencia, edición y trazabilidad de borradores para los seis formatos. No integra todavía un proveedor de IA ni genera automáticamente textos terminados. El contenido debe ser redactado y revisado por personas; la automatización de generación asistida será una etapa posterior, sin alterar la regla de aprobación humana.

### Verificación ejecutada en base de datos

- Se confirmó la existencia de la RPC `save_editorial_format`, la función de obsolescencia y su trigger.
- Se ejecutó una prueba transaccional bajo el rol `authenticated` usando el usuario propietario de una unidad existente.
- La prueba creó un borrador temporal, actualizó el contenido madre y comprobó que el formato pasó a `is_stale = true`.
- Luego volvió a guardar el formato y comprobó que `is_stale = false` y que `source_version_id` apunta a la versión madre más reciente.
- La prueba terminó con `ROLLBACK`: no dejó piezas de prueba en la base de datos.
- Se agregaron índices para las referencias `source_version_id` y `created_by` de `editorial_formats`.

### Verificación pendiente

- Probar alta y edición de cada uno de los seis formatos desde la interfaz con sesión autenticada.
- Probar permisos RLS con perfiles autor, editor y administrador.
- Ejecutar `node --check`, `vite build` y pruebas de navegador. No se declaran como realizadas en este paso.


## PASO 16 — Generación editorial asistida por IA

- Se desplegó la Edge Function `generate-editorial-format` en Supabase, con verificación JWT habilitada.
- La función valida la sesión del usuario y consulta unidades, versiones, fuentes, afirmaciones, evidencias y verificaciones mediante un cliente Supabase con el JWT del usuario; las consultas respetan RLS.
- Se implementaron instrucciones específicas para los seis formatos editoriales y reglas para no inventar hechos, cifras, citas, fuentes ni enlaces; las afirmaciones no verificadas deben conservar su atribución o quedar señaladas.
- El endpoint devuelve un borrador estructurado, la versión madre utilizada, IDs de fuentes y afirmaciones citadas y alertas editoriales. No escribe en la base de datos.
- La interfaz permite solicitar la generación, revisar y editar el resultado y guardarlo como borrador mediante la RPC existente. Antes de guardar, compara la versión madre utilizada con la última versión disponible y bloquea el guardado si hubo cambios.
- La generación y el guardado no revisan, aprueban ni publican automáticamente. La responsabilidad editorial sigue siendo humana.
- El proveedor previsto es OpenAI mediante la Responses API. La función lee `OPENAI_API_KEY` desde los secretos del entorno Edge Functions y permite configurar `OPENAI_MODEL` (por defecto `gpt-4.1-mini`); la clave no se guarda en el repositorio ni en el navegador.

### Configuración externa pendiente

- Confirmar en Supabase Dashboard → Edge Functions → Secrets que exista `OPENAI_API_KEY`; si falta, cargarlo allí. Sin ese secreto, la función responde `503 provider_not_configured` y la generación no estará disponible.
- Opcionalmente definir `OPENAI_MODEL`; si no se define, la función usa `gpt-4.1-mini`.
- Ejecutar una generación real con usuario autenticado, verificar las referencias devueltas y probar el bloqueo por cambio de versión madre.
- Ejecutar `vite build` y pruebas de navegador. No se declaran realizadas en esta entrega.


## PASO 17 — Control de calidad editorial y registro de observaciones

- Se incorporaron las tablas `editorial_quality_reviews` y `editorial_quality_observations`, con RLS habilitado, políticas basadas en el acceso a la unidad editorial y permisos de solo lectura/alta para usuarios autenticados.
- Los reportes y las observaciones son append-only: no se conceden permisos de UPDATE ni DELETE. Cada ejecución guarda versión madre, checklist, hallazgos, métricas, responsable y fecha.
- La interfaz de los seis formatos incorpora el panel de control de calidad, historial de ejecuciones, checklist visible, alertas clasificadas y registro de observaciones humanas.
- Los chequeos estructurales detectan formatos faltantes/incompletos, formatos desactualizados, afirmaciones sin evidencia de apoyo vinculada a una fuente, verificaciones pendientes/no verificadas/contradictorias, enlaces que no coinciden con las URLs registradas, extensión orientativa del Reel y WhatsApp, y cantidad de placas del carrusel.
- La comparación cruzada busca cifras y fechas repetidas en contextos textuales similares y señala posibles divergencias para confirmación. No interpreta equivalencia semántica ni determina qué dato es verdadero.
- Las notas humanas quedan vinculadas a una ejecución concreta y conservan severidad, autor y fecha. Una nueva ejecución crea un reporte nuevo; no sobrescribe los anteriores.
- Si cambia el contenido madre o se guarda un formato después de un control, la interfaz identifica el reporte como desactualizado y deshabilita nuevas observaciones hasta ejecutar otro control.
- El resultado `checks_complete` significa que no se detectaron alertas estructurales de nivel advertencia/crítico; no equivale a revisión, aprobación ni autorización de publicación.

### Verificación ejecutada

- Supabase confirma ambas tablas, RLS activo y dos políticas por tabla.
- Se confirmó ausencia de grants para `anon`.
- Se endurecieron los permisos para que `authenticated` tenga únicamente SELECT e INSERT; no puede modificar ni borrar reportes u observaciones.
- Prueba transaccional bajo rol `authenticated` y usuario propietario de una unidad: insertó un reporte y una observación, ambas filas fueron visibles con RLS y la transacción terminó en `ROLLBACK`; no dejó datos de prueba.
- Se agregaron índices para historial por unidad, formato, autor y observaciones por reporte.

### Límites y pendientes

- El control es determinístico y estructural; no usa IA para juzgar veracidad ni sustituye una lectura semántica completa.
- Las divergencias numéricas y de fechas son heurísticas basadas en fragmentos de texto similares; pueden generar falsos positivos o no detectar paráfrasis.
- Falta probar el flujo completo en navegador con perfiles autor, revisor y editor.
- El asesor de rendimiento mantiene ocho claves foráneas sin índice en tablas previas, 15 índices informados como no utilizados y la advertencia de políticas SELECT múltiples en `user_roles`; las cuatro FK de la nueva tabla de eventos están indexadas.
- El asesor de seguridad mantiene tres advertencias previas sobre funciones `SECURITY DEFINER` en `public` (`audit_editorial_unit`, `handle_new_user`, `has_role`) y una sobre protección de contraseñas filtradas deshabilitada. No fueron modificadas en este paso.

- Ejecutar `node --check`, `vite build` y pruebas de extremo a extremo. No se declaran realizadas en esta entrega.

## PASO 18 — Circuito formal de revisión y aprobación humana

- Se creó `editorial_review_events`, un historial append-only que registra solicitudes de revisión, pedidos de corrección y aprobaciones con responsable, fecha, versión madre, control de calidad asociado y fundamento escrito.
- RLS habilitado: los eventos solo son visibles para quienes pueden acceder a la unidad; las inserciones exigen identidad autenticada y rol/relación compatible con el tipo de evento. No se conceden permisos de UPDATE ni DELETE. La FK de unidad usa `ON DELETE RESTRICT` para que borrar una unidad no elimine en cascada el historial de decisiones.
- La RPC `record_editorial_review_event` usa `SECURITY INVOKER`, exige sesión y nota, y registra el evento contra la última versión madre y el control de calidad correspondiente.
- La base valida que existan los seis formatos completos, vigentes y vinculados a la versión madre actual; que el control de calidad sea posterior a la última modificación de formatos; y que no haya hallazgos críticos.
- Secuencia permitida: `review_requested` por autor/asignado/editor/admin; `changes_requested` por reviewer/editor/admin; `approved` por editor/admin. La solicitud puede reiterarse después de una devolución.
- La aprobación humana cambia la unidad de `draft` a `reviewed`. La base exige que exista un evento `approved` asociado a la versión madre vigente; no alcanza con editar directamente el estado. La publicación requiere editor/admin, estado `reviewed` y aprobación humana vigente.
- Si se modifica el contenido madre de una unidad `reviewed` o `published`, el flujo vuelve automáticamente a `draft`, se limpia `published_at` y se crea una nueva versión de contenido. La pieza debe pasar nuevamente por revisión.
- Los eventos usan `clock_timestamp()` para conservar el orden real de decisiones incluso cuando se registran dentro de una misma transacción.
- El estado editorial se excluye de la captura de versiones de contenido: una aprobación no crea una versión madre nueva ni invalida los seis formatos. Las modificaciones de contenido sí continúan creando versiones.
- La interfaz muestra historial y acciones según el rol y el estado; el servidor y la base de datos vuelven a validar todos los permisos y precondiciones. La visibilidad de botones no se considera un control de seguridad.

### Verificaciones ejecutadas / pendientes

- Migraciones desplegadas en Supabase y código del servicio/vista/documentación incorporado al repositorio.
- Prueba transaccional ejecutada como usuario autenticado con rol admin: creó una unidad temporal, vinculó los seis formatos a una versión, registró control de calidad, completó solicitud → devolución → nueva solicitud → aprobación y verificó estado `reviewed`. También comprobó que una transición directa a `reviewed` es rechazada y que una edición posterior vuelve a `draft` y crea una nueva versión. La transacción terminó en `ROLLBACK`; no dejó filas de prueba.
- Se verificó RLS activo y permisos append-only: authenticated SELECT/INSERT, sin UPDATE/DELETE; anon sin SELECT. El índice de `source_version_id` fue agregado tras detectar una FK sin índice.
- El proyecto actualmente solo tiene un usuario con rol `admin` registrado en `user_roles`; no se encontró un usuario con rol `reviewer` ni `editor`. Para probar esos perfiles será necesario asignarlos mediante el procedimiento administrativo de roles, sin elevar permisos desde la interfaz.
- No se declara prueba de navegador, compilación Vite ni E2E como realizada.
## PASO 19 — Bandeja operativa, asignaciones y prioridades

- Se incorporaron `priority` (`low`, `normal`, `high`, `urgent`) y `due_at` a `editorial_units`; `assigned_to` ya existía y ahora forma parte de la planificación visible.
- Se creó `editorial_work_events`, un historial append-only de cambios de responsable, prioridad y vencimiento, con actor, fecha y motivo obligatorio.
- La RPC `assign_editorial_work` es `SECURITY INVOKER`: solo editor/admin puede asignar tareas, modificar prioridades o definir fechas límite. La persona asignada debe tener un rol vigente en Madre.
- Un trigger impide modificar directamente por REST los campos `assigned_to`, `priority` y `due_at`, y protege la autoría original. El historial de asignaciones no admite UPDATE ni DELETE.
- Se amplió el acceso de perfiles editor/admin al directorio mínimo de perfiles y roles para elegir responsables. Se separaron las políticas administrativas de roles para evitar políticas SELECT permisivas duplicadas.
- Los usuarios asignados pueden abrir y trabajar unidades en Borrador: editar contenido madre, agregar fuentes, afirmaciones, evidencias y formatos, y crear versiones. La asignación y la prioridad siguen reservadas a editor/admin.
- La bandeja permite filtrar todas las unidades, mi trabajo, pendientes de revisión, vencidas y sin asignar. Ordena por prioridad y vencimiento, muestra responsable y fecha límite, y distingue solicitudes de revisión vigentes de las que quedaron obsoletas.
- Se corrigió un borde del PASO 18: después de cambiar el contenido durante una revisión, la respuesta del revisor sobre la versión anterior queda bloqueada. Se requiere control de calidad actualizado y una nueva solicitud para la nueva versión.
- Se agregaron índices para la cola, vencimientos e historial. El asesor ya no informa claves foráneas sin índice en la nueva tabla de trabajo ni políticas SELECT múltiples en `user_roles`.

### Verificaciones ejecutadas / pendientes

- Prueba transaccional con rol admin: asignación con prioridad urgente y vencimiento; creación de los seis formatos; control de calidad; solicitud de revisión; modificación del contenido durante la revisión; rechazo de la decisión sobre la solicitud obsoleta; actualización de formatos y control de calidad; nueva solicitud, devolución, reenvío y aprobación. La prueba finalizó con `ROLLBACK` y no dejó datos temporales.
- RLS de `editorial_work_events` verificado: SELECT/INSERT para authenticated, sin UPDATE/DELETE y sin SELECT para anon. La RPC de asignación es SECURITY INVOKER y sus permisos se limitan a authenticated.
- Se comprobó sintaxis JavaScript de `editorial.service.js` y `editorial.view.js` con el parser de JavaScript. No equivale a compilación Vite ni prueba de navegador.
- Sigue pendiente probar el circuito con cuentas reales `writer`, `collaborator`, `reviewer` y `editor`: actualmente solo existe una cuenta con rol `admin`. No se elevó ni inventó ningún rol para simular usuarios.
- No se declara compilación Vite, prueba de navegador ni E2E como realizada.
- El asesor de rendimiento conserva siete claves foráneas sin índice en tablas preexistentes y reporta índices aún no utilizados (incluidos algunos nuevos, esperable antes de tener carga real). La advertencia de políticas SELECT múltiples en `user_roles` quedó resuelta.
- El asesor de seguridad mantiene las advertencias previas sobre `audit_editorial_unit`, `handle_new_user`, `has_role` (SECURITY DEFINER expuestas a anon/authenticated) y la protección de contraseñas filtradas deshabilitada.

## PASO 20 — Base multi-cliente y acceso por módulo

- Se aplicó la migración `20261127024022_multi_tenant_memberships_and_module_access` al proyecto Supabase `madre`.
- Se agregaron `organizations`, `organization_memberships`, `module_catalog`, `organization_modules`, `member_module_access` y `organization_access_events`, todas con RLS habilitado.
- El catálogo incluye M01–M06. M00 funciona como entrada común; no se otorga como módulo de cliente.
- Los roles globales de MADRE y los roles editoriales existentes se conservaron en `user_roles`. Cliente y Empleado se modelan como membresías dentro de una organización.
- Se agregaron funciones de autorización en el esquema no expuesto `app_private`; las funciones auxiliares no pueden ejecutarse por `anon`.
- `editorial_units.organization_id` identifica el cliente dueño y es inmutable. Las nueve unidades existentes se conservaron en la organización `MADRE interno`; las tablas hijas mantienen su relación y heredan el alcance a través de RLS de la unidad.
- Las políticas de `editorial_units` y lectura de `profiles` se ajustaron para el modelo de organización. Los hijos editoriales quedan restringidos por las políticas de acceso a su unidad.
- La verificación remota confirmó seis módulos, cero membresías/grants de cliente iniciales, nueve unidades internas y cero unidades sin organización. No se crearon clientes ni usuarios de prueba.
- Se implementó M00 en `src/modules/shell/`: después de autenticar, el catálogo muestra los módulos habilitados para la organización; admin MADRE ve el catálogo completo, el administrador de cliente ve las habilitaciones de su organización y el empleado ve solo las asignaciones recibidas. M01 abre Madre Editorial; M02–M06 muestran su estado de preparación.
- `src/shared/services/access.service.js` obtiene roles, organizaciones y permisos para construir el catálogo. Esta visibilidad acompaña las políticas RLS; no las reemplaza.
- Se agregó administración M00 para crear clientes, habilitar módulos e invitar a su administrador. Los clientes pueden invitar empleados y asignarles módulos habilitados para su organización.
- Se desplegó `invite-organization-member` con `verify_jwt` habilitado. La función valida el rol de MADRE o la membresía de administrador de cliente antes de enviar invitaciones; las claves privilegiadas permanecen en el backend.
- La migración `20261127031303_activate_invited_organization_members` habilita que los empleados reciban módulos al ser invitados y activa su membresía solo cuando el propio usuario confirma el acceso. La invitación también contempla cuentas ya existentes.
- El ingreso por enlace no crea cuentas automáticamente (`shouldCreateUser: false`); el alta comienza con una invitación administrativa.
- `npm run build` terminó correctamente tras los últimos cambios. No se ejecutó una prueba de navegador ni un flujo real con usuarios Cliente o Empleado, y todavía no se envió una invitación real.
- Antes de enviar invitaciones de producción, confirmar que el `Site URL` de Auth en Supabase apunte al sitio publicado en GitHub para que el enlace vuelva a MADRE.
- El asesor de Supabase detectó nueve claves foráneas nuevas sin índice y ocho políticas que pueden optimizar la evaluación de `auth.uid()`. La migración de optimización se rechazó y no fue aplicada; estos avisos quedan pendientes.
- Los avisos de `SECURITY DEFINER` en funciones preexistentes de `public` y la protección contra contraseñas filtradas deshabilitada permanecen sin cambios.
- Falta probar todo el circuito con cuentas reales y verificar el enlace de invitación/retorno desde el sitio publicado.
- La migración fundacional remota no existe como archivo local reproducible; este cambio es una migración incremental nueva sobre el esquema remoto vigente.
