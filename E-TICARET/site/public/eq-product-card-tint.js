/**
 * Katalog kartları: görselden baskın renk → hover’da YouTube ambient benzeri çerçeve + .prod-img yıkaması.
 */
(function () {
  "use strict";

  if (window.__eqProductCardTintInited) return;
  window.__eqProductCardTintInited = true;

  var CACHE = Object.create(null);
  var CACHE_VER = "v10";
  var SAMPLE = 56;
  var tintToken = new WeakMap();
  var plpTintSrc = new WeakMap();
  var plpRgbCache = new WeakMap();

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function satRgb(r, g, b) {
    return Math.max(r, g, b) - Math.min(r, g, b);
  }

  function lightRgb(r, g, b) {
    return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  }

  /**
   * Doygunluğu artır. Açık gri arka plan → nötr mavi; koyu ürün gövdesi (siyah makine vb.) → koyu accent.
   */
  function enrichRgb(r, g, b) {
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var d = max - min;
    var avg = (r + g + b) / 3;
    var dev = Math.max(Math.abs(r - avg), Math.abs(g - avg), Math.abs(b - avg));
    var L = (max + min) / 2;
    if (d < 14 && L < 100) {
      var bias = 14;
      if (b >= r && b >= g) bias = 18;
      else if (r >= g && r >= b) bias = 10;
      return {
        r: clamp(Math.round(r + (r - avg) * 0.35 + bias * 0.4), 22, 95),
        g: clamp(Math.round(g + (g - avg) * 0.35 + bias * 0.25), 22, 95),
        b: clamp(Math.round(b + (b - avg) * 0.35 + bias * 0.55), 28, 110),
      };
    }
    if (d < 10 && dev < 8 && L > 155) {
      return { r: 118, g: 132, b: 168 };
    }
    var k = d < 42 ? 1.48 : 1.24;
    r = clamp(Math.round(avg + (r - avg) * k), 0, 255);
    g = clamp(Math.round(avg + (g - avg) * k), 0, 255);
    b = clamp(Math.round(avg + (b - avg) * k), 0, 255);
    return { r: r, g: g, b: b };
  }

  /** Beyaz fonda sarı vurguyu kaybetmemek: doygun piksellere ağırlık + en canlı piksel yedeği. */
  function accentFromImageData(data) {
    var wr = 0,
      wg = 0,
      wb = 0,
      wsum = 0;
    var bestR = 140,
      bestG = 150,
      bestB = 175,
      bestS = -1;
    var i,
      a,
      r,
      g,
      b,
      s,
      L,
      w;
    for (i = 0; i < data.length; i += 4) {
      a = data[i + 3];
      if (a < 10) continue;
      r = data[i];
      g = data[i + 1];
      b = data[i + 2];
      s = satRgb(r, g, b);
      L = lightRgb(r, g, b);
      if (L > 248) continue;
      if (L > 228 && s < 18) continue;
      if (L < 118 && s < 8) {
        w = (140 - L + 12) * (a / 255);
      } else {
        w = (s * s + s * 10 + 6) * (a / 255);
      }
      wr += r * w;
      wg += g * w;
      wb += b * w;
      wsum += w;
      if (s > bestS) {
        bestS = s;
        bestR = r;
        bestG = g;
        bestB = b;
      }
    }
    if (wsum < 1) {
      if (bestS >= 0) return enrichRgb(bestR, bestG, bestB);
      return null;
    }
    var ar = wr / wsum;
    var ag = wg / wsum;
    var ab = wb / wsum;
    var rr = Math.round(ar);
    var gg = Math.round(ag);
    var bb = Math.round(ab);
    var avgS = satRgb(rr, gg, bb);
    if (bestS > avgS + 18 && bestS > 28) {
      var t = clamp((bestS - avgS) / (bestS + 10), 0.35, 0.72);
      rr = Math.round(rr * (1 - t) + bestR * t);
      gg = Math.round(gg * (1 - t) + bestG * t);
      bb = Math.round(bb * (1 - t) + bestB * t);
    }
    return enrichRgb(rr, gg, bb);
  }

  function isSameOriginSrc(src) {
    try {
      return new URL(src, location.href).origin === location.origin;
    } catch (e) {
      return true;
    }
  }

  function ensureImgCrossOrigin(img) {
    if (!img || img.crossOrigin || img.dataset.eqTintCors) return;
    var src = String(img.currentSrc || img.src || "");
    if (!src || isSameOriginSrc(src)) return;
    img.crossOrigin = "anonymous";
    img.dataset.eqTintCors = "1";
  }

  function sampleFromBitmap(bitmap, done) {
    var c = document.createElement("canvas");
    c.width = SAMPLE;
    c.height = SAMPLE;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      done(null);
      return;
    }
    try {
      ctx.drawImage(bitmap, 0, 0, SAMPLE, SAMPLE);
      var data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
    } catch (e) {
      done(null);
      return;
    }
    var out = accentFromImageData(data);
    if (!out) {
      done(null);
      return;
    }
    done(out);
  }

  function sampleFromImageUrl(src, done) {
    if (!src || typeof fetch !== "function") {
      done(null);
      return;
    }
    fetch(src, { mode: "cors", credentials: "omit" })
      .then(function (r) {
        if (!r.ok) throw new Error("fetch");
        return r.blob();
      })
      .then(function (blob) {
        if (typeof createImageBitmap === "function") {
          return createImageBitmap(blob).then(function (bmp) {
            sampleFromBitmap(bmp, done);
          });
        }
        var url = URL.createObjectURL(blob);
        var probe = new Image();
        probe.onload = function () {
          sampleFromBitmap(probe, function (rgb) {
            URL.revokeObjectURL(url);
            done(rgb);
          });
        };
        probe.onerror = function () {
          URL.revokeObjectURL(url);
          done(null);
        };
        probe.src = url;
      })
      .catch(function () {
        done(null);
      });
  }

  function sampleFromImage(img, done) {
    var src = String(img.currentSrc || img.src || "");
    var ck = CACHE_VER + "\t" + src;
    if (CACHE[ck]) {
      done(CACHE[ck]);
      return;
    }
    if (!img.naturalWidth || !img.naturalHeight) {
      done(null);
      return;
    }
    ensureImgCrossOrigin(img);
    var c = document.createElement("canvas");
    c.width = SAMPLE;
    c.height = SAMPLE;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      done(null);
      return;
    }
    try {
      ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
      var data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
    } catch (e) {
      sampleFromImageUrl(src, function (rgb) {
        if (rgb) CACHE[ck] = rgb;
        done(rgb);
      });
      return;
    }
    var out = accentFromImageData(data);
    /* Ürün gövdesi altta (sarı kap vb.) — üst beyaz alan ortalamayı bozduysa alt bant tekrar örneklenir */
    if (out && satRgb(out.r, out.g, out.b) < 40 && img.naturalHeight > 32) {
      var nw = img.naturalWidth;
      var nh = img.naturalHeight;
      var sy = Math.floor(nh * 0.32);
      try {
        ctx.drawImage(img, 0, sy, nw, nh - sy, 0, 0, SAMPLE, SAMPLE);
        var data2 = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
        var out2 = accentFromImageData(data2);
        if (out2 && satRgb(out2.r, out2.g, out2.b) > satRgb(out.r, out.g, out.b)) {
          out = out2;
        }
      } catch (e2) {}
    }
    if (!out) {
      done(null);
      return;
    }
    CACHE[ck] = out;
    done(out);
  }

  /** Hızlı senkron örnek (32px) — hover anında renk; sonra SAMPLE ile iyileştirilir. */
  function sampleFromImageSync(img) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return null;
    ensureImgCrossOrigin(img);
    var c = document.createElement("canvas");
    var sz = 32;
    c.width = sz;
    c.height = sz;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    try {
      ctx.drawImage(img, 0, 0, sz, sz);
      var data = ctx.getImageData(0, 0, sz, sz).data;
      return accentFromImageData(data);
    } catch (e) {
      return null;
    }
  }

  function tintCssProps(r, g, b) {
    return {
      glow: "rgba(" + r + "," + g + "," + b + ",0.62)",
      mid: "rgba(" + r + "," + g + "," + b + ",0.38)",
      fade: "rgba(" + r + "," + g + "," + b + ",0.12)",
      border: "rgba(" + r + "," + g + "," + b + ",0.72)",
      shadow:
        "0 0 0 1px rgba(" +
        r +
        "," +
        g +
        "," +
        b +
        ",0.32), 0 10px 32px rgba(" +
        r +
        "," +
        g +
        "," +
        b +
        ",0.26), 0 2px 10px rgba(" +
        r +
        "," +
        g +
        "," +
        b +
        ",0.14)",
    };
  }

  function setTintVars(el, t) {
    if (!el) return;
    el.style.setProperty("--eq-prod-tint-glow", t.glow);
    el.style.setProperty("--eq-prod-tint-mid", t.mid);
    el.style.setProperty("--eq-prod-tint-fade", t.fade);
    el.style.setProperty("--eq-prod-tint-border", t.border);
    el.style.setProperty("--eq-prod-tint-shadow", t.shadow);
  }

  function paintTintSurfaces(imgBox, t) {
    if (!t || !imgBox) return;
    var radial =
      "radial-gradient(125% 88% at 50% 45%, " +
      t.glow +
      " 0%, " +
      t.mid +
      " 52%, " +
      t.fade +
      " 100%)";
    imgBox.style.setProperty("background-image", radial, "important");
  }

  function clearTintSurfaces(imgBox) {
    if (imgBox) {
      imgBox.style.removeProperty("background-image");
    }
  }

  function clearTintVars(el) {
    if (!el) return;
    el.style.removeProperty("--eq-prod-tint-glow");
    el.style.removeProperty("--eq-prod-tint-mid");
    el.style.removeProperty("--eq-prod-tint-fade");
    el.style.removeProperty("--eq-prod-tint-border");
    el.style.removeProperty("--eq-prod-tint-shadow");
  }

  function findTintCard(el) {
    if (!el || !el.closest) return null;
    var card = el.closest(".prod-card-wrap");
    if (card) return card;
    card = el.closest(".main .products .prod-card");
    if (card) return card;
    return el.closest(".eq-mx-showcase__track--cards .prod-card");
  }

  function applyRgb(card, rgb) {
    if (!rgb) return;
    var t = tintCssProps(rgb.r, rgb.g, rgb.b);
    var imgBox = card.querySelector(".prod-img");
    setTintVars(card, t);
    if (imgBox) setTintVars(imgBox, t);
    paintTintSurfaces(imgBox, t);
    card.classList.add("eq-prod-tint-active");
  }

  function clearTint(card) {
    if (!card) return;
    card.classList.remove("eq-prod-tint-active");
    var imgBox = card.querySelector(".prod-img");
    clearTintVars(card);
    clearTintVars(imgBox);
    clearTintSurfaces(imgBox);
    tintToken.set(card, (tintToken.get(card) || 0) + 1);
  }

  function scheduleTint(card) {
    var img = card.querySelector(".prod-img img");
    var gen = (tintToken.get(card) || 0) + 1;
    tintToken.set(card, gen);
    var fallback = { r: 118, g: 132, b: 168 };

    function run() {
      if (tintToken.get(card) !== gen) return;
      if (!img) {
        applyRgb(card, fallback);
        return;
      }
      /* Hemen renk (hover hissi); ardından yüksek çözünürlüklü örnek ile güncelle */
      var instant = sampleFromImageSync(img) || fallback;
      applyRgb(card, instant);
      if (!img.naturalWidth) {
        var to = setTimeout(function () {
          if (tintToken.get(card) !== gen) return;
          if (!img.naturalWidth) applyRgb(card, fallback);
        }, 1200);
        img.addEventListener(
          "load",
          function once() {
            clearTimeout(to);
            img.removeEventListener("load", once);
            if (tintToken.get(card) !== gen) return;
            sampleFromImage(img, function (rgb) {
              if (tintToken.get(card) !== gen) return;
              applyRgb(card, rgb || fallback);
            });
          },
          { once: true }
        );
        return;
      }
      sampleFromImage(img, function (rgb) {
        if (tintToken.get(card) !== gen) return;
        applyRgb(card, rgb || instant);
      });
    }
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
    else setTimeout(run, 0);
  }

  function onPointerOver(e) {
    var card = findTintCard(e.target);
    if (!card) return;
    scheduleTint(card);
  }

  function onPointerOut(e) {
    var card = findTintCard(e.target);
    if (!card) return;
    var rel = e.relatedTarget;
    if (rel && card.contains(rel)) return;
    clearTint(card);
  }

  function plpAmbientProps(r, g, b) {
    var L = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    var mix = L < 90 ? 0.52 : 0.38;
    var baseR = clamp(Math.round(245 + (r - 245) * mix), 198, 252);
    var baseG = clamp(Math.round(246 + (g - 246) * mix), 198, 252);
    var baseB = clamp(Math.round(248 + (b - 248) * mix), 200, 254);
    return {
      glow: "rgba(" + r + "," + g + "," + b + ",0.78)",
      mid: "rgba(" + r + "," + g + "," + b + ",0.48)",
      base: "rgb(" + baseR + "," + baseG + "," + baseB + ")",
      border: "rgba(" + r + "," + g + "," + b + ",0.58)",
    };
  }

  function cachePlpRgb(wrap, rgb) {
    if (wrap && rgb) plpRgbCache.set(wrap, rgb);
  }

  /** Renk değişkenleri yalnızca hover sırasında — CSS :hover gradient’i bunları kullanır. */
  function setPlpAmbientVars(wrap, rgb) {
    if (!wrap || !rgb || !wrap.matches(":hover")) return;
    var t = plpAmbientProps(rgb.r, rgb.g, rgb.b);
    wrap.style.setProperty("--eq-plp-ambient-glow", t.glow);
    wrap.style.setProperty("--eq-plp-ambient-mid", t.mid);
    wrap.style.setProperty("--eq-plp-ambient-base", t.base);
    wrap.style.setProperty("--eq-plp-ambient-border", t.border);
  }

  function clearPlpAmbientWrap(wrap) {
    if (!wrap) return;
    wrap.classList.remove("eq-plp-ambient-ready", "eq-plp-ambient-active");
    wrap.style.removeProperty("--eq-plp-ambient-glow");
    wrap.style.removeProperty("--eq-plp-ambient-mid");
    wrap.style.removeProperty("--eq-plp-ambient-base");
    wrap.style.removeProperty("--eq-plp-ambient-border");
  }

  var plpHoverGen = new WeakMap();

  function schedulePlpHoverTint(wrap) {
    var img = wrap.querySelector("img");
    if (!img || !wrap.matches(":hover")) return;
    var gen = (plpHoverGen.get(wrap) || 0) + 1;
    plpHoverGen.set(wrap, gen);
    var fallback = { r: 118, g: 132, b: 168 };
    var cached = plpRgbCache.get(wrap);
    if (cached) setPlpAmbientVars(wrap, cached);

    function finish(rgb) {
      if (plpHoverGen.get(wrap) !== gen || !wrap.matches(":hover")) return;
      var out = rgb || cached || fallback;
      cachePlpRgb(wrap, out);
      setPlpAmbientVars(wrap, out);
      plpTintSrc.set(wrap, String(img.currentSrc || img.src || ""));
    }

    var instant = sampleFromImageSync(img) || cached;
    if (instant) {
      cachePlpRgb(wrap, instant);
      setPlpAmbientVars(wrap, instant);
    }

    if (img.complete && img.naturalWidth) {
      sampleFromImage(img, function (rgb) {
        finish(rgb || instant);
      });
      return;
    }

    img.addEventListener(
      "load",
      function once() {
        img.removeEventListener("load", once);
        if (plpHoverGen.get(wrap) !== gen) return;
        sampleFromImage(img, function (rgb) {
          finish(rgb || instant);
        });
      },
      { once: true }
    );
  }

  /** Yalnızca bellek önbelleği — DOM / sınıf yok (sabit renk görünmesin). */
  function prewarmPlpWrap(wrap) {
    var img = wrap.querySelector("img");
    if (!img) return;
    var src = String(img.currentSrc || img.src || "");
    if (plpTintSrc.get(wrap) === src && plpRgbCache.has(wrap)) return;
    var fallback = { r: 118, g: 132, b: 168 };

    function finish(rgb) {
      cachePlpRgb(wrap, rgb || fallback);
      plpTintSrc.set(wrap, src);
    }

    function sampleFull() {
      sampleFromImage(img, function (rgb) {
        finish(rgb || sampleFromImageSync(img));
      });
    }

    var warm = sampleFromImageSync(img);
    if (warm) cachePlpRgb(wrap, warm);

    if (img.complete && img.naturalWidth) {
      sampleFull();
      return;
    }

    img.addEventListener(
      "load",
      function once() {
        img.removeEventListener("load", once);
        src = String(img.currentSrc || img.src || "");
        sampleFull();
      },
      { once: true }
    );
  }

  function refreshPlp(root) {
    root = root || document;
    var wraps = root.querySelectorAll(".eq-dept-plp-card__img");
    for (var i = 0; i < wraps.length; i++) {
      clearPlpAmbientWrap(wraps[i]);
      prewarmPlpWrap(wraps[i]);
    }
  }

  function watchPlpGrids() {
    ["eq-dept-plp-grid", "eq-arama-grid"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.__eqPlpTintObs) return;
      el.__eqPlpTintObs = true;
      refreshPlp(el);
      try {
        var obs = new MutationObserver(function () {
          refreshPlp(el);
        });
        obs.observe(el, { childList: true, subtree: true });
      } catch (_) {}
    });
  }

  function onPlpPointerOver(e) {
    var wrap = e.target.closest && e.target.closest(".eq-dept-plp-card__img");
    if (!wrap) return;
    schedulePlpHoverTint(wrap);
  }

  function onPlpPointerOut(e) {
    var wrap = e.target.closest && e.target.closest(".eq-dept-plp-card__img");
    if (!wrap) return;
    var rel = e.relatedTarget;
    if (rel && wrap.contains(rel)) return;
    plpHoverGen.set(wrap, (plpHoverGen.get(wrap) || 0) + 1);
    clearPlpAmbientWrap(wrap);
  }

  function init() {
    document.addEventListener("pointerover", onPointerOver, true);
    document.addEventListener("pointerout", onPointerOut, true);
    document.addEventListener("pointerover", onPlpPointerOver, true);
    document.addEventListener("pointerout", onPlpPointerOut, true);
    watchPlpGrids();
    if (typeof document !== "undefined") {
      document.addEventListener("equsto:plp-grid-updated", function (e) {
        refreshPlp((e && e.detail && e.detail.root) || document);
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /** Ürün detay (product.html): görselden accent — kart hover’ından bağımsız */
  var g = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this;
  g.EqustoProductTint = {
    sampleFromImage: sampleFromImage,
    sampleFromImageSync: sampleFromImageSync,
    refreshPlp: refreshPlp,
    watchPlpGrids: watchPlpGrids,
  };
})();
