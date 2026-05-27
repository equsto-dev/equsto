"use client";

/** Kategori çekmecesi — nav.js için gerekli DOM (bar-design.html ile aynı) */
export default function BesosDrawerShell() {
  return (
    <>
      <div
        className="drawer-overlay"
        id="drawerOverlay"
        onClick={(e) => {
          const fn = (
            window as Window & {
              __eqDrawerBackdropClick?: (ev: React.MouseEvent) => void;
            }
          ).__eqDrawerBackdropClick;
          fn?.(e);
        }}
      >
        <button
          type="button"
          className="drawer-overlay-close"
          aria-label="Kapat"
          onClick={(e) => {
            e.stopPropagation();
            const fn = (
              window as Window & {
                __eqDrawerCloseX?: (ev: React.MouseEvent) => void;
              }
            ).__eqDrawerCloseX;
            fn?.(e);
          }}
        >
          ×
        </button>
      </div>
      <div className="cat-drawer eq-amazon-shop-all" id="catDrawer" aria-hidden="true" />
    </>
  );
}
