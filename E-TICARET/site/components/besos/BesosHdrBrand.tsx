type BesosHdrBrandProps = {
  active?: "vitrin" | "imt300" | "module";
};

export default function BesosHdrBrand({ active = "vitrin" }: BesosHdrBrandProps) {
  return (
    <div className="bd-hdr-brand">
      <a className="bd-hdr-wordmark" href="/" aria-label="Equsto" />
      <div className="bd-hdr-studio">Bar Design Studio</div>
      <nav className="bd-hdr-nav" aria-label="Besos">
        <a href="/besos" className={active === "vitrin" ? "is-active" : undefined}>
          Vitrin
        </a>
        <a href="/besos#bd-stations" className={active === "module" ? "is-active" : undefined}>
          Modüller
        </a>
        <a href="/besos#bd-vitrum-projects">Projeler</a>
        <a href="/besos/imt300" className={active === "imt300" ? "is-active" : undefined}>
          IMT300
        </a>
        <a href="/besos#bd-foot">Teklif iste</a>
        <a href="/" className="bd-hdr-equsto">
          ↗ Equsto
        </a>
      </nav>
    </div>
  );
}
