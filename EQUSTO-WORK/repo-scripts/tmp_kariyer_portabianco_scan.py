import html
import re
import ssl
import urllib.request

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

_DETAIL_LINK_RE = re.compile(
    r'<a[^>]*class="[^"]*\bdetailLink\b[^"]*\bdetailUrl\b[^"]*"[^>]*>',
    re.I,
)


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, context=ctx, timeout=30).read().decode("utf-8", "ignore")


def listings(url: str) -> list[tuple[str, str]]:
    out = []
    for m in _DETAIL_LINK_RE.finditer(fetch(url)):
        tag = m.group(0)
        hm = re.search(r"""href\s*=\s*['"]([^'"]+)['"]""", tag)
        tm = re.search(r"""title\s*=\s*['"]([^'"]*)['"]""", tag)
        if not hm:
            continue
        path = hm.group(1).strip()
        if not path.startswith("/"):
            path = "/" + path
        title = html.unescape(tm.group(1)) if tm else ""
        out.append((path, title))
    return out


def show(label: str, url: str) -> None:
    items = listings(url)
    pb_paths = [(p, t) for p, t in items if re.search(r"portabianco|portobianco", p, re.I)]
    pb_titles = [(p, t) for p, t in items if re.search(r"porta\s*bianco|portobianco", t, re.I)]
    print(label, "listings", len(items), "| path match", len(pb_paths), "| title match", len(pb_titles))
    for p, t in pb_paths[:12]:
        print("  ", p[:55], "->", t[:60])


show("marka /portabianco", "https://www.kariyermutfak.com/portabianco")
show("sogutma filter", "https://www.kariyermutfak.com/sogutma-ekipmanlari?marka=portabianco")
