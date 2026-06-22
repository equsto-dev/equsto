/**
 * Üst arama çubuğu — fotoğrafla ara (yükle / sürükle / Ctrl+V yapıştır).
 * — Barkod (BarcodeDetector) varsa otomatik metin aramasına dökülür.
 * — Yoksa /api/search/image ile görsel analiz → doğrudan arama sonuçlarına gider.
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

  function purgeLegacyPhotoModal() {
    var o = document.getElementById("eq-photo-srch-overlay");
    if (o) o.remove();
  }

  function revokePanelPreview() {
    var img = document.querySelector(".eq-photo-upload-preview");
    if (!img) return;
    var u = img.dataset && img.dataset.eqPreviewUrl;
    if (u) {
      try {
        URL.revokeObjectURL(u);
      } catch (e) {}
      delete img.dataset.eqPreviewUrl;
    }
    img.removeAttribute("src");
  }

  function clearPanelAnalyzing() {
    var panel = document.getElementById("eq-photo-upload-panel");
    if (panel) panel.classList.remove("eq-photo-upload-panel--analyzing");
    var block = document.querySelector(".eq-photo-upload-analyzing");
    if (block) block.remove();
    revokePanelPreview();
  }

  function setPanelAnalyzingMessage(text) {
    var el = document.querySelector(".eq-photo-upload-analyzing__msg");
    if (el) el.textContent = text;
  }

  function showPanelAnalyzing(file) {
    var panel = document.getElementById("eq-photo-upload-panel");
    if (!panel) return false;
    panel.classList.add("eq-photo-upload-panel--analyzing");
    var drop = panel.querySelector(".eq-photo-upload-drop");
    if (!drop) return true;
    var block = drop.querySelector(".eq-photo-upload-analyzing");
    if (!block) {
      block = document.createElement("div");
      block.className = "eq-photo-upload-analyzing";
      block.setAttribute("role", "status");
      block.setAttribute("aria-live", "polite");
      block.innerHTML =
        '<img class="eq-photo-upload-preview" alt="">' +
        '<div class="eq-photo-srch-busy__spin" aria-hidden="true"></div>' +
        '<p class="eq-photo-upload-analyzing__msg">Görsel analiz ediliyor…</p>';
      drop.appendChild(block);
    }
    var img = block.querySelector(".eq-photo-upload-preview");
    if (img && file) {
      revokePanelPreview();
      try {
        var url = URL.createObjectURL(file);
        img.dataset.eqPreviewUrl = url;
        img.src = url;
      } catch (e2) {}
    }
    return true;
  }

  function showSearchProgress(file, message) {
    if (isUploadPanelOpen() && showPanelAnalyzing(file)) {
      if (message) setPanelAnalyzingMessage(message);
      closeVisualSearchBusy();
      return;
    }
    showVisualSearchBusy();
    if (message) setBusyMessage(message);
  }

  function closeSearchProgress() {
    clearPanelAnalyzing();
    closeVisualSearchBusy();
  }

  function closeVisualSearchBusy() {
    var o = document.getElementById("eq-photo-srch-busy");
    if (o) o.remove();
  }

  function showVisualSearchBusy() {
    closeVisualSearchBusy();
    var o = document.createElement("div");
    o.id = "eq-photo-srch-busy";
    o.className = "eq-photo-srch-busy";
    o.setAttribute("role", "status");
    o.setAttribute("aria-live", "polite");
    o.setAttribute("aria-label", "Görsel aranıyor");
    o.innerHTML =
      '<div class="eq-photo-srch-busy__card">' +
      '<div class="eq-photo-srch-busy__spin" aria-hidden="true"></div>' +
      "<p>Görsel analiz ediliyor…</p>" +
      "</div>";
    document.body.appendChild(o);
  }

  function setBusyMessage(text) {
    var el = document.querySelector("#eq-photo-srch-busy p");
    if (el) el.textContent = text;
  }

  function showVisualSearchError(msg) {
    closeVisualSearchBusy();
    var o = document.createElement("div");
    o.id = "eq-photo-srch-busy";
    o.className = "eq-photo-srch-busy";
    o.setAttribute("role", "alert");
    var p = document.createElement("div");
    p.className = "eq-photo-srch-busy__card eq-photo-srch-busy__card--err";
    var msgP = document.createElement("p");
    msgP.textContent = String(msg || "Görsel aranamadı.");
    var okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "eq-photo-srch-busy__ok";
    okBtn.textContent = "Tamam";
    okBtn.addEventListener("click", closeVisualSearchBusy);
    p.appendChild(msgP);
    p.appendChild(okBtn);
    o.appendChild(p);
    document.body.appendChild(o);
    setTimeout(closeVisualSearchBusy, 8000);
  }

  function loadTesseract() {
    return new Promise(function (resolve, reject) {
      if (window.Tesseract) return resolve(window.Tesseract);
      var src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      var existing = document.querySelector('script[data-eq-tesseract="1"]');
      if (existing) {
        existing.addEventListener("load", function () {
          resolve(window.Tesseract);
        });
        existing.addEventListener("error", reject);
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.dataset.eqTesseract = "1";
      s.onload = function () {
        resolve(window.Tesseract);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function buildSearchQueryFromOcr(text) {
    var raw = String(text || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!raw) return "";
    var tokens = [];
    var seen = {};
    function pushToken(t) {
      t = String(t || "").trim();
      if (t.length < 3) return;
      var k = t.toLowerCase();
      if (seen[k]) return;
      seen[k] = 1;
      tokens.push(t);
    }
    raw.split(/[\n\r|,;]+/).forEach(function (line) {
      pushToken(line);
    });
    raw.split(/\s+/).forEach(function (w) {
      pushToken(w.replace(/[^\w.\-+/ğüşöçıİĞÜŞÖÇ]/gi, ""));
    });
    return tokens.slice(0, 8).join(" ").slice(0, 120);
  }

  function runClientOcrSearch(file) {
    setBusyMessage("Görseldeki yazılar taranıyor…");
    return loadTesseract().then(function (Tesseract) {
      return Tesseract.recognize(file, "tur+eng", {
        logger: function () {},
      });
    }).then(function (result) {
      var q = buildSearchQueryFromOcr(result && result.data && result.data.text);
      if (!q) throw new Error("ocr-empty");
      return q;
    });
  }

  function resizeImageForUpload(file) {
    return new Promise(function (resolve) {
      var maxDim = 1280;
      var url;
      try {
        url = URL.createObjectURL(file);
      } catch (e) {
        resolve(file);
        return;
      }
      var img = new Image();
      img.onload = function () {
        try {
          URL.revokeObjectURL(url);
        } catch (e0) {}
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        if (!w || !h || (w <= maxDim && h <= maxDim && file.size < 900000)) {
          resolve(file);
          return;
        }
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * scale));
        var ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        var ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, cw, ch);
        canvas.toBlob(
          function (blob) {
            if (!blob) {
              resolve(file);
              return;
            }
            try {
              resolve(
                new File([blob], "gorsel-arama.jpg", {
                  type: "image/jpeg",
                })
              );
            } catch (e2) {
              resolve(blob);
            }
          },
          "image/jpeg",
          0.86
        );
      };
      img.onerror = function () {
        try {
          URL.revokeObjectURL(url);
        } catch (e3) {}
        resolve(file);
      };
      img.src = url;
    });
  }

  function runVisualSearch(file) {
    showSearchProgress(file, "Görsel analiz ediliyor…");
    var uploadFile = null;
    resizeImageForUpload(file)
      .then(function (uf) {
        uploadFile = uf;
        var fd = new FormData();
        fd.append("image", uf, uf.name || "gorsel.jpg");
        return fetch("/api/search/image", { method: "POST", body: fd });
      })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (res) {
        if (res.ok && res.body && res.body.ok) {
          closeUploadPanel();
          closeSearchProgress();
          var q = String(res.body.query || "").trim();
          if (!q) {
            showVisualSearchError("Görselden arama ifadesi çıkarılamadı.");
            return;
          }
          applySearchQuery(q);
          return;
        }
        if (res.body && res.body.fallback === "client-ocr") {
          setPanelAnalyzingMessage("Görseldeki yazılar taranıyor…");
          setBusyMessage("Görseldeki yazılar taranıyor…");
          return runClientOcrSearch(uploadFile || file)
            .then(function (q) {
              closeUploadPanel();
              closeSearchProgress();
              applySearchQuery(q);
            })
            .catch(function () {
              closeUploadPanel();
              closeSearchProgress();
              showVisualSearchError(
                "Görsel analiz edilemedi ve görselde okunabilir yazı bulunamadı. Lütfen başka bir görsel deneyin."
              );
            });
        }
        closeUploadPanel();
        closeSearchProgress();
        showVisualSearchError(
          (res.body && res.body.error) || "Görsel aranamadı. Lütfen tekrar deneyin."
        );
      })
      .catch(function () {
        setPanelAnalyzingMessage("Görseldeki yazılar taranıyor…");
        setBusyMessage("Görseldeki yazılar taranıyor…");
        runClientOcrSearch(uploadFile || file)
          .then(function (q) {
            closeUploadPanel();
            closeSearchProgress();
            applySearchQuery(q);
          })
          .catch(function () {
            closeUploadPanel();
            closeSearchProgress();
            showVisualSearchError("Bağlantı hatası. İnternet bağlantınızı kontrol edin.");
          });
      });
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
    purgeLegacyPhotoModal();
    var inPanel = isUploadPanelOpen();
    if (inPanel) showPanelAnalyzing(f);
    else showVisualSearchBusy();
    tryBarcodeFromFile(f).then(function (code) {
      if (code) {
        closeUploadPanel();
        closeSearchProgress();
        applySearchQuery(code);
        return;
      }
      runVisualSearch(f);
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
      clearPanelAnalyzing();
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
    purgeLegacyPhotoModal();
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
