# MonitorV3.2 · La Rioja

Recolector y visor web de noticias y documentos de fuentes riojanas. Esta carpeta corresponde a la versión incluida en `monitor-v3.2-larioja-v2.zip`.

## Contenido

- `index.html`: interfaz web con búsqueda, fuentes, contenidos vinculados y taxonomías.
- `data/monitor_v3_fuentes.json`: catálogo de 53 sitios y reglas.
- `data/monitor_v3_noticias.json`: noticias consolidadas, contenidos vinculados y archivos.
- `scripts/monitor_v3_recolector.py`: recolector RSS/Atom y rastreo web.
- `.github/workflows/monitor-v3-larioja.yml`: automatización del recolector.
- `ayuda/`: web paralela con instrucciones de implementación y uso.
- `integracion-biblioteca/`: módulo para consultar Monitor desde Biblioteca riojana.

## Ejecución

Instalá las dependencias con `pip install -r requirements.txt` y ejecutá `python scripts/monitor_v3_recolector.py`. Para ver la interfaz, serví esta carpeta con un servidor HTTP. El workflow requiere ubicarse en `.github/workflows/` de la raíz del repositorio que lo ejecuta y ajustar las rutas si MONITOR vive en una subcarpeta.

El workflow adjunto configura límite de 15 minutos por trabajo, 12 minutos para el recolector y limpieza final de procesos. Su cron actual ejecuta a las 01, 11, 16 y 22 UTC (22:00 del día anterior y 08:00, 13:00 y 19:00 ART). El documento de MonitorV2 usado como referencia describe tres ejecuciones diarias; se conserva el horario de la versión V3.2 del ZIP.

## Integración con Biblioteca riojana

El módulo de `integracion-biblioteca/` ofrece un panel de actualidad dentro de Biblioteca. Las noticias sirven como referencias de investigación para fichas atemporales; el puente no publica ni importa automáticamente su contenido como ficha. Consultá su [guía de instalación y uso](integracion-biblioteca/README.md) y la [ayuda del Monitor](ayuda/).
