/**
 * /en/besos — head meta + JSON-LD (EN). Sayfa gövdesine dokunmaz; yalnızca <head> günceller.
 */
(function () {
  var p = location.pathname || "";
  var isEn = p === "/en" || p === "/en/" || p.indexOf("/en/") === 0;
  if (!isEn) return;
  var m = window.__EQ_BESOS_HEAD_SEO_EN;
  if (!m) return;

  document.documentElement.lang = "en";

  function setMeta(name, content, attr) {
    if (content == null || content === "") return;
    attr = attr || "name";
    var el = document.querySelector("meta[" + attr + '="' + name + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  if (m.title) document.title = m.title;
  setMeta("description", m.description);
  if (m.keywords) setMeta("keywords", m.keywords);

  var canon = document.querySelector('link[rel="canonical"]');
  if (canon && m.canonical) canon.href = m.canonical;

  setMeta("og:locale", m.ogLocale || "en_US", "property");
  setMeta("og:title", m.ogTitle || m.title, "property");
  setMeta("og:description", m.ogDescription || m.description, "property");
  setMeta("og:url", m.ogUrl || m.canonical, "property");
  setMeta("twitter:title", m.twitterTitle || m.title);
  setMeta("twitter:description", m.twitterDescription || m.description);

  var ld = document.getElementById("eq-besos-seo-ld");
  if (ld && m.ld) ld.textContent = JSON.stringify(m.ld);
})();
