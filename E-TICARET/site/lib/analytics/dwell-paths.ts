/** Kullanıcı raporu dwell path çözümleyicisi — shop / Besos / PFOS */

export type TrackedPathInfo = {
  locale: string;
  dept: string;
  slug: string;
};

/** Shop PDP, Besos PDP/landing ve PFOS path’lerini çözümler. */
export function parseTrackablePath(pathname: string): TrackedPathInfo | null {
  const p = String(pathname || "");
  const shop = p.match(/^\/(en\/)?shop\/([^/]+)\/([^/?#]+)/i);
  if (shop) {
    return {
      locale: shop[1] ? "en" : "tr",
      dept: decodeURIComponent(shop[2]),
      slug: decodeURIComponent(shop[3]),
    };
  }

  const besosModul = p.match(/^\/(en\/)?besos\/modul\/([^/?#]+)/i);
  if (besosModul) {
    return {
      locale: besosModul[1] ? "en" : "tr",
      dept: "besos-modul",
      slug: decodeURIComponent(besosModul[2]),
    };
  }

  const besosUb = p.match(/^\/(en\/)?besos\/(bardaklar|bar-ekipman)\/([^/?#]+)/i);
  if (besosUb) {
    return {
      locale: besosUb[1] ? "en" : "tr",
      dept: `besos-${besosUb[2].toLowerCase()}`,
      slug: decodeURIComponent(besosUb[3]),
    };
  }

  const besosLanding = p.match(
    /^\/(en\/)?besos\/(bar-istasyonlari|imt300|bardaklar|bar-ekipman)\/?$/i,
  );
  if (besosLanding) {
    return {
      locale: besosLanding[1] ? "en" : "tr",
      dept: "besos",
      slug: besosLanding[2].toLowerCase(),
    };
  }

  const besosRoot = p.match(/^\/(en\/)?besos\/?$/i);
  if (besosRoot) {
    return {
      locale: besosRoot[1] ? "en" : "tr",
      dept: "besos",
      slug: "besos",
    };
  }

  const imtAlias = p.match(/^\/(en\/)?imt300\/?$/i);
  if (imtAlias) {
    return {
      locale: imtAlias[1] ? "en" : "tr",
      dept: "besos",
      slug: "imt300",
    };
  }

  const pfos = p.match(/^\/(en\/)?pfos\/?$/i);
  if (pfos) {
    return {
      locale: pfos[1] ? "en" : "tr",
      dept: "pfos",
      slug: "pfos",
    };
  }

  return null;
}

export function localeFromPath(pathname: string): string {
  return /^\/en(\/|$)/i.test(pathname || "") ? "en" : "tr";
}

/** Yönetim kullanıcı raporu linkleri */
export function kullaniciRaporHref(r: {
  dept?: string;
  slug?: string;
  path?: string;
}): string {
  if (r.path && r.path.startsWith("/")) return r.path;
  const dept = String(r.dept || "");
  const slug = String(r.slug || "");
  if (dept === "pfos" || slug === "pfos") return "/pfos";
  if (dept === "besos") {
    if (slug === "besos") return "/besos";
    if (slug === "imt300") return "/besos/imt300";
    if (slug === "bar-istasyonlari") return "/besos/bar-istasyonlari";
    if (slug === "bardaklar") return "/besos/bardaklar";
    if (slug === "bar-ekipman") return "/besos/bar-ekipman";
    return `/besos/${encodeURIComponent(slug)}`;
  }
  if (dept === "besos-modul") return `/besos/modul/${encodeURIComponent(slug)}`;
  if (dept === "besos-bardaklar") return `/besos/bardaklar/${encodeURIComponent(slug)}`;
  if (dept === "besos-bar-ekipman") return `/besos/bar-ekipman/${encodeURIComponent(slug)}`;
  return `/shop/${dept || "pisirme"}/${encodeURIComponent(slug)}`;
}
