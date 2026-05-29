/** Sabit üst krom (.eq-shop-chrome) yüksekliği — spacer + filtre/çekmece ofseti */
export function mountEqShopChromeLayout(): () => void {
  if (typeof document === "undefined") return () => {};

  const sync = () => {
    const chrome = document.querySelector<HTMLElement>(".eq-shop-chrome");
    if (!chrome) return;
    const fixed =
      chrome.classList.contains("eq-shop-chrome--fixed") ||
      getComputedStyle(chrome).position === "fixed";
    if (!fixed) return;

    const h = Math.round(chrome.getBoundingClientRect().height);
    if (h <= 0) return;

    document.documentElement.style.setProperty("--eq-shop-chrome-h", `${h}px`);
    document.documentElement.style.setProperty("--eq-filter-col-sticky-top", `${h}px`);
    document.documentElement.style.setProperty("--eq-drawer-chrome-top", `${h}px`);

    document.querySelectorAll<HTMLElement>(".eq-shop-chrome-spacer").forEach((el) => {
      el.style.height = `${h}px`;
    });
  };

  sync();
  const t1 = window.setTimeout(sync, 0);
  const t2 = window.setTimeout(sync, 120);
  const t3 = window.setTimeout(sync, 480);

  const chrome = document.querySelector(".eq-shop-chrome");
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
