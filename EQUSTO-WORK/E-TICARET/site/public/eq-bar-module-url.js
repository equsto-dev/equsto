/**
 * Vitrum bar modülü slug + kanonik URL (Besos / bar-design).
 */
(function () {
  "use strict";

  function stripDiacritics(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function vitrumModuleSlug(p) {
    if (!p) return "";
    if (p.slug) return String(p.slug).trim();
    var raw =
      p.code ||
      p.name ||
      (p.page != null ? "modul-p" + p.page : "");
    var slug = stripDiacritics(String(raw))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (p.page != null) slug = slug || "modul-p" + p.page;
    return slug;
  }

  function vitrumModuleLangPrefix() {
    try {
      if (window.eqLang === "en" || /^\/en(\/|$)/i.test(location.pathname || "")) return "/en";
    } catch (_) {}
    return "";
  }

  function vitrumModulePath(slug) {
    slug = String(slug || "").trim();
    var base = vitrumModuleLangPrefix() + "/besos";
    if (!slug) return base;
    return base + "/modul/" + encodeURIComponent(slug);
  }

  function vitrumModuleHref(p) {
    var slug = typeof p === "string" ? p : vitrumModuleSlug(p);
    if (typeof window.equstoResolveNavHref === "function") {
      return window.equstoResolveNavHref(vitrumModulePath(slug));
    }
    return vitrumModulePath(slug);
  }

  function findModuleBySlug(list, slug) {
    slug = String(slug || "").toLowerCase();
    if (!slug || !Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i++) {
      if (vitrumModuleSlug(list[i]) === slug) return list[i];
    }
    return null;
  }

  window.vitrumModuleSlug = vitrumModuleSlug;
  window.vitrumModulePath = vitrumModulePath;
  window.vitrumModuleHref = vitrumModuleHref;
  window.findVitrumModuleBySlug = findModuleBySlug;
})();
