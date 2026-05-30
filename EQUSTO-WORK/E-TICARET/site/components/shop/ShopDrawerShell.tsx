"use client";

export default function ShopDrawerShell() {
  return (
    <>
      <div className="drawer-overlay" id="drawerOverlay" onClick={(e) => {
        const fn = (window as Window & { __eqDrawerBackdropClick?: (ev: unknown) => void }).__eqDrawerBackdropClick;
        fn?.(e);
      }}>
        <button
          type="button"
          className="drawer-overlay-close"
          onClick={(e) => {
            const fn = (window as Window & { __eqDrawerCloseX?: (ev: unknown) => void }).__eqDrawerCloseX;
            fn?.(e);
          }}
          aria-label="Kapat"
          data-i18n-attr="aria-label:common.close_x"
        >
          ×
        </button>
      </div>
      <div className="cat-drawer eq-amazon-shop-all" id="catDrawer" aria-hidden="true" />
    </>
  );
}
