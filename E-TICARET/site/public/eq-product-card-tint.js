/**
 * Katalog kartları: görselden baskın renk → hover’da arka plan yıkaması.
 * Şu an: .prod-img + .prod-info (inline background-image, important).
 *
 * TODO (kullanıcı notu): Renk yalnızca görselin arkasına (.prod-img, <img> altında);
 * açıklama / metin bloğu (.prod-info) renklendirilmeyecek — sonra uygulanacak.
 */
(function () {
  "use strict";

  if (window.__eqProductCardTintInited) return;
  window.__eqProductCardTintInited = true;

  var CACHE = Object.create(null);
  var CACHE_VER = "v6";
  var SAMPLE = 56;
  var tintToken = new WeakMap();
  var plpTintSrc = new WeakMap();

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
   * Doygunluğu hafif artır; yalnızca gerçekten gri (neredeyse R=G=B) ise nötr mavi.
   * Sarı/turuncu gibi “düşük max–min ama renkli” ortalamaları maviye çevirme.
   */
  function enrichRgb(r, g, b) {
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var d = max - min;
    var avg = (r + g + b) / 3;
    var dev = Math.max(Math.abs(r - avg), Math.abs(g - avg), Math.abs(b - avg));
    if (d < 10 && dev < 8) {
      return { r: 118, g: 132, b: 168 };
    }
    var k = d < 42 ? 1.42 : 1.2;
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
      if (L > 245) continue;
      if (L > 232 && s < 22) continue;
      w = (s * s + s * 10 + 6) * (a / 255);
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
      done(null);
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
      glow: "rgba(" + r + "," + g + "," + b + ",0.58)",
      mid: "rgba(" + r + "," + g + "," + b + ",0.36)",
      fade: "rgba(" + r + "," + g + "," + b + ",0.14)",
      bar: "rgba(" + r + "," + g + "," + b + ",0.38)",
    };
  }

  function setTintVars(el, t) {
    if (!el) return;
    el.style.setProperty("--eq-prod-tint-glow", t.glow);
    el.style.setProperty("--eq-prod-tint-mid", t.mid);
    el.style.setProperty("--eq-prod-tint-fade", t.fade);
    el.style.setProperty("--eq-prod-tint-bar", t.bar);
  }

  function paintTintSurfaces(imgBox, infoBox, t) {
    if (!t) return;
    var radial =
      "radial-gradient(125% 88% at 50% 45%, " +
      t.glow +
      " 0%, " +
      t.mid +
      " 52%, " +
      t.fade +
      " 100%)";
    var linear =
      "linear-gradient(185deg, " + t.bar + " 0%, " + t.mid + " 58%, transparent 100%)";
    if (imgBox) {
      imgBox.style.setProperty("background-image", radial, "important");
    }
    if (infoBox) {
      infoBox.style.setProperty("background-image", linear, "important");
    }
  }

  function clearTintSurfaces(imgBox, infoBox) {
    if (imgBox) {
      imgBox.style.removeProperty("background-image");
    }
    if (infoBox) {
      infoBox.style.removeProperty("background-image");
    }
  }

  function clearTintVars(el) {
    if (!el) return;
    el.style.removeProperty("--eq-prod-tint-glow");
    el.style.removeProperty("--eq-prod-tint-mid");
    el.style.removeProperty("--eq-prod-tint-fade");
    el.style.removeProperty("--eq-prod-tint-bar");
  }

  function applyRgb(card, rgb) {
    if (!rgb) return;
    var r = rgb.r;
    var g = rgb.g;
    var b = rgb.b;
    var t = tintCssProps(r, g, b);
    var imgBox = card.querySelector(".prod-img");
    var infoBox = card.querySelector(".prod-info");
    setTintVars(card, t);
    setTintVars(imgBox, t);
    setTintVars(infoBox, t);
    paintTintSurfaces(imgBox, infoBox, t);
    card.classList.add("eq-prod-tint-active");
  }

  function clearTint(card) {
    if (!card) return;
    card.classList.remove("eq-prod-tint-active");
    var imgBox = card.querySelector(".prod-img");
    var infoBox = card.querySelector(".prod-info");
    clearTintVars(card);
    clearTintVars(imgBox);
    clearTintVars(infoBox);
    clearTintSurfaces(imgBox, infoBox);
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
    var card = e.target.closest && e.target.closest(".main .products .prod-card");
    if (!card) return;
    scheduleTint(card);
  }

  function onPointerOut(e) {
    var card = e.target.closest && e.target.closest(".prod-card");
    if (!card || !card.closest(".main .products")) return;
    var rel = e.relatedTarget;
    if (rel && card.contains(rel)) return;
    clearTint(card);
  }

  function plpAmbientProps(r, g, b) {
    var baseR = clamp(Math.round(245 + (r - 118) * 0.16), 232, 252);
    var baseG = clamp(Math.round(246 + (g - 132) * 0.16), 232, 252);
    var baseB = clamp(Math.round(248 + (b - 168) * 0.16), 234, 254);
    return {
      glow: "rgba(" + r + "," + g + "," + b + ",0.44)",
      mid: "rgba(" + r + "," + g + "," + b + ",0.24)",
      base: "rgb(" + baseR + "," + baseG + "," + baseB + ")",
      border: "rgba(" + r + "," + g + "," + b + ",0.34)",
    };
  }

  function applyPlpAmbientToWrap(wrap, rgb) {
    if (!wrap || !rgb) return;
    var t = plpAmbientProps(rgb.r, rgb.g, rgb.b);
    wrap.style.setProperty("--eq-plp-ambient-glow", t.glow);
    wrap.style.setProperty("--eq-plp-ambient-mid", t.mid);
    wrap.style.setProperty("--eq-plp-ambient-base", t.base);
    wrap.style.setProperty("--eq-plp-ambient-border", t.border);
    wrap.classList.add("eq-plp-ambient-ready");
  }

  function tintOnePlpWrap(wrap) {
    var img = wrap.querySelector("img");
    if (!img) return;
    var src = String(img.currentSrc || img.src || "");
    if (plpTintSrc.get(wrap) === src && wrap.classList.contains("eq-plp-ambient-ready")) return;
    var fallback = { r: 118, g: 132, b: 168 };

    function finish(rgb) {
      applyPlpAmbientToWrap(wrap, rgb || fallback);
      plpTintSrc.set(wrap, src);
    }

    function sampleFull() {
      sampleFromImage(img, function (rgb) {
        finish(rgb || sampleFromImageSync(img) || fallback);
      });
    }

    var instant = sampleFromImageSync(img);
    if (instant) applyPlpAmbientToWrap(wrap, instant);

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
    img.addEventListener(
      "error",
      function once() {
        img.removeEventListener("error", once);
        finish(fallback);
      },
      { once: true }
    );
  }

  function refreshPlp(root) {
    root = root || document;
    var wraps = root.querySelectorAll(".eq-dept-plp-card__img");
    for (var i = 0; i < wraps.length; i++) tintOnePlpWrap(wraps[i]);
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

  function init() {
    document.addEventListener("pointerover", onPointerOver, true);
    document.addEventListener("pointerout", onPointerOut, true);
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
