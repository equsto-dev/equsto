/** Besos header — eqGo yüklenmeden önce yedek yollar */
export const EQ_DEPT_PATH: Record<string, string> = {
  home: "/",
  shop: "/shop",
  pfos: "/pfos",
  besos: "/besos",
  contact: "/contact",
  cart: "/sepet",
  pisirme: "/shop/pisirme",
  sogutma: "/shop/sogutma",
  kahve: "/shop/kahve",
  yikama: "/shop/yikama",
  hazirlik: "/shop/hazirlik",
  icecek: "/shop/icecek",
};

export function goEqDept(key: string): void {
  if (typeof window === "undefined") return;
  const eqGo = (window as Window & { eqGo?: (k: string) => void }).eqGo;
  if (typeof eqGo === "function") {
    eqGo(key);
    return;
  }
  const href = EQ_DEPT_PATH[key];
  if (href) window.location.href = href;
}

export function toggleEqDrawer(): void {
  if (typeof window === "undefined") return;
  const toggle = (window as Window & { toggleDrawer?: () => void }).toggleDrawer;
  if (typeof toggle === "function") toggle();
}

export function goEqCart(): void {
  if (typeof window === "undefined") return;
  const cart = (window as Window & { EqustoCart?: { goToCartPage?: () => void } })
    .EqustoCart;
  if (cart?.goToCartPage) {
    cart.goToCartPage();
    return;
  }
  const equstoUrl = (window as Window & { equstoUrl?: (k: string) => string })
    .equstoUrl;
  window.location.href =
    typeof equstoUrl === "function" ? equstoUrl("cart") : EQ_DEPT_PATH.cart;
}

export function submitBesosSearch(query: string): void {
  if (typeof window === "undefined") return;
  const q = String(query || "").trim();
  if (!q) return;

  const filter = (window as Window & { filterStations?: (s: string) => void })
    .filterStations;
  if (typeof filter === "function") {
    filter(q);
    document.getElementById("bd-stations")?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  const dispatch = (
    window as Window & { __eqSearchDispatch?: (s: string, o?: object) => void }
  ).__eqSearchDispatch;
  if (typeof dispatch === "function") {
    dispatch(q, { scroll: true });
    return;
  }

  window.location.href = `/arama?q=${encodeURIComponent(q)}`;
}
