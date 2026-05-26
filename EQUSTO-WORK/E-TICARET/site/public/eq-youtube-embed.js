/**
 * YouTube click-to-play facade (privacy-enhanced embed).
 * Autoplay: poster first, then muted iframe after light interaction or deferred load.
 */
(function () {
  "use strict";

  var EMBED_HOST = "https://www.youtube-nocookie.com/embed/";
  var autoplayQueued = false;

  function pageOrigin() {
    try {
      if (location.origin && location.protocol !== "file:") return location.origin;
    } catch (e) { /* ignore */ }
    return "https://equsto.com";
  }

  function buildEmbedUrl(id, opts) {
    var q = [
      "rel=0",
      "modestbranding=1",
      "playsinline=1",
      "enablejsapi=1",
      "origin=" + encodeURIComponent(pageOrigin()),
    ];
    if (opts.controls === false) q.push("controls=0", "disablekb=1", "iv_load_policy=3");
    if (opts.autoplay) q.push("autoplay=1");
    if (opts.mute) q.push("mute=1");
    if (opts.loop) {
      q.push("loop=1", "playlist=" + encodeURIComponent(id));
    }
    return EMBED_HOST + encodeURIComponent(id) + "?" + q.join("&");
  }

  function thumbUrl(id) {
    return (
      "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/maxresdefault.jpg"
    );
  }

  function activate(el) {
    var id = el.getAttribute("data-eq-yt-id");
    if (!id || el.classList.contains("eq-yt--active")) return;

    var title = el.getAttribute("data-eq-yt-title") || "YouTube video";
    var opts = {
      autoplay: true,
      mute: el.getAttribute("data-eq-yt-mute") === "1",
      loop: el.getAttribute("data-eq-yt-loop") === "1",
      controls: el.getAttribute("data-eq-yt-controls") !== "0",
    };

    var iframe = document.createElement("iframe");
    iframe.src = buildEmbedUrl(id, opts);
    iframe.title = title;
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    );
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.loading = "eager";

    el.classList.add("eq-yt--active");
    el.innerHTML = "";
    el.appendChild(iframe);
  }

  function buildPoster(el, opts) {
    var id = el.getAttribute("data-eq-yt-id");
    var playLabel =
      el.getAttribute("data-eq-yt-play-label") || "Videoyu oynat";
    var html =
      '<button type="button" class="eq-yt__btn" aria-label="' +
      escapeAttr(playLabel) +
      '">' +
      '<img class="eq-yt__thumb" src="' +
      thumbUrl(id) +
      '" alt="" loading="eager" decoding="async" onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/' +
      encodeURIComponent(id) +
      "/hqdefault.jpg'\">" +
      '<span class="eq-yt__shade" aria-hidden="true"></span>';
    if (!opts.minimal) {
      html +=
        '<span class="eq-yt__label"><span class="eq-yt__icon" aria-hidden="true"></span>' +
        '<span class="eq-yt__txt">' +
        escapeHtml(playLabel) +
        "</span></span>";
    }
    html += "</button>";
    el.innerHTML = html;
    el.querySelector(".eq-yt__btn").addEventListener("click", function (ev) {
      ev.preventDefault();
      activate(el);
    });
  }

  function queueAutoplayUnlock() {
    if (autoplayQueued) return;
    autoplayQueued = true;

    function unlockAll() {
      document.querySelectorAll(".eq-yt.eq-yt--autoplay:not(.eq-yt--active)").forEach(activate);
    }

    function bindOnce() {
      unlockAll();
    }

    ["pointerdown", "touchstart", "keydown", "wheel", "scroll"].forEach(function (ev) {
      document.addEventListener(ev, bindOnce, { once: true, passive: true });
    });

    function deferredTry() {
      document.querySelectorAll(".eq-yt.eq-yt--autoplay:not(.eq-yt--active)").forEach(function (el) {
        activate(el);
      });
    }

    if (document.readyState === "complete") {
      setTimeout(deferredTry, 600);
    } else {
      window.addEventListener(
        "load",
        function () {
          setTimeout(deferredTry, 600);
        },
        { once: true }
      );
    }
  }

  function initAutoplay(el) {
    el.classList.add("eq-yt--autoplay");
    var minimal =
      el.getAttribute("data-eq-yt-watch") === "0" ||
      el.getAttribute("data-eq-yt-poster") === "minimal";
    if (minimal) el.classList.add("eq-yt--poster-minimal");
    buildPoster(el, { minimal: minimal });
    queueAutoplayUnlock();
  }

  function initEl(el) {
    var id = el.getAttribute("data-eq-yt-id");
    if (!id || el.getAttribute("data-eq-yt-ready") === "1") return;
    el.setAttribute("data-eq-yt-ready", "1");

    if (el.getAttribute("data-eq-yt-autoplay") === "1") {
      initAutoplay(el);
      return;
    }

    var title = el.getAttribute("data-eq-yt-title") || "YouTube video";
    var playLabel =
      el.getAttribute("data-eq-yt-play-label") || "Videoyu oynat";
    var watchLabel =
      el.getAttribute("data-eq-yt-watch-label") || "YouTube'da izle";
    var showWatch = el.getAttribute("data-eq-yt-watch") !== "0";
    var watchUrl =
      "https://www.youtube.com/watch?v=" + encodeURIComponent(id);

    var html =
      '<button type="button" class="eq-yt__btn" aria-label="' +
      escapeAttr(playLabel) +
      '">' +
      '<img class="eq-yt__thumb" src="' +
      thumbUrl(id) +
      '" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/' +
      encodeURIComponent(id) +
      "/hqdefault.jpg'\">" +
      '<span class="eq-yt__shade" aria-hidden="true"></span>' +
      '<span class="eq-yt__label"><span class="eq-yt__icon" aria-hidden="true"></span>' +
      '<span class="eq-yt__txt">' +
      escapeHtml(playLabel) +
      "</span></span>" +
      "</button>";

    if (showWatch) {
      html +=
        '<a class="eq-yt__watch" href="' +
        watchUrl +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(watchLabel) +
        "</a>";
    }

    el.innerHTML = html;

    var btn = el.querySelector(".eq-yt__btn");
    if (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        activate(el);
      });
    }
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function init(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".eq-yt").forEach(initEl);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init(document);
    });
  } else {
    init(document);
  }

  window.__eqYoutubeEmbedInit = init;
  window.__eqYoutubeActivate = activate;
})();
