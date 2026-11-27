#!/usr/bin/env python3
import hashlib
import json
import os
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit
from zoneinfo import ZoneInfo

import feedparser
import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTES_PATH = os.path.join(BASE_DIR, "data", "monitor_v3_fuentes.json")
NOTICIAS_PATH = os.path.join(BASE_DIR, "data", "monitor_v3_noticias.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 MonitorLaRioja/3.2",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
}

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "igshid", "mc_cid", "mc_eid", "ref", "source"
}

FILE_EXTS = {
    "csv", "pdf", "zip", "xls", "xlsx", "dta", "dbf", "sav", "txt",
    "rar", "docx", "shp", "json", "doc", "ods", "shape", "xlsm"
}

STOPWORDS_ES = {
    "para", "como", "pero", "sobre", "entre", "desde", "hasta", "donde",
    "cuando", "quien", "quienes", "cual", "cuales", "este", "esta", "estos",
    "estas", "aquel", "aquella", "aquellos", "aquellas", "todos", "todas",
    "todo", "toda", "otro", "otra", "otros", "otras", "mismo", "misma",
    "cada", "solo", "también", "tambien", "más", "mas", "menos", "muy",
    "rioja", "provincia", "argentina", "nuevo", "nueva"
}


def normalizar_texto(texto: str) -> str:
    if not texto:
        return ""
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", texto.lower()).strip()


def normalizar_url(url: str) -> str:
    if not url:
        return ""
    parts = urlsplit(url.strip())
    query_limpia = [
        (k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
        if k.lower() not in TRACKING_PARAMS
    ]
    path = parts.path or "/"
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/")
    return urlunsplit((
        (parts.scheme or "https").lower(),
        parts.netloc.lower(),
        path,
        urlencode(query_limpia),
        ""
    ))


def hash_contenido(titulo: str, cuerpo: str, url: str) -> str:
    base = f"{normalizar_url(url)}|{normalizar_texto(titulo)}|{normalizar_texto(cuerpo)[:500]}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()[:16]


def fetch_url(url: str, timeout: int = 18):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, verify=False, allow_redirects=True)
        return resp, resp.status_code, ""
    except requests.exceptions.Timeout:
        return None, 0, "Timeout de conexión"
    except requests.exceptions.RequestException as exc:
        return None, 0, str(exc)[:180]


def extraer_imagen_soup(soup: BeautifulSoup, base_url: str) -> str:
    for meta_attr in [
        {"property": "og:image"},
        {"name": "twitter:image"},
        {"property": "twitter:image"},
        {"itemprop": "image"},
    ]:
        tag = soup.find("meta", attrs=meta_attr)
        if tag and tag.get("content"):
            return urljoin(base_url, tag["content"].strip())

    contenedor = soup.find("article") or soup.find("main") or soup
    for img in contenedor.find_all("img", src=True):
        src = img.get("src", "").strip()
        if not src or src.startswith("data:"):
            continue
        low = src.lower()
        if any(skip in low for skip in ["logo", "icon", "sprite", "avatar", "banner-ad", "pixel"]):
            continue
        return urljoin(base_url, src)
    return ""


def extraer_cuerpo_y_copete(soup: BeautifulSoup):
    for tag in soup(["script", "style", "noscript", "nav", "header", "footer", "aside", "form", "iframe"]):
        tag.decompose()

    copete = ""
    meta_desc = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
    if meta_desc and meta_desc.get("content"):
        copete = re.sub(r"\s+", " ", meta_desc["content"]).strip()

    contenedor = soup.find("article") or soup.find("main") or soup.body or soup
    parrafos = []
    vistos = set()
    for el in contenedor.find_all(["p", "h2", "h3", "blockquote"]):
        txt = re.sub(r"\s+", " ", el.get_text(" ", strip=True))
        if len(txt) >= 35 and txt not in vistos:
            vistos.add(txt)
            parrafos.append(txt)

    cuerpo = "\n\n".join(parrafos)
    if not copete and parrafos:
        copete = parrafos[0]
    return copete, cuerpo


def detectar_archivos_soup(soup: BeautifulSoup, base_url: str, sitio: dict, extensiones_objetivo: set):
    archivos = []
    vistos = set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        full_url = urljoin(base_url, href)
        path_lower = urlsplit(full_url).path.lower()
        ext = path_lower.rsplit(".", 1)[-1] if "." in path_lower else ""
        if ext in extensiones_objetivo and ext != "html" and full_url not in vistos:
            vistos.add(full_url)
            texto = re.sub(r"\s+", " ", a.get_text(" ", strip=True)) or os.path.basename(urlsplit(full_url).path)
            archivos.append({
                "titulo": texto[:180],
                "url": full_url,
                "extension": ext.upper(),
                "fuente_id": sitio["id"],
                "fuente_nombre": sitio["nombre"],
                "categoria": sitio["categoria"]
            })
    return archivos


def clasificar_nota(titulo: str, copete: str, cuerpo: str, sitio: dict, reglas: dict, taxonomias: list):
    texto_norm = normalizar_texto(f"{titulo} {titulo} {copete} {cuerpo[:2500]}")
    puntajes = {}
    for tax in taxonomias:
        palabras = reglas.get(tax, [])
        score = 0
        for kw in palabras:
            kw_norm = normalizar_texto(kw)
            if kw_norm and re.search(rf"\b{re.escape(kw_norm)}\b", texto_norm):
                score += 1
        puntajes[tax] = score

    mejor_tax = max(puntajes, key=puntajes.get) if puntajes else "Política y Gestión"
    if puntajes.get(mejor_tax, 0) == 0:
        if sitio.get("tema_por_defecto") in taxonomias:
            mejor_tax = sitio["tema_por_defecto"]
        elif sitio["categoria"] in ("Universidades", "Centros de Investigación"):
            mejor_tax = "Ciencia, Tecnología y Educación"
        elif "boletin" in normalizar_texto(sitio["nombre"]) or "estadistica" in normalizar_texto(sitio["nombre"]):
            mejor_tax = "Normativa y Datos Oficiales"
        else:
            mejor_tax = "Política y Gestión"

    tokens = re.findall(r"[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]{4,}", f"{titulo} {copete}".lower())
    freq = Counter(t for t in tokens if normalizar_texto(t) not in STOPWORDS_ES)
    etiquetas = [w.capitalize() for w, _ in freq.most_common(6)]
    return mejor_tax, etiquetas


def procesar_feed_rss(sitio: dict, reglas: dict, taxonomias: list, extensiones_objetivo: set):
    notas = []
    archivos = []
    resp, status, err = fetch_url(sitio["url_rss"], timeout=18)
    if not resp or status >= 400:
        return notas, archivos, status, err or f"HTTP {status}"

    parsed = feedparser.parse(resp.content)
    for entry in parsed.entries[:12]:
        link = normalizar_url(entry.get("link", ""))
        titulo = re.sub(r"\s+", " ", entry.get("title", "")).strip()
        if not link or not titulo:
            continue

        fecha = entry.get("published", entry.get("updated", ""))
        resumen_raw = entry.get("summary", entry.get("description", ""))
        resumen_soup = BeautifulSoup(resumen_raw, "html.parser")
        copete = re.sub(r"\s+", " ", resumen_soup.get_text(" ", strip=True))
        cuerpo = copete
        imagen = ""

        for mc in entry.get("media_content", []) or []:
            if mc.get("url"):
                imagen = urljoin(link, mc["url"])
                break
        if not imagen:
            for mt in entry.get("media_thumbnail", []) or []:
                if mt.get("url"):
                    imagen = urljoin(link, mt["url"])
                    break
        if not imagen:
            for enc in entry.get("enclosures", []) or []:
                if enc.get("href") and "image" in enc.get("type", "image"):
                    imagen = urljoin(link, enc["href"])
                    break
        if not imagen:
            img_tag = resumen_soup.find("img", src=True)
            if img_tag:
                imagen = urljoin(link, img_tag["src"])

        art_resp, art_status, _ = fetch_url(link, timeout=14)
        if art_resp and art_status == 200 and "text/html" in art_resp.headers.get("Content-Type", ""):
            art_soup = BeautifulSoup(art_resp.text, "html.parser")
            if not imagen:
                imagen = extraer_imagen_soup(art_soup, link)
            cop_html, cue_html = extraer_cuerpo_y_copete(art_soup)
            if len(cue_html) > len(cuerpo):
                cuerpo = cue_html
            if not copete and cop_html:
                copete = cop_html
            archivos.extend(detectar_archivos_soup(art_soup, link, sitio, extensiones_objetivo))

        taxonomia, etiquetas = clasificar_nota(titulo, copete, cuerpo, sitio, reglas, taxonomias)
        notas.append({
            "id": hash_contenido(titulo, cuerpo, link),
            "titulo": titulo,
            "copete": copete,
            "cuerpo": cuerpo,
            "imagen": imagen,
            "url": link,
            "fecha": fecha,
            "fuente_id": sitio["id"],
            "fuente_nombre": sitio["nombre"],
            "categoria": sitio["categoria"],
            "localidad": sitio.get("localidad", "La Rioja"),
            "origen": "RSS",
            "taxonomia": taxonomia,
            "etiquetas": etiquetas,
        })

    return notas, archivos, status, ""


def procesar_crawl_html(sitio: dict, reglas: dict, taxonomias: list, extensiones_objetivo: set):
    notas = []
    archivos = []
    base_url = sitio["url_web"]
    resp, status, err = fetch_url(base_url, timeout=18)
    if not resp or status >= 400:
        return notas, archivos, status, err or f"HTTP {status}"

    soup = BeautifulSoup(resp.text, "html.parser")
    archivos.extend(detectar_archivos_soup(soup, base_url, sitio, extensiones_objetivo))

    dominio_base = urlsplit(base_url).netloc.lower()
    candidatos = []
    vistos = set()

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        full_url = normalizar_url(urljoin(base_url, href))
        parsed_u = urlsplit(full_url)
        if parsed_u.netloc.lower() != dominio_base:
            continue
        if full_url == normalizar_url(base_url) or full_url in vistos:
            continue
        ext = parsed_u.path.lower().rsplit(".", 1)[-1] if "." in parsed_u.path else ""
        if ext in FILE_EXTS:
            continue
        texto_link = re.sub(r"\s+", " ", a.get_text(" ", strip=True))
        if len(texto_link) >= 24 and len(parsed_u.path) > 4:
            vistos.add(full_url)
            candidatos.append((full_url, texto_link))

    for link, titulo_link in candidatos[:8]:
        art_resp, art_status, _ = fetch_url(link, timeout=14)
        if not art_resp or art_status != 200 or "text/html" not in art_resp.headers.get("Content-Type", ""):
            continue
        art_soup = BeautifulSoup(art_resp.text, "html.parser")
        h1 = art_soup.find("h1")
        titulo = re.sub(r"\s+", " ", h1.get_text(" ", strip=True)) if h1 else titulo_link
        if len(titulo) < 12:
            titulo = titulo_link
        imagen = extraer_imagen_soup(art_soup, link)
        copete, cuerpo = extraer_cuerpo_y_copete(art_soup)
        if len(cuerpo) < 80:
            continue
        archivos.extend(detectar_archivos_soup(art_soup, link, sitio, extensiones_objetivo))
        taxonomia, etiquetas = clasificar_nota(titulo, copete, cuerpo, sitio, reglas, taxonomias)
        notas.append({
            "id": hash_contenido(titulo, cuerpo, link),
            "titulo": titulo,
            "copete": copete,
            "cuerpo": cuerpo,
            "imagen": imagen,
            "url": link,
            "fecha": datetime.now(ZoneInfo("America/Argentina/La_Rioja")).strftime("%Y-%m-%d %H:%M"),
            "fuente_id": sitio["id"],
            "fuente_nombre": sitio["nombre"],
            "categoria": sitio["categoria"],
            "localidad": sitio.get("localidad", "La Rioja"),
            "origen": "Crawl HTML",
            "taxonomia": taxonomia,
            "etiquetas": etiquetas,
        })

    return notas, archivos, status, ""


def construir_contenidos_vinculados(notas: list, taxonomias: list):
    por_tax = defaultdict(list)
    for n in notas:
        por_tax[n["taxonomia"]].append(n)

    vinculados = []
    for tax in taxonomias:
        grupo = por_tax.get(tax, [])
        if not grupo:
            continue
        fuentes_unicas = list(dict.fromkeys(n["fuente_nombre"] for n in grupo))
        etiquetas_counter = Counter(et for n in grupo for et in n.get("etiquetas", []))
        top_tags = [t for t, _ in etiquetas_counter.most_common(6)]

        parrafos = []
        for item in grupo[:6]:
            resumen_item = item["copete"] or item["cuerpo"][:240]
            parrafos.append(f"• {item['fuente_nombre']}: {item['titulo']}. {resumen_item}")

        vinculados.append({
            "id": f"vinc-{hashlib.md5(tax.encode('utf-8')).hexdigest()[:10]}",
            "taxonomia": tax,
            "titulo_original": f"Síntesis cruzada · {tax} ({len(grupo)} reportes en {len(fuentes_unicas)} fuentes)",
            "copete": f"Cruce temático en La Rioja sobre {', '.join(top_tags[:4]) if top_tags else tax} a partir de {len(fuentes_unicas)} fuentes monitoreadas.",
            "cuerpo_original": "\n\n".join(parrafos),
            "fuentes_participantes": fuentes_unicas,
            "total_notas": len(grupo),
            "etiquetas": top_tags,
            "notas_relacionadas": [
                {"id": n["id"], "titulo": n["titulo"], "fuente": n["fuente_nombre"], "url": n["url"]}
                for n in grupo[:10]
            ]
        })
    return vinculados


def main():
    with open(FUENTES_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    sitios = config.get("sitios", [])
    taxonomias = config.get("taxonomias", [])
    reglas = config.get("reglas_clasificacion", {})
    extensiones_objetivo = set(e.lower() for e in config.get("extensiones_objetivo", FILE_EXTS))

    todas_notas = []
    todos_archivos = []
    ids_vistos = set()
    archivos_vistos = set()

    ahora_utc = datetime.now(timezone.utc)
    ahora_art = ahora_utc.astimezone(ZoneInfo("America/Argentina/La_Rioja"))

    fuentes_ok = 0
    fuentes_error = 0

    for sitio in sitios:
        if not sitio.get("activo", True):
            sitio["estado_ultima_corrida"] = "inactiva"
            continue

        if sitio.get("usar_rss") and sitio.get("url_rss"):
            notas_s, arch_s, status, err = procesar_feed_rss(sitio, reglas, taxonomias, extensiones_objetivo)
            if not notas_s and status >= 400:
                notas_s, arch_s, status, err = procesar_crawl_html(sitio, reglas, taxonomias, extensiones_objetivo)
        else:
            notas_s, arch_s, status, err = procesar_crawl_html(sitio, reglas, taxonomias, extensiones_objetivo)

        for n in notas_s:
            if n["id"] not in ids_vistos:
                ids_vistos.add(n["id"])
                todas_notas.append(n)

        for a in arch_s:
            if a["url"] not in archivos_vistos:
                archivos_vistos.add(a["url"])
                todos_archivos.append(a)

        ok = (status > 0 and status < 400)
        if ok:
            fuentes_ok += 1
        else:
            fuentes_error += 1

        sitio["estado_ultima_corrida"] = "ok" if ok else "error"
        sitio["http_status"] = status
        sitio["ultimo_error"] = err
        sitio["ultima_actualizacion"] = ahora_art.strftime("%Y-%m-%d %H:%M:%S ART")
        sitio["notas_recolectadas"] = len(notas_s)

    contenidos_vinculados = construir_contenidos_vinculados(todas_notas, taxonomias)

    config["actualizado"] = ahora_art.strftime("%Y-%m-%d")
    with open(FUENTES_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    salida_noticias = {
        "version": "3.2.0-monitor-v3-larioja",
        "actualizado_utc": ahora_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "actualizado_local": ahora_art.strftime("%Y-%m-%d %H:%M:%S ART"),
        "jurisdiccion": config.get("jurisdiccion", "Provincia de La Rioja, Argentina"),
        "resumen_corrida": {
            "fuentes_totales": len(sitios),
            "fuentes_activas": sum(1 for s in sitios if s.get("activo", True)),
            "fuentes_ok": fuentes_ok,
            "fuentes_error": fuentes_error,
            "notas_consolidadas": len(todas_notas),
            "contenidos_vinculados": len(contenidos_vinculados),
            "archivos_detectados": len(todos_archivos),
        },
        "notas": todas_notas,
        "contenidos_vinculados": contenidos_vinculados,
        "archivos_detectados": todos_archivos,
    }

    with open(NOTICIAS_PATH, "w", encoding="utf-8") as f:
        json.dump(salida_noticias, f, ensure_ascii=False, indent=2)

    print(f"Recolectadas {len(todas_notas)} notas, {len(contenidos_vinculados)} vínculos y {len(todos_archivos)} archivos.")


if __name__ == "__main__":
    main()
