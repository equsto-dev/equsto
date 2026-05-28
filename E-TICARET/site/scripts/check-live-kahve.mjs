const urls = [
  ["facets", "https://equsto.com/eq-dept-cm-facets.js"],
  ["plp", "https://equsto.com/eq-dept-plp.js"],
  ["kahve.html", "https://equsto.com/kahve.html"],
  ["kahve.json", "https://equsto.com/data/dept/kahve.json"],
];

for (const [name, url] of urls) {
  const r = await fetch(url);
  const t = await r.text();
  console.log("\n---", name, r.status, url);
  if (name === "facets") {
    console.log("  stripOztiLeadName:", t.includes("stripOztiLeadName"));
    console.log("  normalizeOemLabel:", t.includes("normalizeOemLabel"));
    console.log("  ATS prefix:", t.includes("'ATS'"));
  }
  if (name === "plp") {
    console.log("  oem_brand:", t.includes("oem_brand"));
    console.log("  productBrand first:", /function brandKey[\s\S]{0,200}productBrand/.test(t));
  }
  if (name === "kahve.html") {
    const fm = t.match(/eq-dept-cm-facets\.js[^"']*/);
    const pm = t.match(/eq-dept-plp\.js[^"']*/);
    console.log("  facets tag:", fm?.[0]);
    console.log("  plp tag:", pm?.[0]);
    console.log("  MARKA_BOYUT:", t.includes("MARKA_BOYUT"));
  }
  if (name === "kahve.json") {
    const j = JSON.parse(t);
    const oem = j.filter((x) => x.oem_brand).length;
    const counts = {};
    j.forEach((x) => {
      const k = x.oem_brand || "(yok)";
      counts[k] = (counts[k] || 0) + 1;
    });
    console.log("  oem_brand rows:", oem, "/", j.length);
    console.log("  counts:", counts);
  }
}
