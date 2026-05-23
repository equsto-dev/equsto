#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""cocktailstations.com — WP REST + workstations parse → TR katalog."""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "public" / "data"
IMG = OUT / "cocktailstations-images"
BASE = "https://cocktailstations.com"
CTX = ssl._create_unverified_context()
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0"}

# ── İspanyolca → Türkçe (ürün / site) ─────────────────────────────────────────
TR: dict[str, str] = {
    "WORKSTATIONS": "Çalışma İstasyonları",
    "WorkStations": "Çalışma İstasyonları",
    "workstation": "çalışma istasyonu",
    "Workstation": "Çalışma istasyonu",
    "BASIC 1.0": "Basic 1.0",
    "BASIC 2.0": "Basic 2.0",
    "BASIC PLUS": "Basic Plus",
    "BASIC PLUS 2.0": "Basic Plus 2.0",
    "PRO 1.0": "Pro 1.0",
    "PRO 2.0": "Pro 2.0",
    "MODELOS BASIC 1.0": "Basic 1.0 Modelleri",
    "MODELOS BASIC 2.0": "Basic 2.0 Modelleri",
    "MODELOS BASIC PLUS": "Basic Plus Modelleri",
    "MODELOS BASIC PLUS 2.0": "Basic Plus 2.0 Modelleri",
    "MODELOS PRO 1.0": "Pro 1.0 Modelleri",
    "MODELOS PRO 2.0": "Pro 2.0 Modelleri",
    "BARRAS MÓVILES": "Mobil Barlar",
    "PORTABLE BAR": "Sökülebilir Bar (Portable Bar)",
    "ESTACIONES A MEDIDA": "Özel Ölçü İstasyonlar",
    "ICE BLOCK MACHINE": "Buz Blok Makinesi",
    "MINI": "Mini",
    "INDIVIDUAL": "Tek Kişilik",
    "DOBLE": "Çift",
    "speed rail": "hızlı şişe rafı",
    "Speed rail": "Hızlı şişe rafı",
    "gastronorm": "gastronorm",
    "mise en place": "mise en place (ön hazırlık)",
    "cutting board": "kesim tahtası",
    "tabla de corte": "kesim tahtası",
    "waste": "atık",
    "basura": "atık haznesi",
    "sink": "evye",
    "fregadero": "evye",
    "ice": "buz",
    "hielo": "buz",
    "shaker": "shaker",
    "extendable faucet": "uzatılabilir musluk",
    "grifo extensible": "uzatılabilir musluk",
    "stainless steel": "paslanmaz çelik",
    "cocktail": "kokteyl",
    "coctelería": "kokteyl barı",
    "barra coctelera": "kokteyl barı",
    "barman": "barmen",
    "Cocktail Stations": "Cocktail Stations",
    "EMPRESA": "Şirket",
    "METODOLOGÍA": "Metodoloji",
    "ERGONOMÍA & TRABAJO": "Ergonomi ve Çalışma",
    "CONTACTA": "İletişim",
    "PRENSA": "Basın",
    "MULTIMEDIA": "Multimedya",
    "Album Barra Straight": "Düz Bar Albümü",
    "Album barra ergonomic": "Ergonomik Bar Albümü",
    "Album barra esferic": "Küresel Bar Albümü",
    "Album barra ola": "Dalga Bar Albümü",
}


def tr(s: str) -> str:
    if not s:
        return s
    out = unescape(s)
    for k, v in sorted(TR.items(), key=lambda x: -len(x[0])):
        out = re.sub(re.escape(k), v, out, flags=re.I)
    # uzun paragraflar — elle
    manual = {
        "Una workstation (estación de trabajo) es el sistema más eficaz,limpio y rápido para la utilización de todos los elementos y productos que utiliza el barman en una barra coctelera.":
        "Çalışma istasyonu, barmenin kokteyl barında kullandığı tüm ekipman ve ürünleri en verimli, temiz ve hızlı şekilde organize eden sistemdir.",
        "Se trata de una estación de coctelería básica pero a la vez muy funcional ya que nos permite tener muy bien organizado todos los productos del servicio. Dispone de una zona para cubetas gastronorm, espacio para el hielo aislado térmicamente, speed rail para botellas.":
        "Servis ürünlerini düzenli tutan, gastronorm kova alanı, termal yalıtımlı buz bölmesi ve şişe hızlı rafı (speed rail) sunan temel ama son derece işlevsel bir kokteyl istasyonudur.",
        "En el modelo 2.0 ofrecemos un mejorado diseño además del doble speed rail y el novedoso sistema de cuba totalmente configurable en 4 modos de trabajo distintos.":
        "2.0 modelinde geliştirilmiş tasarım, çift speed rail ve dört farklı çalışma modunda yapılandırılabilen yenilikçi cuba sistemi sunulur.",
        "Estación de cocktail profesional sin juntas ni ranuras con cubeta de hielo , cubetas de medidas gastronorm, speedrail, tabla de corte extraíble y orificio para desperdicios con rampas laterales. Interior de barra con gran optimización del espacio y muy preparada para ofrecer un eficaz servicio de todo tipo de cócteles.":
        "Eklemesiz ve yarsız profesyonel kokteyl istasyonu: buz kovası, gastronorm ölçülü kaplar, speed rail, çıkarılabilir kesim tahtası ve yan rampalı atık ağzı. İç hacim optimize edilmiş; her türlü kokteyl servisi için hazırlanmıştır.",
        "Siguiendo con la funcionalidad de los modelos Basic 2.0 en esta estación de trabajo hemos añadido el plus de la tabla de corte y la basura ideal para la mise en place.":
        "Basic 2.0 işlevselliğine kesim tahtası ve mise en place için ideal atık bölmesi eklenmiş çalışma istasyonudur.",
        "Una workstation de las más completas ya que aquí ya añadimos el fregadero con grifo extensible y con lava shaker incorporado sin perder la tabla de corte y la basura.":
        "Uzatılabilir musluklu evye, entegre shaker yıkayıcı, kesim tahtası ve atık bölmesiyle en kapsamlı çalışma istasyonlarından biridir.",
        "Disponible modelo MINI, INDIVIDUAL y DOBLE.":
        "Mini, tek kişilik (Individual) ve çift (Doble) boy seçenekleri mevcuttur.",
        "Su diseño exterior de la 2.0, su anexo de lava-utensilios y su sistema de cuba configurable en 4 modos la posicionan como la reina de las workstations.":
        "2.0 dış tasarımı, araç-gereç yıkama ünitesi ve dört modlu yapılandırılabilir cuba sistemiyle çalışma istasyonları arasında öne çıkar.",
        "Es una división de nuestra empresa de más de 40 años dedicada a la fabricación, instalación y mantenimiento de muebles y maquinaria para la hostelería en Barcelona. Diseñamos y fabricamos barras de coctelería a medida y comercializamos algunas de las mejores estaciones móviles. Portable bar, estaciones a medida, barras móviles, workstations.":
        "Barselona merkezli, 40 yılı aşkın süredir gastronomi mobilya ve makine imalatı, montaj ve bakımı yapan şirketimizin bir bölümüdür. Özel kokteyl barları tasarlayıp üretir; portable bar, özel istasyonlar, mobil barlar ve çalışma istasyonlarını sunarız.",
        "¿Por qué CocktailStations y no una barra convencional?":
        "Neden klasik bir bar değil de Cocktail Stations?",
    }
    for k, v in manual.items():
        if k in out:
            out = out.replace(k, v)
    return out.strip()


def wp_get(path: str) -> list | dict:
    url = f"{BASE}/wp-json/wp/v2/{path}"
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=90, context=CTX) as r:
        return json.loads(r.read().decode())


def strip_html(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.I)
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)
    text = re.sub(r"</p>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    return unescape(text).strip()


def slugify(s: str) -> str:
    s = s.lower().strip()
    for a, b in ("ı", "i"), ("ğ", "g"), ("ü", "u"), ("ş", "s"), ("ö", "o"), ("ç", "c"):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-") or "urun"


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 800:
        return True
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
            data = r.read()
        if len(data) < 300:
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return True
    except (urllib.error.URLError, OSError):
        return False


def first_img_from_html(html: str) -> str:
    m = re.search(r'background-image:\s*url\(([^)]+)\)', html)
    if m:
        u = m.group(1).strip("'\"")
        if u.startswith("http"):
            return u
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I)
    if m:
        u = m.group(1)
        return u if u.startswith("http") else BASE + u
    return ""


def parse_workstations_models(html: str) -> list[dict]:
    """Tek sayfadaki MODELOS bloklarını ayır."""
    models = []
    blocks = re.split(
        r"<h2[^>]*>\s*<span[^>]*>\s*MODELOS\s+([^<]+)</span>\s*</h2>",
        html,
        flags=re.I,
    )
    # blocks[0] junk, then pairs name, content
    i = 1
    while i + 1 < len(blocks):
        name_raw = unescape(blocks[i]).strip()
        chunk = blocks[i + 1]
        i += 2
        paras = re.findall(
            r'<p[^>]*>\s*<span[^>]*>([\s\S]*?)</span>\s*</p>',
            chunk,
            flags=re.I,
        )
        desc = "\n".join(strip_html(p) for p in paras if strip_html(p))
        bg = first_img_from_html(chunk)
        code = name_raw.replace("MODELOS ", "").strip()
        slug = slugify("cs-" + code)
        models.append(
            {
                "code": code,
                "slug": slug,
                "nameEn": code,
                "name": tr(code),
                "descriptionEn": desc,
                "description": tr(desc),
                "category": "Çalışma İstasyonu",
                "heroUrl": bg,
                "sourceUrl": BASE + "/workstations/",
            }
        )
    return models


def page_to_product(p: dict, category: str) -> dict:
    html = p.get("content", {}).get("rendered", "") or ""
    title = unescape(p["title"]["rendered"])
    slug = p["slug"]
    excerpt = strip_html(p.get("excerpt", {}).get("rendered", "") or "")
    body = strip_html(html)
    desc = excerpt or body[:600]
    feat = []
    for li in re.findall(r"<li[^>]*>([\s\S]*?)</li>", html, re.I):
        t = strip_html(li)
        if 3 < len(t) < 180:
            feat.append(t)
    img = ""
    if p.get("featured_media"):
        try:
            med = wp_get(f"media/{p['featured_media']}")
            img = med.get("source_url", "")
        except urllib.error.URLError:
            pass
    if not img:
        img = first_img_from_html(html)
    return {
        "slug": slugify("cs-" + slug),
        "category": category,
        "nameEn": title,
        "name": tr(title),
        "descriptionEn": desc,
        "description": tr(desc),
        "featuresEn": feat[:15],
        "features": [tr(f) for f in feat[:15]],
        "totalDimensionsMm": "",
        "heroUrl": img,
        "sourceUrl": p["link"],
    }


CAT_MAP = {
    "workstation": "Çalışma İstasyonu",
    "workstations": "Çalışma İstasyonu",
    "barra-desmontable": "Sökülebilir Bar",
    "barras-moviles": "Mobil Bar",
    "estaciones-a-medida": "Özel Ölçü",
    "ice-block": "Buz Makinesi",
    "album-barra": "Bar Formları",
    "ergonomia": "Ergonomi",
    "empresa": "Kurumsal",
    "metodologia": "Metodoloji",
    "contacta": "İletişim",
    "multimedia": "Multimedya",
    "prensa": "Basın",
}


def guess_category(slug: str) -> str:
    for k, v in CAT_MAP.items():
        if k in slug:
            return v
    return "Cocktail Stations"


SKIP_SLUGS = {
    "aviso-legal",
    "politica-de",
    "declaracion-de",
    "faq-preguntas",
    "mi-cuenta",
    "carrito",
    "finalizar-compra",
    "tienda",
    "restaurant-home",
    "comedrinkwithus",
    "2018",
}


def main() -> None:
    products: list[dict] = []
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Workstations sayfası — 6 model
    req = urllib.request.Request(BASE + "/workstations/", headers=UA)
    with urllib.request.urlopen(req, timeout=90, context=CTX) as r:
        ws_html = r.read().decode("utf-8", errors="replace")
    products.extend(parse_workstations_models(ws_html))

    # WP sayfaları
    pages = wp_get("pages?per_page=100")
    for p in pages:
        slug = p["slug"]
        if any(s in slug for s in SKIP_SLUGS):
            continue
        if slug == "workstations":
            continue
        if slug.startswith("workstation-"):
            continue  # özet sayfalar; ana modeller workstations'tan
        cat = guess_category(slug)
        if cat in ("Kurumsal", "Metodoloji", "İletişim", "Basın", "Multimedya"):
            continue
        prod = page_to_product(p, cat)
        if prod["name"] and len(prod["description"]) > 20:
            products.append(prod)

    # Pro varyantları (workstations metninden)
    for base, code in [("Pro 1.0", "pro-1-0"), ("Pro 2.0", "pro-2-0")]:
        parent = next((m for m in products if code.replace("-", " ") in m.get("code", "").lower().replace(" ", "-") or code in m.get("slug", "")), None)
        if not parent:
            parent = next((m for m in products if code.split("-")[0] in m.get("slug", "")), None)
        desc_en = parent["descriptionEn"] if parent else ""
        desc_tr = parent["description"] if parent else ""
        for variant in ("MINI", "INDIVIDUAL", "DOBLE"):
            products.append(
                {
                    "code": f"{base} {variant}",
                    "slug": slugify(f"cs-{base}-{variant}"),
                    "nameEn": f"{base} {variant}",
                    "name": tr(f"{base} {variant}"),
                    "descriptionEn": desc_en,
                    "description": desc_tr,
                    "category": "Çalışma İstasyonu — Pro",
                    "heroUrl": parent.get("heroUrl", "") if parent else "",
                    "sourceUrl": BASE + "/workstations/",
                    "variant": variant,
                }
            )

    # dedupe slug
    seen: set[str] = set()
    uniq = []
    for p in products:
        if p["slug"] in seen:
            continue
        seen.add(p["slug"])
        uniq.append(p)
    products = uniq

    IMG.mkdir(parents=True, exist_ok=True)
    for p in products:
        url = p.pop("heroUrl", "") or ""
        if url:
            ext = Path(urllib.parse.urlparse(url).path).suffix.split("?")[0] or ".jpg"
            fn = p["slug"] + ext
            dest = IMG / fn
            if download(url, dest):
                p["image"] = f"cocktailstations-images/{fn}"
            time.sleep(0.15)

    home = next((x for x in pages if x["slug"] in ("restaurant-home",)), None)
    home_html = home["content"]["rendered"] if home else ""

    landing = {
        "source": "cocktailstations.com",
        "scrapedAt": ts,
        "brand": "Cocktail Stations",
        "brandTr": "Cocktail Stations",
        "seriesKey": "cocktail-stations-yeni-seri",
        "seriesLabel": "Yeni Seri",
        "seriesLabelEn": "New Series",
        "hero": {
            "kicker": "Besos × Cocktail Stations",
            "kickerEn": "Besos × Cocktail Stations",
            "title": "Kokteyl Çalışma İstasyonları",
            "titleEn": "Cocktail Workstations",
            "lead": tr(
                "Barselona merkezli Cocktail Stations; portable bar, mobil bar, özel ölçü istasyon ve çalışma istasyonları (Basic, Plus, Pro) portföyünü Besos Yeni Seri olarak sunuyoruz."
            ),
            "leadEn": "Barcelona-based Cocktail Stations — portable bars, mobile bars, custom stations and Basic / Plus / Pro workstations, presented on Besos as our new series.",
            "ctaCatalog": "Kataloğu incele",
            "ctaCatalogEn": "Browse catalog",
            "ctaProjectHref": "pfos.html",
            "ctaProject": "Proje teklifi al",
            "ctaProjectEn": "Request project quote",
        },
        "stats": [
            {"value": "40+", "label": "Yıl deneyim", "labelEn": "Years experience"},
            {"value": "6", "label": "Workstation serisi", "labelEn": "Workstation lines"},
            {"value": "3", "label": "Pro boy seçeneği", "labelEn": "Pro size options"},
        ],
        "lines": [
            {"key": "basic", "title": "Basic", "titleTr": "Basic Serisi", "blurb": "Giriş ve 2.0 — speed rail ve cuba sistemi.", "blurbEn": "Entry and 2.0 lines with speed rail and cuba system."},
            {"key": "plus", "title": "Basic Plus", "titleTr": "Basic Plus", "blurb": "Kesim tahtası ve atık ile profesyonel mise en place.", "blurbEn": "Cutting board and waste chute for mise en place."},
            {"key": "pro", "title": "Pro", "titleTr": "Pro Serisi", "blurb": "Evye, shaker yıkama ve 2.0 cuba — Mini / Individual / Doble.", "blurbEn": "Sink, rinser and 2.0 cuba — Mini / Individual / Double."},
        ],
        "pdfCatalogUrl": "https://drive.google.com/file/d/1GL1UqqkzODqPWX9UA-sP1RwxQ_pENRAL/view?usp=sharing",
        "sourceUrl": BASE + "/",
    }

    catalogue = {
        "source": "cocktailstations.com",
        "scrapedAt": ts,
        "series": "cocktail-stations-yeni-seri",
        "count": len(products),
        "products": [
            {
                "slug": p["slug"],
                "category": p.get("category", "Cocktail Stations"),
                "code": p.get("code"),
                "name": p["name"],
                "nameEn": p.get("nameEn", p["name"]),
                "description": p.get("description", ""),
                "descriptionEn": p.get("descriptionEn", ""),
                "features": p.get("features", []),
                "featuresEn": p.get("featuresEn", []),
                "totalDimensionsMm": p.get("totalDimensionsMm", ""),
                "image": p.get("image", ""),
                "sourceUrl": p.get("sourceUrl", ""),
                "variant": p.get("variant"),
            }
            for p in products
        ],
    }

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "cocktailstations-catalogue.json").write_text(
        json.dumps(catalogue, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (OUT / "cocktailstations-landing.json").write_text(
        json.dumps(landing, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"OK — {len(products)} products → {OUT / 'cocktailstations-catalogue.json'}")


if __name__ == "__main__":
    main()
