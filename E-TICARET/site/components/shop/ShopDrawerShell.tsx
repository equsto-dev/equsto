"use client";

export default function ShopDrawerShell() {
  return (
    <>
      <div className="drawer-overlay" id="drawerOverlay" onClick={(e) => {
        const fn = (window as Window & { __eqDrawerBackdropClick?: (ev: unknown) => void }).__eqDrawerBackdropClick;
        fn?.(e);
      }} />
      <div className="cat-drawer eq-amazon-shop-all" id="catDrawer" aria-hidden="true" />
    </>
  );
}
