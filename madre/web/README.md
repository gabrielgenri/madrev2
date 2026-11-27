# Madre Web

Frontend SPA de Madre construida desde cero dentro de `web/`, siguiendo el material de implementación aportado al proyecto y reutilizando el backend existente en Supabase.

## Qué incluye

- Shell editorial mobile-first.
- Arquitectura SPA modular en ES Modules.
- Unidad Editorial Madre.
- Ingesta de hecho/tema y material fuente.
- Generación local de los seis borradores: Web/SEO, Reel 60 s, Podcast Primera Hora, Carrusel de 8 placas, Newsletter y WhatsApp.
- Editor individual por formato.
- Copiar y descargar TXT.
- Historial local mediante localStorage.
- Sección de investigación y verificación.
- Sección Editor Crítico con observaciones asistidas.
- Frontera de distribución segura: WordPress solo como borrador y con autorización humana.
- Preparación para conectar Supabase mediante `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Regla de seguridad

La interfaz nunca contiene API keys de proveedores de IA. La generación real con proveedor debe pasar por las Edge Functions existentes, en particular `generate-editorial-format`/proxy seguro, según la configuración del backend.

La generación local incluida aquí es un fallback de interfaz: **no simula investigación ni verificación real** y deja explícito que requiere control editorial.

## Desarrollo

```bash
cd web
npm install
npm run dev
```

## Producción

```bash
npm run build
```

El resultado queda en `web/dist`.

## Variables opcionales

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

No colocar `OPENAI_API_KEY`, Gemini u otras claves secretas en estas variables del frontend.

## Decisiones editoriales incorporadas

- Una información, una base editorial, seis formas de comunicar.
- No inventar datos, citas, fuentes ni documentos.
- Mantener atribución e incertidumbre.
- Una marca `[VERIFICAR]` impide considerar una pieza revisada.
- La IA asiste; la responsabilidad editorial sigue siendo humana.
- La regeneración no debe destruir ediciones humanas.
- Los seis formatos derivan de la misma unidad y versión madre.

## Evolución prevista

La siguiente integración puede conectar esta SPA con las tablas y RPC existentes de Madre Editorial, versionado, calidad, revisión/aprobación, notificaciones y dashboard, sin crear infraestructura paralela.
