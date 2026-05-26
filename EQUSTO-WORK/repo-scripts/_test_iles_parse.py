import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "scrape_iles_pisirme",
    Path(__file__).resolve().parent / "scrape-iles-pisirme.py",
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
fetch_text = mod.fetch_text
parse_product_blocks = mod.parse_product_blocks
extract_pager = mod.extract_pager

html = fetch_text("https://www.iles.com.tr/pisirme-ekipmanlari")
products = parse_product_blocks(html)
total, _, ps = extract_pager(html)
print("pager", total, ps)
print("parsed", len(products))
if products:
    print("first", products[0])
    print("last", products[-1])
