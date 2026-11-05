#!/usr/bin/env python3
"""
Gastrotech görsellerini çok kaynaktan en iyi kaliteyle güncelle (Scotsman-benzeri).

Kaynak önceliği (kısa kenar px):
  1) Demasan buyuk (~1024–1200)
  2) Gustomarkt -B (brand=gastrotech|gtech zorunlu)
  3) Antmutfak -B (vital|gtech|gastrotech)
  4) gastrotech.com.tr resmi API media
  5) Mevcut PDF extract (yalnızca normalize) — kaynak yoksa

Sadece brand=Gastrotech / id gastrotech__* güncellenir.

  python scripts/enrich-gastrotech-best-images.py
  python scripts/enrich-gastrotech-best-images.py --limit 40
"""
from __future__ import annotations

import argparse
import io
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DEPT = ROOT / "public" / "data" / "dept"
OUT_DIR = ROOT / "public" / "images" / "catalog" / "gastrotech" / "web"
DATA = ROOT / "scripts" / "data" / "gastrotech"
REPORT = DATA / "best-image-enrich-report.json"
OFFICIAL_CACHE = DATA / "official-variant-media.json"
DEMASAN_CACHE = DATA / "demasan-gt-media.json"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
TARGET = 1000
MIN_ACCEPT = 400  # dealer/official kısa kenar eşiği


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def fetch_text(url: str) -> str | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
        with urllib.request.urlopen(req, timeout=45) as r:
            return r.read().decode("utf-8", "replace")
    except Exception:
        return None


def fetch_bin(url: str) -> bytes | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*,*/*"})
        with urllib.request.urlopen(req, timeout=90) as r:
            data = r.read()
            ctype = (r.headers.get("Content-Type") or "").lower()
            if "svg" in ctype or len(data) < 4000:
                return None
            return data
    except Exception:
        return None


def dims(data: bytes) -> tuple[int, int] | None:
    try:
        im = Image.open(io.BytesIO(data))
        return im.size
    except Exception:
        return None


def corner_brightness(data: bytes) -> float | None:
    """Mean corner luminance 0–255; ~0 = black studio bg, ~255 = white e-com bg."""
    try:
        im = Image.open(io.BytesIO(data)).convert("RGB")
        w, h = im.size
        pts = [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]
        vals = [sum(im.getpixel(p)) / 3 for p in pts]
        return sum(vals) / len(vals)
    except Exception:
        return None


def normalize(data: bytes) -> bytes | None:
    try:
        im = Image.open(io.BytesIO(data))
        im = ImageOps.exif_transpose(im)
        if im.mode in ("RGBA", "LA"):
            bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
            bg.alpha_composite(im.convert("RGBA"))
            im = bg.convert("RGB")
        elif im.mode != "RGB":
            im = im.convert("RGB")
        gray = im.convert("L")
        bw = gray.point(lambda x: 0 if x < 248 else 255)
        bbox = ImageOps.invert(bw).getbbox()
        if bbox:
            x0, y0, x1, y1 = bbox
            pad = 10
            box = (
                max(0, x0 - pad),
                max(0, y0 - pad),
                min(im.width, x1 + pad),
                min(im.height, y1 + pad),
            )
            if (box[2] - box[0]) * (box[3] - box[1]) > 0.15 * im.width * im.height:
                im = im.crop(box)
        im.thumbnail((TARGET - 48, TARGET - 48), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (TARGET, TARGET), (255, 255, 255))
        canvas.paste(im, ((TARGET - im.width) // 2, (TARGET - im.height) // 2))
        canvas = canvas.filter(ImageFilter.UnsharpMask(radius=1.1, percent=55, threshold=3))
        out = io.BytesIO()
        canvas.save(out, format="JPEG", quality=90, optimize=True)
        return out.getvalue()
    except Exception:
        return None


def brand_ok(url: str) -> bool:
    u = url.lower()
    return any(b in u for b in ("gastrotech", "gtech", "vital"))


def upgrade_b(url: str) -> list[str]:
    m = re.search(r"^(.*-)[KOB](\.(?:jpe?g|png|webp))$", url, re.I)
    if not m:
        return [url]
    stem, ext = m.group(1), m.group(2)
    return [f"{stem}{s}{ext}" for s in ("B", "O", "K")]


def load_official() -> dict[str, dict]:
    if not OFFICIAL_CACHE.exists():
        return {}
    return json.loads(OFFICIAL_CACHE.read_text(encoding="utf-8"))


def build_demasan_map(force: bool = False) -> dict[str, dict]:
    if DEMASAN_CACHE.exists() and not force:
        return json.loads(DEMASAN_CACHE.read_text(encoding="utf-8"))
    sm = fetch_text("https://www.demasan.com/sitemap/products/0.xml") or ""
    locs = [
        u
        for u in re.findall(r"<loc>([^<]+)</loc>", sm)
        if "gastrotech" in u.lower() or re.search(r"/gtech-", u, re.I)
    ]
    print(f"[demasan] product urls={len(locs)}")
    out: dict[str, dict] = {}
    for i, page in enumerate(locs, 1):
        if page.rstrip("/").endswith("/gastrotech"):
            continue
        html = fetch_text(page)
        if not html:
            continue
        imgs = re.findall(
            r"https://static\.ticimax\.cloud/32902/[Uu]ploads/[Uu]run[Rr]esimleri/buyuk/[^\"'\s<>]+",
            html,
        )
        imgs = list(dict.fromkeys(imgs))
        if not imgs:
            continue
        # model from slug: gastrotech-gko9010-...
        slug = page.rstrip("/").split("/")[-1]
        mm = re.search(r"(?:gastrotech|gtech)-([a-z0-9]+)", slug, re.I)
        model = mm.group(1).upper() if mm else ""
        # better: title
        t = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
        title = t.group(1) if t else ""
        tm = re.search(
            r"\b([A-Z]{2,5}\d{3,4}[A-Z0-9]*)\b",
            title.upper(),
        )
        if tm:
            model = tm.group(1)
        if not model:
            continue
        key = norm(model)
        out[key] = {"model": model, "url": imgs[0], "page": page, "source": "demasan"}
        if i % 20 == 0:
            print(f"  demasan {i}/{len(locs)} mapped={len(out)}")
        time.sleep(0.2)
    DEMASAN_CACHE.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[demasan] mapped={len(out)}")
    return out


def search_dealer(model: str, host: str, search_path: str) -> dict | None:
    model_n = norm(model)
    if len(model_n) < 4:
        return None
    url = f"https://{host}{search_path}{urllib.parse.quote(model)}"
    html = fetch_text(url)
    if not html:
        return None
    imgs = re.findall(
        r'https?://[^"\'\s<>]+-\d+-\d+-[KOB]\.(?:jpe?g|png|webp)',
        html,
        re.I,
    )
    # relative
    for m in re.finditer(
        r'/(?:gastrotech|gtech|vital)[^"\'\s<>]+-\d+-\d+-[KOB]\.(?:jpe?g|png|webp)',
        html,
        re.I,
    ):
        imgs.append(urllib.parse.urljoin(f"https://{host}/", m.group(0)))
    cands = []
    for u in imgs:
        if model_n not in norm(u):
            continue
        if not brand_ok(u):
            continue
        cands.append(u)
    if not cands:
        # PDP links
        links = []
        for m in re.finditer(r'href=["\']([^"\']+)["\']', html, re.I):
            href = m.group(1)
            if model_n in norm(href) and "arama" not in href.lower():
                links.append(urllib.parse.urljoin(f"https://{host}/", href))
        for link in links[:2]:
            pdp = fetch_text(link)
            if not pdp:
                continue
            for u in re.findall(
                r'https?://[^"\'\s<>]+-\d+-\d+-[KOB]\.(?:jpe?g|png|webp)',
                pdp,
                re.I,
            ):
                if model_n in norm(u) and brand_ok(u):
                    cands.append(u)
            time.sleep(0.15)
    if not cands:
        return None
    # try B first
    for u in cands:
        for cand in upgrade_b(u):
            data = fetch_bin(cand)
            if not data:
                continue
            d = dims(data)
            if not d:
                continue
            return {
                "url": cand,
                "data": data,
                "w": d[0],
                "h": d[1],
                "source": host,
                "short": min(d),
            }
    return None


def candidate_from_url(url: str, source: str, *, allow_black: bool = False) -> dict | None:
    data = fetch_bin(url)
    if not data:
        return None
    d = dims(data)
    if not d:
        return None
    bright = corner_brightness(data)
    if bright is not None and bright < 35 and not allow_black:
        # Official CMS sometimes links black-studio shots under wrong model names
        return None
    return {
        "url": url,
        "data": data,
        "w": d[0],
        "h": d[1],
        "source": source,
        "short": min(d),
        "bright": bright,
    }


def local_pdf_path(row: dict) -> Path | None:
    img = (row.get("images") or [None])[0] or row.get("image")
    if not img:
        return None
    # if already web, try original pdf from image map
    p = ROOT / "public" / str(img).lstrip("/")
    if p.exists() and "/web/" not in str(img).replace("\\", "/"):
        return p
    return None


def load_products() -> list[dict]:
    out = []
    for f in sorted(DEPT.glob("*.json")):
        rows = json.loads(f.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            continue
        for row in rows:
            rid = str(row.get("id") or "")
            brand = str(row.get("brand") or "").lower()
            if not (rid.startswith("gastrotech__") or brand == "gastrotech"):
                continue
            model = row.get("gastrotech_model") or row.get("model") or row.get("sku")
            if not model:
                continue
            out.append({"file": f.name, "id": rid, "model": str(model).strip(), "row": row})
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--refresh-demasan", action="store_true")
    ap.add_argument("--resume", action="store_true")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)

    official = load_official()
    demasan = build_demasan_map(force=args.refresh_demasan)
    products = load_products()
    imap_raw = json.loads((DATA / "gastrotech-image-map.json").read_text(encoding="utf-8")).get(
        "images", {}
    )
    imap_norm = {norm(k): v for k, v in imap_raw.items()}
    print(
        f"[best] products={len(products)} official={len(official)} demasan={len(demasan)}"
    )

    dept_cache: dict[str, list] = {}

    def get_dept(name: str) -> list:
        if name not in dept_cache:
            dept_cache[name] = json.loads((DEPT / name).read_text(encoding="utf-8"))
        return dept_cache[name]

    report = {
        "ok": [],
        "keep_pdf": [],
        "miss": [],
        "at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    done = set()
    if args.resume and REPORT.exists():
        prev = json.loads(REPORT.read_text(encoding="utf-8"))
        report["ok"] = list(prev.get("ok") or [])
        done = {norm(x["model"]) for x in report["ok"]}
        print(f"[best] resume skip={len(done)}")

    todo = products[: args.limit] if args.limit else products

    def save_dept() -> None:
        import shutil

        for name, rs in list(dept_cache.items()):
            target = DEPT / name
            tmp = DEPT / f"{name}.new-gt-best"
            payload = json.dumps(rs, ensure_ascii=False, indent=2) + "\n"
            tmp.write_text(payload, encoding="utf-8")
            ok = False
            for attempt in range(12):
                try:
                    shutil.copyfile(tmp, target)
                    ok = True
                    break
                except (PermissionError, OSError):
                    time.sleep(0.5 * (attempt + 1))
            if not ok:
                alt = DEPT / f"{name}.pending-gt-best.json"
                shutil.copyfile(tmp, alt)
                print(f"  WARN locked {name} → wrote {alt.name}")
            try:
                tmp.unlink(missing_ok=True)
            except Exception:
                pass

    for i, item in enumerate(todo, 1):
        model = item["model"]
        key = norm(model)
        if key in done:
            continue
        print(f"[{i}/{len(todo)}] {model}…", end=" ", flush=True)
        cands: list[dict] = []

        # Prefer known hi-res official dims without re-download when possible
        if key in demasan:
            hit = candidate_from_url(demasan[key]["url"], "demasan")
            if hit:
                cands.append(hit)

        if key in official:
            meta = official[key]
            urls = []
            for c in meta.get("candidates") or []:
                if c.get("url"):
                    urls.append(c["url"])
            if meta.get("url"):
                urls.insert(0, meta["url"])
            # unique preserve order
            seen_u = set()
            for u in urls:
                if u in seen_u:
                    continue
                seen_u.add(u)
                # skip known-tiny candidate metadata when present
                hit = candidate_from_url(u, "official")
                if hit and hit["short"] >= 350:
                    cands.append(hit)
                    if hit["short"] >= 1000:
                        break

        best_short = max((c["short"] for c in cands), default=0)
        need_dealer = best_short < 700
        if need_dealer:
            for host, path in (
                ("www.gustomarkt.com", "/arama?q="),
                ("www.antmutfak.com", "/arama?q="),
            ):
                hit = search_dealer(model, host, path)
                if hit:
                    cands.append(hit)
                    if hit["short"] >= 900:
                        break
                time.sleep(0.1)

        rows = get_dept(item["file"])
        row = next((r for r in rows if r.get("id") == item["id"]), None)
        pdf_short = 0
        pdf_path = None
        existing_web = None
        if row:
            img = (row.get("images") or [None])[0] or row.get("image")
            img_s = str(img or "").replace("\\", "/")
            if img and "/web/" not in img_s:
                pdf_path = ROOT / "public" / str(img).lstrip("/")
            if key in imap_norm:
                pdf_path = pdf_path or (ROOT / "public" / imap_norm[key]["path"])
            if img and "/web/" in img_s:
                existing_web = ROOT / "public" / str(img).lstrip("/")
            if pdf_path and pdf_path.exists():
                try:
                    im = Image.open(pdf_path)
                    pdf_short = min(im.size)
                except Exception:
                    pdf_short = 0

        best = max(cands, key=lambda c: c["short"]) if cands else None

        def apply_bytes(raw: bytes, source: str, url: str | None = None, short: int = 0) -> bool:
            out = normalize(raw)
            if not out:
                return False
            slug = re.sub(r"[^a-z0-9]+", "-", model.lower()).strip("-")
            rel = f"images/catalog/gastrotech/web/{slug}.jpg"
            (OUT_DIR / f"{slug}.jpg").write_bytes(out)
            if row:
                row["images"] = [rel]
                row["image"] = rel
                row["gastrotech_image"] = rel
                row["gastrotech_image_source"] = source
                if url:
                    row["gastrotech_image_url"] = url
            report["ok"].append(
                {"model": model, "source": source, "short": short, "rel": rel, "url": url}
            )
            print(f"OK {source} {short}px → {len(out)}B")
            return True

        # Accept web image if clearly better / large enough
        accept = False
        if best:
            long_side = max(best["w"], best["h"])
            if best["short"] >= 800 or long_side >= 900:
                accept = True
            elif best["short"] >= MIN_ACCEPT and best["short"] >= pdf_short * 0.75:
                accept = True
            elif best["short"] > pdf_short + 40:
                accept = True
            # Prefer brand dealer photo even if similar px to soft PDF
            elif best["source"] != "official" and best["short"] >= MIN_ACCEPT:
                accept = True

        if accept and best:
            if not apply_bytes(best["data"], best["source"], best["url"], best["short"]):
                print("NORM_FAIL")
                report["miss"].append(model)
        elif pdf_path and pdf_path.exists():
            # Normalize PDF onto white square for PLP consistency when no better web
            if apply_bytes(pdf_path.read_bytes(), "pdf-normalize", None, pdf_short):
                report.setdefault("pdf_norm", [])
            else:
                print(f"KEEP_PDF {pdf_short}px")
                report["keep_pdf"].append({"model": model, "pdf": pdf_short})
        elif existing_web and existing_web.exists():
            print(f"KEEP_WEB {existing_web.name}")
            report["ok"].append(
                {
                    "model": model,
                    "source": "keep-web",
                    "short": 0,
                    "rel": str(row.get("image")),
                }
            )
        else:
            print("MISS")
            report["miss"].append(model)
            continue

        done.add(key)
        if i % 20 == 0:
            save_dept()
            REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        time.sleep(0.08)

    save_dept()
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"[best] ok={len(report['ok'])} keep_pdf={len(report['keep_pdf'])} miss={len(report['miss'])}"
    )


if __name__ == "__main__":
    main()
