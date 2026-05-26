const items = JSON.parse(
  await import("node:fs").then((fs) => fs.readFileSync("public/data/ekipmanlar.json", "utf8"))
);

function filePart(rel) {
  return String(rel)
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^data\/images\//i, "")
    .replace(/^images\//i, "");
}

const picks = items.filter((x) => x?.images?.[0]).slice(0, 12);

for (const x of picks) {
  const fn = filePart(x.images[0]);
  const enc = fn.split("/").map((s) => encodeURIComponent(s)).join("/");
  for (const base of ["/data/images/", "/images/"]) {
    const url = "https://equsto.com" + base + enc;
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    console.log(r.status, base, fn.slice(0, 55));
  }
  console.log("---");
}
