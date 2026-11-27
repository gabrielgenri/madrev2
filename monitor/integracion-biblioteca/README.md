# Integración de Monitor en Biblioteca riojana

Este módulo agrega una vista de actualidad dentro de la Biblioteca. Lee el JSON público de MonitorV3.2, permite buscar y filtrar noticias, y prepara un borrador de contexto con el enlace original como referencia. No importa el cuerpo de una noticia como contenido enciclopédico ni cambia la publicación del Monitor.

## Archivos y fuentes

- `monitor-biblioteca.js`: módulo que se incorpora a la app de Biblioteca.
- Datos leídos: `https://gabrielgenri.github.io/Monitor/data/monitor_v3_noticias.json`.
- Esquema de fuentes: 53 sitios; 6 taxonomías; automatización y limpieza según el MonitorV3.2 adjunto.
- La app de Biblioteca mantiene su guardado editorial existente y exige revisión humana para publicar.

El catálogo de Monitor V3.2 cubre La Rioja y el JSON actual contiene las notas consolidadas, la síntesis vinculada y los archivos detectados. El puente solo consulta `notas`; no escribe datos en el repositorio de Monitor.

## Cómo se aplicaron las fuentes del Notebook

- **MonitorV1 - Arquitectura, Crawl Web, RSS y Archivos** aporta el mapa del recolector y sus tipos de contenido.
- **MonitorV1 - Catálogo JSON y Reglas** orienta la estructura del catálogo; para el panel se conserva el catálogo V3.2 (`monitor_v3_fuentes.json`) en lugar de mezclar directamente el esquema V1.
- **MonitorV2 - Cambios Aplicados y Limpieza de Procesos** respalda el catálogo de 53 sitios, la protección contra procesos colgados y la actualización tecnológica. El workflow V3.2 del ZIP conserva sus propios límites y cron.
- **README.md y `requirements.txt`** describen las rutas del proyecto y sus dependencias Python (`requests`, `beautifulsoup4`, `feedparser`, `urllib3`).
- **RSSv3** sirve como referencia para las seis taxonomías, la extracción completa y la agrupación temática. La integración usa las notas como referencias y deja las síntesis de actualidad fuera de las fichas enciclopédicas.

## Incorporar al repositorio de Biblioteca

Copiá `monitor-biblioteca.js` a `ecosistema/assets/js/biblioteca/monitor-biblioteca.js` en el repositorio de El Independiente. En `ecosistema/biblioteca/index.html`, agregá esta línea inmediatamente después del módulo existente de Biblioteca:

```html
<script type="module" src="../assets/js/biblioteca/monitor-biblioteca.js"></script>
```

Publicá el repositorio por su mecanismo habitual. El panel **Monitor** aparecerá junto a **Nueva ficha**. Si Biblioteca exige acceso editorial, la acción de preparar un borrador devuelve al usuario a su pantalla de ingreso; en modo local, se conserva el guardado que ya ofrece la Biblioteca.

## Uso editorial

1. Abrí **Monitor** y buscá por texto o taxonomía.
2. Usá **Abrir fuente original** para contrastar la información en el medio.
3. Elegí **Preparar borrador de contexto** para crear una ficha en estado borrador con título de trabajo y la referencia citada.
4. Redactá el contenido como explicación atemporal, agregá fuentes estables y completá la lista de verificación antes de solicitar revisión.

Las categorías de Monitor no coinciden completamente con las de la Biblioteca; las equivalencias son sugerencias y el borrador queda editable.

## Configuración de despliegue

El módulo consulta el endpoint público de GitHub Pages configurado en la constante `MONITOR_DATA_URL`. Si la dirección de publicación del Monitor cambia, actualizá esa constante. La respuesta del endpoint debe permitir CORS; la dirección actual fue comprobada y devuelve JSON con acceso entre sitios.

El workflow del ZIP ejecuta cuatro horarios UTC (`01, 11, 16 y 22`), equivalentes a `22:00` del día anterior y `08:00`, `13:00` y `19:00` en La Rioja. La documentación histórica de MonitorV2 describe tres ejecuciones diarias; este paquete conserva el workflow V3.2 recibido.
