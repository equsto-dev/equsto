# -*- coding: utf-8 -*-
import re
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")

new_fn = r"""function renderS4d_menu(){
  D.menu=D.menu||[];
  document.getElementById('s4d-title').textContent='Menü tipi';
  const bd=document.getElementById('s4d-bd');
  bd.innerHTML=`
    <div class="fl">Birden fazla seçebilirsiniz</motion>
    <div class="cg" id="s4d-menu-opts">${MENU.map((m,i)=>`
      <label class="co${D.menu.includes(m)?' sel':''}" data-menu-idx="${i}">
        <input type="checkbox" ${D.menu.includes(m)?'checked':''} tabindex="-1"> ${m}
      </label>`).join('')}</div>
    <div class="ar"><button type="button" class="btn gold" onclick="menuBitti()">Devam et →</button></div>`;
  bd.querySelector('#s4d-menu-opts').addEventListener('click',function(e){
    const lab=e.target.closest('label[data-menu-idx]');
    if(!lab) return;
    e.preventDefault();
    toggleMenu(MENU[+lab.getAttribute('data-menu-idx')],lab);
  });
}"""

new_fn = new_fn.replace("<motion", "<div").replace("</motion>", "</div>")

t2, n = re.subn(
    r"function renderS4d_menu\(\)\{[\s\S]*?\n\}\nfunction toggleMenu",
    new_fn + "\nfunction toggleMenu",
    t,
    count=1,
)
if n != 1:
    raise SystemExit("renderS4d_menu replace failed: %s" % n)

esc_old = "function esc(s){return String(s).replace(/'/g,\"\\\\'\").replace(/\"/g,'&quot;');}"
esc_new = """function esc(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/\\\\/g,'\\\\\\\\')
    .replace(/'/g,"\\\\'")
    .replace(/"/g,'&quot;');
}"""

if esc_old in t2:
    t2 = t2.replace(esc_old, esc_new, 1)
elif "replace(/&/g,'&amp;')" not in t2:
    print("warn: esc already patched or pattern changed")

p.write_text(t2, encoding="utf-8")
print("ok", "s4d-menu-opts" in t2)
