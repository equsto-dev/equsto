/**
 * Üst arama çubuğu — fotoğrafla ara (yükle / sürükle / Ctrl+V yapıştır).
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
  var MAX_IMAGE_BYTES = 20 * 1024 * 1024;

  var UPLOAD_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';

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

  function closePhotoResultModal() {
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

  function openPhotoResultModal(previewUrl) {
    closePhotoResultModal();
    var o = document.createElement("div");
    o.id = "eq-photo-srch-overlay";
    o.className = "eq-photo-srch-overlay";
    o.setAttribute("role", "dialog");
    o.setAttribute("aria-modal", "true");
    o.setAttribute("aria-label", "Fotoğrafla ara");
    o._eqRevokeUrl = previewUrl;
    o.addEventListener("click", function (ev) {
      if (ev.target === o) closePhotoResultModal();
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
    bClose.addEventListener("click", closePhotoResultModal);

    var bGo = document.createElement("button");
    bGo.type = "button";
    bGo.className = "eq-photo-srch-btn eq-photo-srch-btn--primary";
    bGo.textContent = "Ara";
    bGo.addEventListener("click", function () {
      applySearchQuery(ti.value);
      closePhotoResultModal();
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
      closePhotoResultModal();
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

  function showUploadError(msg) {
    var err = document.querySelector(".eq-photo-upload-error");
    if (!err) return;
    err.textContent = msg || "";
    err.hidden = !msg;
  }

  function acceptImageFile(f) {
    if (!f) return false;
    var t = f.type || "";
    if (t.indexOf("image/") !== 0) {
      showUploadError("Lütfen bir görsel dosyası seçin.");
      return false;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      showUploadError("Dosya 20 MB sınırını aşıyor.");
      return false;
    }
    showUploadError("");
    return true;
  }

  function processImageFile(f) {
    if (!acceptImageFile(f)) return;
    closeUploadPanel();
    tryBarcodeFromFile(f).then(function (code) {
      if (code) {
        applySearchQuery(code);
        return;
      }
      var url = URL.createObjectURL(f);
      openPhotoResultModal(url);
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

  function setPasteArmed(on) {
    pasteArmed = !!on;
    if (pasteArmTimer) {
      clearTimeout(pasteArmTimer);
      pasteArmTimer = null;
    }
    var panel = document.getElementById("eq-photo-upload-panel");
    if (panel) {
      if (pasteArmed) panel.classList.add("eq-photo-upload-panel--paste");
      else panel.classList.remove("eq-photo-upload-panel--paste");
    }
    if (pasteArmed) {
      pasteArmTimer = setTimeout(function () {
        if (document.getElementById("eq-photo-upload-panel")) setPasteArmed(true);
        else setPasteArmed(false);
      }, 60000);
    }
  }

  function isUploadPanelOpen() {
    return !!document.getElementById("eq-photo-upload-panel");
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
    if (!isUploadPanelOpen() && !pasteArmed && !isSearchInputFocused()) return;
    ev.preventDefault();
    processImageFile(f);
  }

  function setPhotoBtnOpen(on) {
    document.querySelectorAll(".eq-srch-photo-btn").forEach(function (b) {
      if (on) b.classList.add("eq-srch-photo-btn--open");
      else b.classList.remove("eq-srch-photo-btn--open");
    });
  }

  function onUploadPanelOutside(ev) {
    if (!isUploadPanelOpen()) return;
    if (ev.target.closest && ev.target.closest("#eq-photo-upload-panel")) return;
    if (ev.target.closest && ev.target.closest(".eq-srch-photo-btn")) return;
    closeUploadPanel();
  }

  function onUploadPanelEsc(ev) {
    if (ev.key !== "Escape") return;
    if (!isUploadPanelOpen()) return;
    ev.preventDefault();
    closeUploadPanel();
  }

  function positionUploadPanel(panel, srch) {
    if (!panel || !srch) return;
    var r = srch.getBoundingClientRect();
    panel.style.top = Math.round(r.bottom + 6) + "px";
    panel.style.left = Math.round(r.left) + "px";
    panel.style.width = Math.round(r.width) + "px";
  }

  function closeUploadPanel() {
    var p = document.getElementById("eq-photo-upload-panel");
    if (p) {
      if (p._eqReposition) {
        try {
          window.removeEventListener("resize", p._eqReposition);
          window.removeEventListener("scroll", p._eqReposition, true);
        } catch (e0) {}
        p._eqReposition = null;
      }
      p.remove();
    }
    setPasteArmed(false);
    setPhotoBtnOpen(false);
    try {
      document.removeEventListener("click", onUploadPanelOutside, true);
      document.removeEventListener("keydown", onUploadPanelEsc, true);
    } catch (e) {}
  }

  function bindDropZone(drop) {
    function over(on) {
      if (on) drop.classList.add("eq-photo-upload-drop--over");
      else drop.classList.remove("eq-photo-upload-drop--over");
    }
    drop.addEventListener("dragenter", function (ev) {
      ev.preventDefault();
      over(true);
    });
    drop.addEventListener("dragover", function (ev) {
      ev.preventDefault();
      over(true);
    });
    drop.addEventListener("dragleave", function (ev) {
      if (ev.target !== drop) return;
      over(false);
    });
    drop.addEventListener("drop", function (ev) {
      ev.preventDefault();
      over(false);
      var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      processImageFile(f);
    });
  }

  function openUploadPanel(anchorEl) {
    if (!bodyOk()) return;
    if (isUploadPanelOpen()) {
      closeUploadPanel();
      return;
    }

    var srch =
      (anchorEl && anchorEl.closest && anchorEl.closest(".srch")) ||
      document.querySelector("header.hdr .srch, header .srch");
    if (!srch) return;

    closeUploadPanel();

    var panel = document.createElement("div");
    panel.id = "eq-photo-upload-panel";
    panel.className = "eq-photo-upload-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Görsel yükle");

    var title = document.createElement("p");
    title.className = "eq-photo-upload-title";
    title.textContent = "Görseli aşağıdaki yöntemlerden biriyle yükleyin";

    var drop = document.createElement("div");
    drop.className = "eq-photo-upload-drop";

    var err = document.createElement("p");
    err.className = "eq-photo-upload-error";
    err.hidden = true;

    var upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "eq-photo-upload-btn";
    upBtn.innerHTML = UPLOAD_SVG + '<span>Görsel yükle</span>';
    upBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      ensureGlobalFileInput().click();
    });

    var orDrag = document.createElement("p");
    orDrag.className = "eq-photo-upload-or";
    orDrag.textContent = "veya görseli buraya sürükleyin";

    var orPaste = document.createElement("p");
    orPaste.className = "eq-photo-upload-paste";
    orPaste.innerHTML =
      'veya yapıştırmak için <kbd class="eq-photo-upload-kbd">Ctrl+V</kbd> basın';

    var limit = document.createElement("span");
    limit.className = "eq-photo-upload-limit";
    limit.textContent = "Maksimum dosya boyutu: 20 MB";

    drop.appendChild(upBtn);
    drop.appendChild(orDrag);
    drop.appendChild(orPaste);
    drop.appendChild(limit);
    bindDropZone(drop);

    panel.appendChild(title);
    panel.appendChild(err);
    panel.appendChild(drop);
    document.body.appendChild(panel);
    positionUploadPanel(panel, srch);
    panel._eqReposition = function () {
      positionUploadPanel(panel, srch);
    };
    window.addEventListener("resize", panel._eqReposition);
    window.addEventListener("scroll", panel._eqReposition, true);

    setPasteArmed(true);
    setPhotoBtnOpen(true);
    document.addEventListener("click", onUploadPanelOutside, true);
    document.addEventListener("keydown", onUploadPanelEsc, true);

    setTimeout(function () {
      try {
        upBtn.focus();
      } catch (e) {}
    }, 0);
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

  window.eqOpenPhotoSearch = function () {
    var btn = document.querySelector(".eq-srch-photo-btn");
    openUploadPanel(btn || document.querySelector("header .srch"));
  };

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
        ev.stopPropagation();
        openUploadPanel(btn);
      });

      slot.appendChild(btn);
      root.insertBefore(slot, btnSrch);
      return;
    }

    var oldPaste = slot.querySelector(".eq-srch-paste-btn");
    if (oldPaste) oldPaste.remove();

    var cam = slot.querySelector(".eq-srch-photo-btn");
    if (cam && !cam.dataset.eqPhotoWired) {
      var freshCam = cam.cloneNode(true);
      freshCam.dataset.eqPhotoWired = "1";
      cam.parentNode.replaceChild(freshCam, cam);
      freshCam.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        openUploadPanel(freshCam);
      });
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
      openUploadPanel(cam);
    },
    true
  );

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.__eqPhotoSearchRefresh = wireHeaderButtons;
})();
