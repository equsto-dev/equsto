from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")

old_fn = """function renderKonseptButtons(){
  const inner=KONSEPT_ROWS.map(r=>
    `<button type="button" class="opt tall${D.konsept===r.v?' sel':''}" data-v="${esc(r.v)}" onclick="setKonsept('${esc(r.v)}')">`+
    `<div style="font-weight:600">${r.label}</div>`+
    `<div style="font-size:11px;color:var(--muted);margin-top:3px;font-weight:400;line-height:1.35">${r.desc}</div></button>`
  ).join('');
  document.getElementById('o3').innerHTML='<div class="og tall" style="margin-top:4px">'+inner+'</div>';
}"""

new_fn = """function renderKonseptButtons(){
  const el=document.getElementById('o3');
  if(!el) return;
  const main=KONSEPT_ROWS.map(r=>
    `<button type="button" class="opt${D.konsept===r.v?' sel':''}" data-v="${esc(r.v)}" onclick="setKonsept('${esc(r.v)}')">`+
    `<span class="opt-konsept__title">${r.label}</span>`+
    `<span class="opt-konsept__desc">${r.desc}</span></button>`
  ).join('');
  const fr=
    `<button type="button" class="opt opt--franchise fr${D.konsept==='Franchise'?' sel':''}" data-v="Franchise" onclick="setKonsept('Franchise')">`+
    `<span class="opt-konsept__title">Zincir / franchise</span>`+
    `<span class="opt-konsept__desc">Hazır marka projesi (ör. fast food zinciri)</span></button>`;
  el.innerHTML=main+fr;
}"""

if old_fn not in t:
    raise SystemExit("renderKonseptButtons block not found")
t = t.replace(old_fn, new_fn, 1)

old_init = """  renderKonseptButtons();
  document.getElementById('o3fr').innerHTML=
    `<button type="button" class="opt fr${D.konsept==='Franchise'?' sel':''}" data-v="Franchise" onclick="setKonsept('Franchise')"><span style="font-weight:600">Zincir / franchise</span><div style="font-size:11px;color:var(--muted);margin-top:3px;font-weight:400">Hazır marka projesi (ör. fast food zinciri)</div></button>`;
  initTrAdres()"""

new_init = """  renderKonseptButtons();
  initTrAdres()"""

if old_init not in t:
    raise SystemExit("init block not found")
t = t.replace(old_init, new_init, 1)

p.write_text(t, encoding="utf-8")
print("patched")
