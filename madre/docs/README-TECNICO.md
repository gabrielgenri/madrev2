# MADRE — documentación técnica inicial

Este repositorio conserva el Prompt Maestro en `README.md`. Esta guía documenta la base de código incorporada en la primera integración.

## Infraestructura

- Supabase project ref: `cxuoaydhmvafsgtklwny`
- Región: `sa-east-1` (São Paulo)
- API URL: `https://cxuoaydhmvafsgtklwny.supabase.co`
- sb_publishable_NUvUPIKgOsaPli2REl7HYQ_wIZBdzaX
- supabase login
supabase init
supabase link --project-ref cxuoaydhmvafsgtklwny
- Frontend: Vite + JavaScript ES Modules
- Cliente de datos: `@supabase/supabase-js`

La clave publicable se configura localmente. Nunca colocar `service_role` ni secretos de proveedores en el navegador o en el repositorio.

## Instalación local


Configurar tu archivo de entorno

En la raíz de tu proyecto (junto a package.json), abre o crea el archivo .env.local y completa las variables así:
env
VITE_SUPABASE_URL=https://cxuoaydhmvafsgtklwny.supabase.co`
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_NUvUPIKgOsaPli2REl7HYQ_wIZBdzaX
Usa el código con precaución.

3. Puntos importantes a tener en cuenta

• Prefijo obligatorio. Vite solo expone al navegador las variables que comienzan con VITE_.
• Seguridad. Esta clave es segura para el frontend porque solo identifica el proyecto; la protección real de tus datos depende de tener activadas las políticas Row Level Security (RLS) en tus tablas. Nunca uses la clave secret o service_role en este archivo.
• Reinicio. Si ya tenías corriendo el servidor de desarrollo (npm run dev), deténlo y vuélvelo a iniciar para que Vite lea los cambios del archivo .env.local

Requisitos: Node.js 20.19+ o 22.12+.

```bash
npm install
cp .env.example .env.local
# Completar VITE_SUPABASE_PUBLISHABLE_KEY con la clave publicable del proyecto
npm run dev
```

Para compilar: `npm run build`.

## Primera funcionalidad

El módulo Madre Editorial permite autenticarse por enlace mágico, crear unidades editoriales, listarlas y editar título, resumen y contenido madre. En este incremento solo se guardan borradores. La transición a Revisado queda bloqueada hasta implementar fuentes, evidencias y checklist editorial; no se simula una aprobación.

## Estructura

- `src/app`: arranque y composición de la SPA.
- `src/core`: cliente Supabase y autenticación.
- `src/modules`: vistas independientes por módulo.
- `src/shared/services`: servicios compartidos, incluido el servicio inicial de reglas editoriales.
- `src/styles`: estilos globales.
- `supabase/migrations`: migraciones versionadas.
- `docs`: documentación de decisiones y alcance.

## Base de datos

La migración `20261114034956_madre_core_foundation.sql` está reconstruida localmente a partir de la introspección del proyecto Supabase activo. Coincide con la versión/nombre registrados en el historial remoto, pero no es una copia byte a byte del SQL original. Su incorporación al repositorio queda pendiente; no aplicar manualmente sobre el proyecto ya inicializado.

Para un entorno nuevo, revisar el SQL y aplicarlo mediante Supabase CLI o el mecanismo de migraciones del entorno. No volver a aplicar manualmente sobre el proyecto ya inicializado.

## Primer usuario administrador

1. Configurar la clave publicable y arrancar la aplicación.
2. Solicitar el enlace de acceso con el correo autorizado.
3. Tras crear la cuenta, recuperar el UUID del usuario desde Supabase Auth.
4. Asignar el rol desde SQL Editor:

```sql
insert into public.user_roles (user_id, role)
values ('UUID_DEL_USUARIO', 'admin')
on conflict do nothing;
```

## Alcance y límites

Todavía no están implementados el proxy de IA, la ingesta documental, la carga de fuentes y evidencias desde la interfaz, la verificación, los seis formatos generativos, el Editor Crítico, Biblioteca Riojana, transcripción, observatorios ni distribución. Tampoco se ha completado una prueba end-to-end contra el proyecto remoto.
