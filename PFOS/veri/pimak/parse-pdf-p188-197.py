# -*- coding: utf-8 -*-
"""PDF s.188-197 PIMAK mutfak ekipmanları → ürün JSON."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = ROOT.parent.parent.parent / "E-TICARET" / "site"
import importlib.util

from pimak_pdf_blocks import pair_codes_prices_block, collect_codes_before_anchor

spec = importlib.util.spec_from_file_location(
    "sync_pimak_fiyat_pdf", SITE / "scripts" / "sync-pimak-fiyat-pdf.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

TXT = ROOT / "_pdf-p188-197.txt"
OUT = ROOT / "p188-197-products.json"
IMG_DIR = ROOT / "media" / "pdf-p188-197"
IMG_MANIFEST = ROOT / "p188-197-prod-images.json"

PIMAK_LINE = re.compile(r"^P[Iİi]MAK\.[0-9A-Za-z.]+$", re.I)
DIM_LINE = re.compile(r"^(\d{3,4})\s*[xX×*]\s*(\d{3,4})\s*[xX×*]\s*(\d{3,4})$")
PRICE_LINE = mod.PRICE_LINE
SKIP = {
    "Ürün Kodu", "Product Code", "Fiyat", "Price", "Ebat (mm)", "Dimensions (mm)",
    "Ağırlık (Kg.)", "Weight (Kg.)", "Mutfak Ekipmanları", "Kitchen Equipments",
    "Çarpma Kapı", "Temel Özellikler", "Basic Features",
}

_orig_is_code = mod.is_code


def is_code(line: str) -> bool:
    s = line.strip()
    if PIMAK_LINE.match(s):
        return True
    if re.fullmatch(r"DR\d{2}-[\d.]+", s, re.I):
        return True
    if re.fullmatch(r"TB\d{2}-[\d.]+", s, re.I):
        return True
    if re.fullmatch(r"MR\d{2}(?:-[\d.]+)+", s, re.I):
        return True
    return _orig_is_code(line)


_PLACEHOLDER_CODE = re.compile(r"^M0\d{2}T?$", re.I)


def is_product_code(line: str) -> bool:
    s = norm_kod(line)
    if _PLACEHOLDER_CODE.match(s):
        return False
    if s in {"KOD", "CODE"}:
        return False
    return is_code(line)


mod.is_code = is_code


def norm_kod(k: str) -> str:
    return re.sub(r"\s+", "", k).replace("İ", "I").replace("i", "I").upper()


def slugify(s: str) -> str:
    t = (
        s.lower()
        .replace("ı", "i")
        .replace("ğ", "g")
        .replace("ü", "u")
        .replace("ş", "s")
        .replace("ö", "o")
        .replace("ç", "c")
        .replace("İ", "i")
    )
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:72] or "urun"


def decode_dims_from_code(code: str) -> tuple[str, dict | None]:
    """PIMAK.WWDD.suffix veya PIMAK.WWDDD.suffix → mm ölçü."""
    m = re.match(r"^PIMAK\.(\d+)\.", code, re.I)
    if not m:
        return "", None
    mid = m.group(1)
    h = 850
    if len(mid) == 5:
        w, d = int(mid[0:2]) * 100, int(mid[2:4]) * 100
        if code.endswith(".52") or ".55." in code:
            h = 550
        if int(mid[2:]) >= 150:
            h = 500
    elif len(mid) == 4:
        w, d = int(mid[0:2]) * 100, int(mid[2:4]) * 100
    else:
        return "", None
    dim = f"{w}x{d}x{h}"
    return dim, {
        "olcu_etiket": f"{w}×{d}×{h} mm",
        "olculer": {"genislik_mm": w, "derinlik_mm": d, "yukseklik_mm": h},
    }


FAMILY_HINT = re.compile(
    r"tezgah|lavabo|dolap|raf|mermer|bulaşık|tabak|çöp|depolama|bench|sink|cabinet|shelf|marble|dish|trolley|hareketli",
    re.I,
)


def family_title_before(lines: list[str], anchor: int) -> str:
    best = ""
    for j in range(anchor - 1, max(anchor - 120, -1), -1):
        ln = lines[j].strip()
        if not ln or ln in SKIP:
            continue
        if re.fullmatch(r"\d{1,3}(?:\.\d+)?", ln.replace(",", ".")):
            continue
        if DIM_LINE.match(ln.replace(" ", "").replace("*", "x")):
            continue
        if PRICE_LINE.match(ln):
            continue
        if is_code(ln):
            continue
        if ln in {"Mutfak Ekipmanları", "Kitchen Equipments", "Çarpma Kapı"}:
            continue
        if len(ln) < 8:
            continue
        if "|" in ln or FAMILY_HINT.search(ln):
            return ln
        if not best:
            best = ln
    return best or "Çalışma Tezgahı"


def collect_features(page_lines: list[str]) -> list[str]:
    feats = []
    for i, ln in enumerate(page_lines):
        if ln.strip() in {"Temel Özellikler", "Basic Features"}:
            for j in range(i + 1, min(i + 12, len(page_lines))):
                t = page_lines[j].strip()
                if not t or t in SKIP or "Teknik" in t:
                    break
                if t.startswith("•"):
                    t = t.lstrip("• ").strip()
                if len(t) > 6:
                    feats.append(t)
            break
    return feats


def normalize_ligatures(s: str) -> str:
    return (
        s.replace("\ufb02", "fl")
        .replace("\ufb01", "fi")
        .replace("\ufb00", "ff")
        .replace("\ufb03", "ffi")
        .replace("\ufb04", "ffl")
    )


def _family_match(a: str, b: str) -> bool:
    a = normalize_ligatures(a).lower().strip()
    b = normalize_ligatures(b).lower().strip()
    if not a or not b:
        return False
    short = min(len(a), len(b), 18)
    return a[:short] in b or b[:short] in a


def load_img_manifest() -> dict:
    if not IMG_MANIFEST.exists():
        return {}
    return json.loads(IMG_MANIFEST.read_text(encoding="utf-8"))


def pick_image(page: int, family: str, family_idx: int, manifest: dict) -> str | None:
    page_data = manifest.get(str(page), {})
    imgs = page_data.get("images") or []
    if imgs:
        fam_name = normalize_ligatures(family.split("|")[0].strip())
        fy = None
        for fam in page_data.get("families") or []:
            if _family_match(fam_name, fam.get("name", "")):
                fy = fam.get("y")
                break
        chosen = None
        if fy is not None:
            for im in sorted(imgs, key=lambda x: x["y"]):
                if im["y"] >= fy - 50:
                    chosen = im
                    break
        if not chosen:
            chosen = imgs[min(family_idx, len(imgs) - 1)]
        return chosen.get("path")

    if not IMG_DIR.exists():
        return None
    cands = sorted(IMG_DIR.glob(f"p{page:03d}-img*.png"), key=lambda p: p.stat().st_size, reverse=True)
    big = [p for p in cands if p.stat().st_size > 8000] or cands
    if not big:
        return None
    idx = min(family_idx, len(big) - 1)
    return str(big[idx].relative_to(ROOT)).replace("\\", "/")


def map_category(family: str, code: str) -> str:
    f = normalize_ligatures(family).lower()
    if "davlumbaz" in f or "hood" in f:
        if "orta" in f:
            if "filtreli" in f:
                return "orta-tip-filtreli-davlumbaz"
            if "filtresiz" in f:
                return "orta-tip-filtresiz-davlumbaz"
            return "orta-tip-davlumbaz"
        if "duvar" in f:
            if "filtreli" in f:
                return "duvar-tipi-filtreli-davlumbaz"
            if "filtresiz" in f:
                return "duvar-tipi-filtresiz-davlumbaz"
            return "duvar-tipi-davlumbaz"
        return "duvar-tipi-davlumbaz"
    if "lavabo" in f or "sink" in f or "evye" in f:
        return "evyeler"
    if "tabak" in f and "ısıt" in f:
        return "tabak-isitma-dolabi"
    if "bulaşık" in f or "dish" in f or "düzenleme" in f:
        return "bulasik-alma-unitesi"
    if "çöp" in f or "waste" in f:
        return "cop-kovasi-unitesi"
    if "raf" in f or "shelf" in f or "depolama" in f:
        return "depolama-raflari"
    if "mermer" in f or "marble" in f:
        return "mermer-tabla-tezgah"
    if "hareketli" in f or "trolley" in f:
        return "hareketli-tezgah"
    if "dolap" in f or "cabinet" in f:
        return "dolapli-calisma-tezgahi"
    if "çekmece" in f or "drawer" in f:
        return "cekmeceli-tezgah"
    if "set altı" in f or "under counter" in f:
        return "set-alti-tezgah"
    if re.match(r"^(DR|TB|MR)", code):
        return "moduler-depolama"
    return "calisma-tezgahi"


def family_for_code(page: int, code: str, family: str) -> str:
    family = normalize_ligatures(family.split("|")[0].strip())
    if page == 195:
        if code.endswith(".10"):
            return "Orta Tip Filtreli Davlumbaz"
        if code.endswith(".00"):
            return "Orta Tip Filtresiz Davlumbaz"
    if page == 196:
        if code.endswith(".11"):
            return "Duvar Tipi Filtresiz Davlumbaz"
        if code.endswith(".01"):
            return "Duvar Tipi Filtreli Davlumbaz"
    return family


def parse_page_195(body: str, manifest: dict) -> list[dict]:
    """s.195 — PDF metin sırası karışık; kolonları kod sonekiyle eşle."""
    lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
    dims: list[tuple[int, int, int]] = []
    prices: list[float] = []
    codes_10: list[str] = []
    codes_00: list[str] = []

    for ln in lines:
        s = ln.replace(" ", "").replace("*", "x")
        m = DIM_LINE.match(s)
        if m:
            dims.append((int(m.group(1)), int(m.group(2)), int(m.group(3))))
            continue
        if PIMAK_LINE.match(ln):
            k = norm_kod(ln)
            if k.endswith(".10"):
                codes_10.append(k)
            elif k.endswith(".00"):
                codes_00.append(k)
            continue
        pm = PRICE_LINE.match(ln)
        if pm:
            prices.append(mod.parse_eur(pm.group(1)))

    products: list[dict] = []
    n10 = len(codes_10)
    n00 = len(codes_00)
    if n10 != len(prices[:n10]) or n10 != len(dims[:n10]):
        print(f"[warn] p195 filtreli uyumsuz: kod={n10} fiyat={len(prices[:n10])} ebat={len(dims[:n10])}")

    def add_row(code: str, price: float, dim_t: tuple[int, int, int], family: str) -> None:
        w, d, h = dim_t
        dim = f"{w}x{d}x{h}"
        olcu = {
            "olcu_etiket": f"{w}×{d}×{h} mm",
            "olculer": {"genislik_mm": w, "derinlik_mm": d, "yukseklik_mm": h},
        }
        name = f"{family} {olcu['olcu_etiket']}"
        products.append({
            "urun_kodu": code,
            "slug": slugify(f"equsto-{code}"),
            "baslik": name,
            "aile": family,
            "aile_slug": slugify(family),
            "category": map_category(family, code),
            "pdf_page": 195,
            "liste_fiyati_eur": price,
            "ebat_mm": dim,
            **olcu,
            "temel_ozellikler": [],
            "gorsel_yerel": pick_image(195, family, 0 if "Filtreli" in family else 1, manifest),
        })

    for i, code in enumerate(codes_10):
        add_row(code, prices[i], dims[i], "Orta Tip Filtreli Davlumbaz")

    off = n10
    for i, code in enumerate(codes_00):
        add_row(code, prices[off + i], dims[off + i], "Orta Tip Filtresiz Davlumbaz")

    return products


BLOCK_PAGES = frozenset(range(188, 195)) | {197}


def _dims_from_block(lines: list[str], fiyat_idx: int) -> list[tuple[int, int, int]]:
    dims: list[tuple[int, int, int]] = []
    k = fiyat_idx - 1
    while k >= 0:
        if lines[k] in {"Dimensions (mm)", "Ebat (mm)", "Dim. (mm)"}:
            break
        s = lines[k].replace(" ", "").replace("*", "x")
        m = DIM_LINE.match(s)
        if m:
            dims.insert(0, (int(m.group(1)), int(m.group(2)), int(m.group(3))))
        k -= 1
    return dims


def _decode_pimak_compact(code: str, dims: list[tuple[int, int, int]], idx: int) -> tuple[str, dict | None]:
    """PIMAK.2810060 gibi noktasız kodlar veya blok ebat listesi."""
    dim, olcu = decode_dims_from_code(code)
    if dim:
        return dim, olcu
    m = re.match(r"^PIMAK\.(\d{7})$", code, re.I)
    if m:
        mid = m.group(1)
        w, d, h = int(mid[0:2]) * 100, int(mid[2:4]) * 100, int(mid[4:7])
        dim = f"{w}x{d}x{h}"
        return dim, {
            "olcu_etiket": f"{w}×{d}×{h} mm",
            "olculer": {"genislik_mm": w, "derinlik_mm": d, "yukseklik_mm": h},
        }
    if idx < len(dims):
        w, d, h = dims[idx]
        dim = f"{w}x{d}x{h}"
        return dim, {
            "olcu_etiket": f"{w}×{d}×{h} mm",
            "olculer": {"genislik_mm": w, "derinlik_mm": d, "yukseklik_mm": h},
        }
    return "", None


def parse_page_blocks(
    page: int, body: str, manifest: dict, families_seen: dict
) -> list[dict]:
    """Çoklu tablo sayfaları — her Ürün Kodu bloğu kendi Fiyat kolonu ile eşleşir."""
    lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
    features = collect_features(lines)
    anchors = [i for i, ln in enumerate(lines) if ln in {"Ürün Kodu", "Product Code"}]
    products: list[dict] = []

    for anchor in anchors:
        codes = collect_codes_before_anchor(lines, anchor, is_product_code, norm_kod)
        if not codes:
            continue

        fiyat_idx, prices = pair_codes_prices_block(lines, anchor, codes, PRICE_LINE, mod.parse_eur)
        if fiyat_idx is None or not prices:
            continue

        if len(prices) != len(codes):
            print(
                f"[warn] p{page} blok: kod={len(codes)} fiyat={len(prices)} "
                f"({codes[0]}…{codes[-1]})"
            )
            n = min(len(codes), len(prices))
            codes, prices = codes[:n], prices[:n]

        block_dims = _dims_from_block(lines, fiyat_idx)

        family = "Çalışma Tezgahı"
        k = fiyat_idx - 1
        while k >= 0:
            pm = PRICE_LINE.match(lines[k])
            if pm:
                k -= 1
                continue
            if lines[k] in {"Dimensions (mm)", "Ebat (mm)", "Dim. (mm)", "Fiyat", "Price"}:
                k -= 1
                continue
            s = normalize_ligatures(lines[k])
            if "|" in s and re.search(r"[ğüşıöçĞÜŞİÖÇa-zA-Z]", s):
                family = s.split("|")[0].strip()
                break
            if FAMILY_HINT.search(s) and len(s) > 12 and re.search(r"[ğüşıöçĞÜŞİÖÇ]", s):
                family = s
                break
            k -= 1

        fam_key = (page, family[:40])
        if fam_key not in families_seen:
            families_seen[fam_key] = len(families_seen)
        fidx = families_seen[fam_key]

        for i, (code, price) in enumerate(zip(codes, prices)):
            code_n = norm_kod(code)
            fam = family_for_code(page, code_n, family)
            dim, olcu = _decode_pimak_compact(code_n, block_dims, i)
            if not dim:
                for ln in lines[max(0, anchor - 40) : anchor + 5]:
                    s = ln.replace(" ", "").replace("*", "x")
                    m = DIM_LINE.match(s)
                    if m:
                        w, d, h = int(m.group(1)), int(m.group(2)), int(m.group(3))
                        dim = f"{w}x{d}x{h}"
                        olcu = {
                            "olcu_etiket": f"{w}×{d}×{h} mm",
                            "olculer": {
                                "genislik_mm": w,
                                "derinlik_mm": d,
                                "yukseklik_mm": h,
                            },
                        }
                        break
            if page == 196 and dim:
                parts = dim.split("x")
                if len(parts) == 3:
                    w, d = int(parts[0]), int(parts[1])
                    dim = f"{w}x{d}x500"
                    olcu = {
                        "olcu_etiket": f"{w}×{d}×500 mm",
                        "olculer": {"genislik_mm": w, "derinlik_mm": d, "yukseklik_mm": 500},
                    }
            name = normalize_ligatures(fam.split("|")[0].strip())
            if dim:
                name = f"{name} {dim.replace('x', '×')} mm"
            row = {
                "urun_kodu": code_n,
                "slug": slugify(f"equsto-{code_n}"),
                "baslik": name,
                "aile": fam,
                "aile_slug": slugify(fam),
                "category": map_category(fam, code_n),
                "pdf_page": page,
                "liste_fiyati_eur": price,
                "ebat_mm": dim or "",
                "temel_ozellikler": features,
                "gorsel_yerel": pick_image(page, fam, fidx, manifest),
            }
            if olcu:
                row.update(olcu)
            products.append(row)

    return products


def parse_page(page: int, body: str, families_seen: dict, manifest: dict) -> list[dict]:
    lines = [ln.rstrip() for ln in body.splitlines()]
    features = collect_features(lines)
    pairs = mod.extract_pairs_from_page(body)
    # kod → fiyat
    price_map = {norm_kod(c): p for c, p in pairs}

    # her kod için aile başlığı bul (en yakın Ürün Kodu anchor)
    code_anchors: dict[str, int] = {}
    for i, ln in enumerate(lines):
        if is_code(ln):
            code_anchors[norm_kod(ln)] = i

    products = []
    family_idx_by_anchor: dict[int, int] = {}
    anchor_counter = 0

    for i, ln in enumerate(lines):
        if ln.strip() not in {"Ürün Kodu", "Product Code"}:
            continue
        if i not in family_idx_by_anchor.values():
            family_idx_by_anchor[i] = anchor_counter
            anchor_counter += 1

    # sayfa boyunca blok başlığı → kodlar
    code_to_family: dict[str, str] = {}
    current_family = "Çalışma Tezgahı"
    for i, ln in enumerate(lines):
        s = ln.strip()
        if "|" in s and len(s) > 12 and not is_code(s) and s not in SKIP:
            tr = s.split("|")[0].strip()
            if re.search(r"[ğüşıöçĞÜŞİÖÇ]", tr):
                current_family = tr
        elif FAMILY_HINT.search(s) and len(s) > 12 and not is_code(s):
            if re.search(r"[ğüşıöçĞÜŞİÖÇ]", s):
                current_family = s
        if s not in {"Ürün Kodu", "Product Code"}:
            continue
        codes_before = []
        j = i - 1
        while j >= 0 and lines[j].strip() in SKIP:
            j -= 1
        while j >= 0 and is_code(lines[j]):
            codes_before.insert(0, norm_kod(lines[j]))
            j -= 1
        for c in codes_before:
            code_to_family[c] = current_family

    for code_raw, price in pairs:
        code = norm_kod(code_raw)
        family = code_to_family.get(code) or family_title_before(
            lines, code_anchors.get(code, 0)
        )
        family = family_for_code(page, code, family)
        fam_key = (page, family.split("|")[0].strip()[:40])
        if fam_key not in families_seen:
            families_seen[fam_key] = len(families_seen)
        fidx = families_seen[fam_key]

        dim, olcu = decode_dims_from_code(code)
        if page == 196 and dim:
            parts = dim.split("x")
            if len(parts) == 3:
                w, d = int(parts[0]), int(parts[1])
                dim = f"{w}x{d}x500"
                olcu = {
                    "olcu_etiket": f"{w}×{d}×500 mm",
                    "olculer": {"genislik_mm": w, "derinlik_mm": d, "yukseklik_mm": 500},
                }
        pos = code_anchors.get(code, 0)
        # DR/TB/MR kodları için metinden ebat ara
        if not dim:
            for ln in lines[max(0, pos - 30) : pos + 30]:
                s = ln.strip().replace(" ", "").replace("*", "x")
                m = DIM_LINE.match(s)
                if m:
                    w, d, h = int(m.group(1)), int(m.group(2)), int(m.group(3))
                    dim = f"{w}x{d}x{h}"
                    olcu = {
                        "olcu_etiket": f"{w}×{d}×{h} mm",
                        "olculer": {"genislik_mm": w, "derinlik_mm": d, "yukseklik_mm": h},
                    }
                    break

        name = normalize_ligatures(family.split("|")[0].strip())
        if dim:
            name = f"{name} {dim.replace('x', '×')} mm"
        slug = slugify(f"equsto-{code}")
        cat = map_category(family, code)
        products.append({
            "urun_kodu": code,
            "slug": slug,
            "baslik": name,
            "aile": family,
            "aile_slug": slugify(normalize_ligatures(family.split("|")[0])),
            "category": cat,
            "pdf_page": page,
            "liste_fiyati_eur": price,
            "ebat_mm": dim,
            **(olcu or {}),
            "temel_ozellikler": features,
            "gorsel_yerel": pick_image(page, family, fidx, manifest),
        })
    return products


def main():
    manifest = load_img_manifest()
    raw = TXT.read_text(encoding="utf-8")
    chunks = re.split(r"=== PAGE (\d+) ===", raw)
    all_by_code: dict[str, dict] = {}
    families_seen: dict = {}

    for page_s, body in zip(chunks[1::2], chunks[2::2]):
        page = int(page_s)
        if page < 188 or page > 197:
            continue
        if page == 195:
            parsed = parse_page_195(body, manifest)
        elif page in BLOCK_PAGES:
            parsed = parse_page_blocks(page, body, manifest, families_seen)
        else:
            parsed = parse_page(page, body, families_seen, manifest)
        for p in parsed:
            all_by_code[p["urun_kodu"]] = p

    OUT.write_text(json.dumps(list(all_by_code.values()), ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[parse-p188-197] {len(all_by_code)} urun -> {OUT.name}")


if __name__ == "__main__":
    main()
