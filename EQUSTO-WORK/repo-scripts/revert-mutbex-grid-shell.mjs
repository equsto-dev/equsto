import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(root, "public", "eq-category-shell.js");
let s = fs.readFileSync(p, "utf8");

const blockStart = s.indexOf("    if (state.useMutbexGrid) {");
const blockEnd = s.indexOf("    var clearBtn = root.querySelector", blockStart);
if (blockStart >= 0 && blockEnd > blockStart) {
  s = s.slice(0, blockStart) + s.slice(blockEnd);
}

s = s.replace(
  /    function renderBreadcrumb\(\) \{[\s\S]*?    function renderCatalogBar\(\) \{/,
  "    function renderCatalogBar() {"
);
s = s.replace(
  /    function renderProductGrid\(\) \{[\s\S]*?    function renderTiles\(\) \{/,
  "    function renderTiles() {"
);

s = s.replace(
  /    function renderAll\(\) \{[\s\S]*?    function renderTiles\(\) \{/,
  `    function renderAll() {
      renderMobileParentBar();
      renderTiles();
      renderBrands();
      renderCatalogBar();
      renderSidebarFilters();
      renderFeatured();
      renderNewIn();
      renderSubList();
    }

    function renderTiles() {`
);

s = s.replace(
  /      if \(!state\.useMutbexGrid\) initDeptMxHero\(\);\s*\n\s*renderBreadcrumb\(\);\s*\n\s*renderAll\(\);/,
  "      initDeptMxHero();\n      renderAll();"
);

s = s.replace(
  /        if \(state\.useMutbexGrid\) \{\s*\n\s*countEl\.innerHTML[\s\S]*?\} else \{\s*\n\s*countEl\.textContent[\s\S]*?\}\s*\n/,
  "        countEl.textContent = n ? n + ' ürün' : 'Ürün yok';\n"
);

s = s.replace(
  /\s*var sortSelect = root\.querySelector\('#eq-cat-sort-select'\);[\s\S]*?sortSelect\.value = state\.sortKey \|\| '';\s*\n\s*\}\n/,
  "\n"
);

s = s.replace(
  /      var code = \(u\.raw && \(u\.raw\.code \|\| u\.raw\.supplier_code \|\| u\.raw\.sku\)\) \|\| '';\s*\n\s*if \(state\.useMutbexGrid\) \{[\s\S]*?\}\s*\n\s*return \(/,
  "      return ("
);

s = s.replace(/      if \(state\.useMutbexGrid\) return;\n/g, "");
s = s.replace(
  /if \(state\.useMutbexGrid \|\| state\.hideBrandStrip\)/,
  "if (state.hideBrandStrip)"
);

fs.writeFileSync(p, s);
const left = (s.match(/useMutbexGrid/g) || []).length;
console.log("[revert-mutbex-grid-shell] done, useMutbexGrid refs:", left);
