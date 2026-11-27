# Tutorial de implementación — Madre Web

Este documento consolida la implementación de la aplicación web en `web/` con los criterios acumulados del proyecto.

## 1. Principio de arquitectura

Madre no se trata como un generador aislado de textos. La aplicación web es la capa de presentación de un ecosistema editorial modular.

```
SHELL
  ├── navegación
  ├── identidad visual
  └── estado global

CORE / SHARED (backend existente)
  ├── Supabase Auth
  ├── servicios editoriales
  ├── versionado
  ├── calidad
  ├── revisión
  ├── notificaciones
  └── dashboard

WEB
  ├── Madre Editorial
  ├── Investigación
  ├── Seis formatos
  ├── Biblioteca
  ├── Editor Crítico
  └── Distribución
```

Regla: no crear infraestructura paralela ni duplicar lógica de negocio. La SPA debe consumir los servicios y contratos ya definidos por el proyecto.

## 2. Flujo editorial

```
Entrada
  ↓
Unidad Editorial
  ↓
Fuentes
  ↓
Afirmaciones
  ↓
Evidencias
  ↓
Verificación
  ↓
Contenido Madre
  ↓
┌────────┬────────┬────────┬────────┬──────────┐
Web     Reel    Podcast  Carrusel Newsletter WhatsApp
  ↓
Control de calidad
  ↓
Editor Crítico
  ↓
Revisión humana
  ↓
Autorización
  ↓
Distribución
```

La regla central es:

> Una información, una base editorial, seis formas de comunicar.

## 3. Seis formatos obligatorios

La interfaz trabaja exactamente con:

1. Artículo Web / SEO.
2. Guion de Video / Reel de 60 segundos.
3. Podcast «Primera Hora».
4. Carrusel de Instagram de exactamente ocho placas.
5. Newsletter.
6. WhatsApp.

Cada salida se edita por separado. Una edición humana de un formato no debe sobrescribir los otros.

## 4. Seguridad

El frontend puede manejar interfaz, navegación, formularios, edición, consultas autorizadas y exportaciones locales.

Nunca debe manejar secretos de proveedores.

```
Frontend
   ↓
Servicio de IA
   ↓
Supabase Edge Function
   ↓
Proveedor
```

Las claves de OpenAI/Gemini/otros proveedores permanecen en secretos del backend.

La interfaz tampoco puede convertir por sí sola una pieza en `revisado` o `publicado`. La base y el backend deben imponer las reglas.

## 5. Editor Crítico

El módulo debe actuar como segunda instancia de control y producir observaciones sobre:

- sesgos potenciales;
- afirmaciones sin respaldo;
- problemas de atribución;
- riesgos legales potenciales;
- fechas o nombres dudosos;
- contradicciones;
- información pendiente;
- diferencias entre formatos.

No modifica silenciosamente, no aprueba y no publica.

## 6. Distribución

La integración con WordPress debe conservar la frontera de seguridad definida por el proyecto:

- pieza en estado revisado;
- ausencia de `[VERIFICAR]`;
- rol editor/admin;
- confirmación humana;
- backend como punto de control;
- destino WordPress fijado en borrador.

## 7. Puesta en marcha

```bash
cd web
npm install
npm run dev
```

Para validar producción:

```bash
npm run build
```

## 8. Conexión con Supabase

Definir únicamente variables públicas del cliente:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

No introducir secretos de IA.

La SPA queda preparada para usar el Supabase existente y las tablas/RPC del ecosistema. La generación local incluida en esta primera entrega es un fallback de interfaz: no simula una investigación real ni una verificación real.

## 9. Persistencia local

El historial de esta primera entrega usa `localStorage` para permitir reutilización inmediata y funcionamiento independiente del backend.

Cuando se conecte la persistencia editorial definitiva, debe priorizarse el servicio compartido y la base Supabase existentes, conservando localStorage como recuperación de borradores cuando resulte apropiado.

## 10. Checklist antes de considerar producción

- [ ] `npm run build` exitoso.
- [ ] Navegación probada en móvil y escritorio.
- [ ] Supabase conectado con una sesión autenticada real.
- [ ] CRUD de Unidad Editorial probado.
- [ ] Fuentes → afirmaciones → evidencias → verificación probado.
- [ ] Roles writer/collaborator/reviewer/editor/admin probados.
- [ ] Versionado y restauración probados.
- [ ] Seis formatos vinculados a la versión madre.
- [ ] Control de calidad ejecutado.
- [ ] Editor Crítico probado sin mutación automática.
- [ ] Revisión/aprobación humana probada.
- [ ] Distribución WordPress comprobada como borrador.
- [ ] RLS verificado desde cliente autenticado.
- [ ] Sin claves secretas en el frontend.
- [ ] Pruebas end-to-end ejecutadas.

## 11. Regla de cierre

Una integración no se considera terminada solo porque exista el código.

Debe ser implementable, testeable y desplegable sin romper los módulos existentes.

La IA es un componente de Madre. No es Madre.
