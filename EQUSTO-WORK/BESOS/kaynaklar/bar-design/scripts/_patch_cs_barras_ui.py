# -*- coding: utf-8 -*-
import re
import shutil
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR")
PUB = ROOT / "public"
IMG = PUB / "data" / "cocktailstations-images"

NEW_HTML = """    <div id="bd-cs-intro"></div>
    <nav class="bd-cs-jump" id="bd-cs-jump" aria-label="Kategori atlama" data-i18n-attr="aria-label:besos.cs_jump_aria"></nav>
    <div id="bd-cs-board"></div>"""

NEW_CSS = """
    /* —— Cocktail Stations · barras-moviles tasarım dili —— */
    .bd-cs-seri{
      --cs-accent:#e71d9f;
      --cs-ink:#fff;
      --cs-muted:rgba(255,255,255,.78);
      --cs-bg:#141414;
      --cs-overlay:linear-gradient(105deg,rgba(0,0,0,.78) 0%,rgba(0,0,0,.42) 48%,rgba(0,0,0,.25) 100%);
      background:var(--cs-bg);
      color:var(--cs-ink);
      border-bottom:1px solid rgba(255,255,255,.08);
    }
    .bd-cs-page-title{padding:clamp(72px,10vw,120px) 24px clamp(28px,4vw,40px);max-width:1440px;margin:0 auto;border-bottom:1px solid rgba(255,255,255,.1);}
    .bd-cs-page-title .bd-cs-series-badge{display:inline-block;font-size:10px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:var(--cs-accent);margin-bottom:14px;}
    .bd-cs-page-title h2{margin:0 0 12px;font-size:clamp(32px,5vw,56px);font-weight:700;letter-spacing:.02em;line-height:1.05;text-transform:uppercase;}
    .bd-cs-page-title .bd-cs-lead{max-width:640px;margin:0 0 20px;font-size:clamp(15px,1.15vw,17px);line-height:1.65;color:var(--cs-muted);}
    .bd-cs-bc{font-size:12px;color:rgba(255,255,255,.5);}
    .bd-cs-bc a{color:rgba(255,255,255,.65);text-decoration:none;}
    .bd-cs-bc a:hover{color:var(--cs-accent);}
    .bd-cs-bc .bd-cs-bc-sep{margin:0 .5em;opacity:.45;}
    .bd-cs-toolbar{max-width:1440px;margin:0 auto;padding:16px 24px 0;display:flex;flex-wrap:wrap;gap:10px;}
    .bd-cs-toolbar .bd-cs-cta-row{display:flex;flex-wrap:wrap;gap:10px;margin:0;}
    .bd-cs-btn{display:inline-flex;align-items:center;padding:12px 22px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,.25);color:#fff;transition:background .2s,border-color .2s,color .2s;}
    .bd-cs-btn:hover{border-color:var(--cs-accent);color:var(--cs-accent);}
    .bd-cs-btn--solid{background:var(--cs-accent);border-color:var(--cs-accent);color:#fff;}
    .bd-cs-btn--solid:hover{background:#c91888;border-color:#c91888;color:#fff;}
    .bd-cs-btn--block{width:100%;max-width:420px;padding:16px 24px;margin-top:4px;}
    .bd-cs-jump{position:sticky;top:52px;z-index:25;display:flex;overflow-x:auto;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);background:rgba(20,20,20,.94);backdrop-filter:blur(12px);scrollbar-width:none;}
    .bd-cs-jump::-webkit-scrollbar{display:none;}
    .bd-cs-jump-pill{flex:0 0 auto;padding:14px 20px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;color:rgba(255,255,255,.55);border-right:1px solid rgba(255,255,255,.08);white-space:nowrap;transition:color .15s,background .15s;}
    .bd-cs-jump-pill:hover{color:#fff;background:rgba(231,29,159,.12);}
    .bd-cs-board{display:flex;flex-direction:column;}
    .bd-cs-cat-anchor{scroll-margin-top:120px;height:0;overflow:hidden;}
    .bd-cs-strip{position:relative;min-height:clamp(420px,52vh,640px);display:flex;overflow:hidden;border-bottom:1px solid rgba(0,0,0,.4);}
    .bd-cs-strip-bg{position:absolute;inset:0;background:center/cover no-repeat var(--cs-strip-bg,#1a1a1a);background-attachment:fixed;transform:scale(1.02);}
    .bd-cs-strip-bg::after{content:"";position:absolute;inset:0;background:var(--cs-overlay);}
    @media(max-width:900px){.bd-cs-strip-bg{background-attachment:scroll;}.bd-cs-strip-bg::after{background:linear-gradient(180deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,.75) 55%,rgba(0,0,0,.88) 100%);}}
    .bd-cs-strip-inner{position:relative;z-index:1;width:100%;max-width:1440px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;min-height:inherit;}
    .bd-cs-strip--left .bd-cs-strip-copy{grid-column:1;padding:clamp(48px,8vw,96px) clamp(24px,6vw,80px) clamp(48px,8vw,96px) clamp(20px,4vw,48px);}
    .bd-cs-strip--right .bd-cs-strip-copy{grid-column:2;padding:clamp(48px,8vw,96px) clamp(20px,4vw,48px) clamp(48px,8vw,96px) clamp(24px,6vw,80px);}
    .bd-cs-strip-copy{display:flex;flex-direction:column;justify-content:center;max-width:560px;}
    .bd-cs-strip-kicker{margin:0 0 12px;font-size:11px;font-weight:500;letter-spacing:.38em;text-transform:uppercase;color:#fff;}
    .bd-cs-strip-title{margin:0 0 18px;font-size:clamp(28px,4vw,42px);font-weight:700;line-height:1.05;letter-spacing:.02em;text-transform:uppercase;color:var(--cs-accent);}
    .bd-cs-strip-desc{margin:0 0 22px;font-size:clamp(14px,1.1vw,16px);line-height:1.7;color:var(--cs-muted);}
    .bd-cs-strip-feats{margin:0 0 24px;padding:0;list-style:none;font-size:13px;color:rgba(255,255,255,.7);}
    .bd-cs-strip-feats li{padding:4px 0;border-top:1px solid rgba(255,255,255,.08);}
    .bd-cs-strip-feats li:first-child{border-top:none;}
    .bd-cs-strip-dim{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.45);margin:0 0 20px;}
    .bd-cs-method{max-width:900px;margin:0 auto;padding:clamp(48px,6vw,72px) 24px;border-top:1px solid rgba(255,255,255,.1);}
    .bd-cs-method-title{margin:0 0 28px;font-size:11px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--cs-accent);}
    .bd-cs-method-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:24px;}
    .bd-cs-method-list li{display:grid;grid-template-columns:48px 1fr;gap:16px;}
    .bd-cs-method-n{font-size:12px;font-weight:700;color:rgba(255,255,255,.4);}
    .bd-cs-method-list strong{display:block;margin-bottom:6px;font-size:15px;color:#fff;}
    .bd-cs-method-list p{margin:0;font-size:14px;line-height:1.6;color:var(--cs-muted);}
    .bd-cs-error{padding:48px 24px;text-align:center;color:rgba(255,255,255,.6);}
    @media(max-width:900px){.bd-cs-strip-inner{grid-template-columns:1fr;}.bd-cs-strip--left .bd-cs-strip-copy,.bd-cs-strip--right .bd-cs-strip-copy{grid-column:1;padding:clamp(200px,45vh,280px) 24px 48px;}}
"""

MOBILE_IMGS = {
    "cs-mobile-ola.jpg": "https://cocktailstations.com/wp-content/uploads/2018/03/barras-moviles-cocktailstations-ola-2.jpg",
    "cs-mobile-ergonomic.jpg": "https://cocktailstations.com/wp-content/uploads/2018/03/barras-moviles-cocktailstations-ergonomic.jpg",
    "cs-mobile-esferic.jpg": "https://cocktailstations.com/wp-content/uploads/2018/03/barras-moviles-cocktailstations-esferic.jpg",
    "cs-mobile-straight.jpg": "https://cocktailstations.com/wp-content/uploads/2019/10/foto_album.jpg",
}


def patch_html(path: Path) -> None:
    t = path.read_text(encoding="utf-8")
    if "bd-cs-lines-wrap" in t:
        t = re.sub(
            r"<div id=\"bd-cs-intro\"></motion>\s*<div class=\"bd-cs-lines-wrap\"[^>]*></div>\s*<div class=\"bd-cs-catalog\">.*?</div>\s*(?=<div id=\"bd-cs-method\")",
            NEW_HTML + "\n    ",
            t,
            count=1,
            flags=re.S,
        )
        t = t.replace("</motion>", "</div>")
    m = re.search(r"    /\* —— Cocktail Stations.*?(?=\n  </style>)", t, re.S)
    if m:
        t = t[: m.start()] + NEW_CSS.strip() + "\n" + t[m.end() :]
    path.write_text(t, encoding="utf-8")
    print("html", path)


def download_images() -> None:
    import ssl
    import urllib.request

    IMG.mkdir(parents=True, exist_ok=True)
    ctx = ssl._create_unverified_context()
    for fn, url in MOBILE_IMGS.items():
        dest = IMG / fn
        if dest.exists() and dest.stat().st_size > 5000:
            continue
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
            dest.write_bytes(r.read())
        print("img", fn)


for html in (PUB / "bar-design.html", ROOT / "dist" / "bar-design.html", ROOT / "bar-design" / "EQUSTO-BAR-DESIGN-PAKET" / "bar-design.html"):
    if html.exists():
        patch_html(html)

download_images()

for rel in ("eq-bar-design-cocktailstations.js", "data/cocktailstations-catalogue.json", "data/cocktailstations-landing.json"):
    shutil.copy2(PUB / rel, ROOT / "dist" / rel)
shutil.copytree(IMG, ROOT / "dist" / "data" / "cocktailstations-images", dirs_exist_ok=True)
paket = ROOT / "bar-design" / "EQUSTO-BAR-DESIGN-PAKET"
shutil.copy2(PUB / "eq-bar-design-cocktailstations.js", paket / "eq-bar-design-cocktailstations.js")
shutil.copy2(PUB / "data/cocktailstations-catalogue.json", paket / "data/cocktailstations-catalogue.json")
shutil.copy2(PUB / "data/cocktailstations-landing.json", paket / "data/cocktailstations-landing.json")
shutil.copytree(IMG, paket / "data/cocktailstations-images", dirs_exist_ok=True)
print("sync done")
