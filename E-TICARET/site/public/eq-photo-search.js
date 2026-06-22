/**
 * Üst arama çubuğuna «fotoğrafla ara» (kamera / galeri) ve «kopyala-yapıştır» (ekran görüntüsü).
 * — Barkod (BarcodeDetector) varsa otomatik metin aramasına dökülür.
 * — Yoksa önizleme + elle anahtar kelime ile mevcut searchFilter / __eqHomeSearch akışına bağlanır.
 */
;(function () {
  "use strict";

  if (window.__eqPhotoSearchBooted) return;
  window.__eqPhotoSearchBooted = true;

  var globalFile = null;
  var pasteArmed = false;
  var pasteArmTimer = null;

  function bodyOk() {
    var b = document.body;
    return (
      b &&
      b.classList.contains("eq-shop") &&
      !b.classList.contains("admin-app") &&
      !b.classList.contains("bd-page")
    );
  }

  function applySearchQuery(q) {
    var v = String(q == null ? "" : q).trim();
    if (!v) return false;
    var inp = document.querySelector("header.hdr .srch input.srch-input, header .srch input.srch-input");
    var drawerInp = document.getElementById("eq-mcat-drawer-search");
    if (inp) inp.value = v;
    if (drawerInp) drawerInp.value = v;
    if (typeof window.eqCommitHeaderSearch === "function") {
      window.eqCommitHeaderSearch();
      return true;
    }
    if (typeof window.eqNavigateArama === "function") {
      window.eqNavigateArama(v);
      return true;
    }
    if (inp) inp.dispatchEvent(new Event("input", { bubbles: true }));
    if (typeof window.searchFilter === "function") window.searchFilter(v);
    if (typeof window.__eqHomeSearch === "function") window.__eqHomeSearch(v);
    try {
      if (inp) inp.focus();
    } catch (e) {}
    return true;
  }

  function closePhotoModal() {
    var o = document.getElementById("eq-photo-srch-overlay");
    if (!o) return;
    if (o._eqOnEsc) {
      try {
        document.removeEventListener("keydown", o._eqOnEsc, true);
      } catch (e0) {}
      o._eqOnEsc = null;
    }
    if (o._eqRevokeUrl) {
      try {
        URL.revokeObjectURL(o._eqRevokeUrl);
      } catch (e) {}
    }
    o.remove();
  }

  function openPhotoModal(previewUrl) {
    closePhotoModal();
    var o = document.createElement("div");
    o.id = "eq-photo-srch-overlay";
    o.className = "eq-photo-srch-overlay";
    o.setAttribute("role", "dialog");
    o.setAttribute("aria-modal", "true");
    o.setAttribute("aria-label", "Fotoğrafla ara");
    o._eqRevokeUrl = previewUrl;
    o.addEventListener("click", function (ev) {
      if (ev.target === o) closePhotoModal();
    });

    var p = document.createElement("div");
    p.className = "eq-photo-srch-dialog";

    var img = document.createElement("img");
    img.className = "eq-photo-srch-preview";
    img.src = previewUrl;
    img.alt = "";

    var hint = document.createElement("p");
    hint.className = "eq-photo-srch-hint";
    hint.textContent =
      "Barkod okunamadı. Görseldeki ürünün adını veya markasını yazarak listede arayın.";

    var ti = document.createElement("input");
    ti.type = "text";
    ti.className = "eq-photo-srch-field";
    ti.placeholder = "ör. fırın, buzdolabı, GN 1/1";
    ti.setAttribute("autocomplete", "off");

    var row = document.createElement("div");
    row.className = "eq-photo-srch-actions";

    var bClose = document.createElement("button");
    bClose.type = "button";
    bClose.className = "eq-photo-srch-btn eq-photo-srch-btn--ghost";
    bClose.textContent = "Kapat";
    bClose.addEventListener("click", closePhotoModal);

    var bGo = document.createElement("button");
    bGo.type = "button";
    bGo.className = "eq-photo-srch-btn eq-photo-srch-btn--primary";
    bGo.textContent = "Ara";
    bGo.addEventListener("click", function () {
      applySearchQuery(ti.value);
      closePhotoModal();
    });

    ti.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        bGo.click();
      }
    });

    row.appendChild(bClose);
    row.appendChild(bGo);
    p.appendChild(img);
    p.appendChild(hint);
    p.appendChild(ti);
    p.appendChild(row);
    o.appendChild(p);
    document.body.appendChild(o);
    setTimeout(function () {
      ti.focus();
    }, 0);
    function onEsc(ev) {
      if (ev.key !== "Escape") return;
      closePhotoModal();
    }
    o._eqOnEsc = onEsc;
    document.addEventListener("keydown", onEsc, true);
  }

  function tryBarcodeFromFile(file) {
    if (typeof BarcodeDetector === "undefined") return Promise.resolve(null);
    return new Promise(function (resolve) {
      try {
        var det = new BarcodeDetector({
          formats: [
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "code_128",
            "code_39",
            "itf",
            "qr_code",
          ],
        });
        createImageBitmap(file)
          .then(function (bmp) {
            return det.detect(bmp);
          })
          .then(function (codes) {
            if (codes && codes.length && codes[0].rawValue) resolve(String(codes[0].rawValue).trim());
            else resolve(null);
          })
          .catch(function () {
            resolve(null);
          });
      } catch (e) {
        resolve(null);
      }
    });
  }

  function processImageFile(f) {
    if (!f || !f.type || f.type.indexOf("image/") !== 0) return;
    tryBarcodeFromFile(f).then(function (code) {
      if (code) {
        applySearchQuery(code);
        return;
      }
      var url = URL.createObjectURL(f);
      openPhotoModal(url);
    });
  }

  function onFileSelected() {
    var f = globalFile && globalFile.files && globalFile.files[0];
    try {
      if (globalFile) globalFile.value = "";
    } catch (e2) {}
    processImageFile(f);
  }

  function imageFromClipboardData(cd) {
    if (!cd || !cd.items) return null;
    for (var i = 0; i < cd.items.length; i++) {
      var it = cd.items[i];
      if (it.kind === "file" && it.type && it.type.indexOf("image/") === 0) {
        return it.getAsFile();
      }
    }
    return null;
  }

  function readClipboardImageAsync() {
    if (!navigator.clipboard || typeof navigator.clipboard.read !== "function") {
      return Promise.resolve(null);
    }
    return navigator.clipboard
      .read()
      .then(function (clipItems) {
        var chain = Promise.resolve(null);
        for (var i = 0; i < clipItems.length; i++) {
          (function (ci) {
            chain = chain.then(function (found) {
              if (found) return found;
              for (var j = 0; j < ci.types.length; j++) {
                var t = ci.types[j];
                if (t.indexOf("image/") === 0) {
                  return ci.getType(t).then(function (blob) {
                    try {
                      return new File([blob], "ekran-goruntusu.png", {
                        type: blob.type || "image/png",
                      });
                    } catch (e) {
                      return blob;
                    }
                  });
                }
              }
              return null;
            });
          })(clipItems[i]);
        }
        return chain;
      })
      .catch(function () {
        return null;
      });
  }

  function setPasteArmed(on) {
    pasteArmed = !!on;
    if (pasteArmTimer) {
      clearTimeout(pasteArmTimer);
      pasteArmTimer = null;
    }
    document.querySelectorAll(".eq-srch-paste-btn").forEach(function (b) {
      if (pasteArmed) b.classList.add("eq-srch-paste-btn--armed");
      else b.classList.remove("eq-srch-paste-btn--armed");
    });
    if (pasteArmed) {
      pasteArmTimer = setTimeout(function () {
        setPasteArmed(false);
      }, 12000);
    }
  }

  function isSearchInputFocused() {
    var active = document.activeElement;
    if (!active) return false;
    if (active.id === "eq-mcat-drawer-search") return true;
    return !!(active.classList && active.classList.contains("srch-input"));
  }

  function onPasteCapture(ev) {
    if (!bodyOk()) return;
    var f = imageFromClipboardData(ev.clipboardData);
    if (!f) return;
    if (!pasteArmed && !isSearchInputFocused()) return;
    ev.preventDefault();
    setPasteArmed(false);
    processImageFile(f);
  }

  function onPasteButtonClick(ev) {
    ev.preventDefault();
    if (!bodyOk()) return;
    readClipboardImageAsync().then(function (f) {
      if (f) {
        setPasteArmed(false);
        processImageFile(f);
        return;
      }
      setPasteArmed(true);
      var inp = document.querySelector(
        "header.hdr .srch input.srch-input, header .srch input.srch-input"
      );
      try {
        if (inp) inp.focus();
      } catch (e) {}
    });
  }

  function createPasteButton() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "eq-srch-paste-btn";
    btn.setAttribute("aria-label", "Kopyala-yapıştır ile görsel ara");
    btn.title = "Ekran görüntüsünü kopyalayıp yapıştırın (Ctrl+V)";
    btn.textContent = "Kopyala-yapıştır";
    btn.addEventListener("click", onPasteButtonClick);
    return btn;
  }

  function ensureGlobalFileInput() {
    if (globalFile && globalFile.isConnected) return globalFile;
    globalFile = document.createElement("input");
    globalFile.type = "file";
    globalFile.accept = "image/*";
    globalFile.setAttribute("aria-hidden", "true");
    globalFile.tabIndex = -1;
    globalFile.className = "eq-srch-photo-input";
    globalFile.addEventListener("change", onFileSelected);
    document.body.appendChild(globalFile);
    return globalFile;
  }

  function openFilePicker() {
    if (!bodyOk()) return;
    ensureGlobalFileInput().click();
  }

  window.eqOpenPhotoSearch = openFilePicker;

  function wireSrch(root) {
    if (!root) return;
    var btnSrch = root.querySelector(".srch-btn");
    if (!btnSrch) return;

    var slot = root.querySelector(".eq-srch-photo-slot");
    if (!slot) {
      slot = document.createElement("span");
      slot.className = "eq-srch-photo-slot eq-srch-media-tools";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "eq-srch-photo-btn";
      btn.setAttribute("aria-label", "Fotoğrafla ara");
      btn.title = "Fotoğrafla ara";
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';

      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        openFilePicker();
      });

      slot.appendChild(btn);
      slot.appendChild(createPasteButton());
      root.insertBefore(slot, btnSrch);
      return;
    }

    slot.classList.add("eq-srch-media-tools");
    if (!slot.querySelector(".eq-srch-paste-btn")) {
      slot.appendChild(createPasteButton());
    }
  }

  function wireHeaderButtons() {
    document.querySelectorAll("header.hdr .srch, header .srch").forEach(wireSrch);
  }

  function init() {
    if (!bodyOk()) return;
    ensureGlobalFileInput();
    wireHeaderButtons();
    document.addEventListener("paste", onPasteCapture, true);
  }

  document.addEventListener(
    "click",
    function (ev) {
      if (!bodyOk()) return;
      var cam = ev.target && ev.target.closest && ev.target.closest(".eq-mcat-search-cam");
      if (!cam) return;
      ev.preventDefault();
      openFilePicker();
    },
    true
  );

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.__eqPhotoSearchRefresh = wireHeaderButtons;
})();
