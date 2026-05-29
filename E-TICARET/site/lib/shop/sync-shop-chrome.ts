/** Üst krom yüksekliği — filtre sütunu / çekmece ofseti */
export function mountEqShopChromeLayout(): () => void {
  if (typeof document === "undefined") return () => {};

  const sync = () => {
    const chrome =
      document.querySelector<HTMLElement>("#eq-shop-chrome-root .eq-shop-chrome") ||
      document.querySelector<HTMLElement>(".eq-shop-chrome");
    if (!chrome) return;

    const h = Math.round(chrome.getBoundingClientRect().height);
    if (h <= 0) return;

    document.documentElement.style.setProperty("--eq-shop-chrome-h", `${h}px`);
    document.documentElement.style.setProperty("--eq-filter-col-sticky-top", `${h}px`);
    document.documentElement.style.setProperty("--eq-drawer-chrome-top", `${h}px`);

    const besosTab = document.querySelector<HTMLElement>(".topnav-item.topnav-besos");
    const topnav = besosTab?.closest<HTMLElement>("nav.topnav");
    if (besosTab && topnav && topnav.scrollWidth > topnav.clientWidth + 2) {
      const left = Math.max(0, besosTab.offsetLeft - 12);
      if (Math.abs(topnav.scrollLeft - left) > 4) topnav.scrollLeft = left;
    }
  };

  sync();
  const t1 = window.setTimeout(sync, 0);
  const t2 = window.setTimeout(sync, 120);
  const t3 = window.setTimeout(sync, 480);

  const root = document.getElementById("eq-shop-chrome-root");
  const chrome = root?.querySelector(".eq-shop-chrome") || document.querySelector(".eq-shop-chrome");
  let ro: ResizeObserver | null = null;
  if (chrome && typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(sync);
    ro.observe(chrome);
  }

  window.addEventListener("resize", sync);
  window.addEventListener("equsto:i18n-ready", sync);

  return () => {
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    window.clearTimeout(t3);
    ro?.disconnect();
    window.removeEventListener("resize", sync);
    window.removeEventListener("equsto:i18n-ready", sync);
    document.documentElement.style.removeProperty("--eq-shop-chrome-h");
  };
}
