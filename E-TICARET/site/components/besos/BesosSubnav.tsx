"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SubnavItem = {
  key: string;
  href: (en: boolean) => string;
  labelTr: string;
  labelEn: string;
  icon: ReactNode;
  isActive: (pathname: string | null) => boolean;
};

/** Coupe / kokteyl bardağı */
function IcoBardaklar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M6 4h12l-2.5 9.5c-.4 1.5-1.6 2.5-3.5 2.5s-3.1-1-3.5-2.5L6 4z" />
      <path d="M12 16v3" />
      <path d="M9 21h6" />
    </svg>
  );
}

/** Bar ekipmanı — süzgeç / jigger */
function IcoBarEkipman() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <ellipse cx="12" cy="8" rx="7" ry="3.5" />
      <path d="M5 8v2c0 2.2 3.1 4 7 4s7-1.8 7-4V8" />
      <path d="M12 12v8" />
      <path d="M9.5 20h5" />
      <path d="M8 6.5c2 .8 6 .8 8 0" />
    </svg>
  );
}

/** Buz makinesi — dikey ünite */
function IcoBuzMakinesi() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <rect x="7" y="3" width="10" height="18" rx="1.5" />
      <rect x="9" y="5.5" width="6" height="4" rx=".5" />
      <path d="M9 12h6M9 15h6M9 18h4" />
      <path d="M10 21h4" />
    </svg>
  );
}

/** Modüler bar istasyonu */
function IcoBarIstasyon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <rect x="2" y="10" width="6" height="9" rx=".5" />
      <rect x="9" y="7" width="6" height="12" rx=".5" />
      <rect x="16" y="10" width="6" height="9" rx=".5" />
      <path d="M3 10V8h4v2M10 7V5h4v2M17 10V8h4v2" />
      <path d="M11 13h2M11 16h2" />
    </svg>
  );
}

const ITEMS: SubnavItem[] = [
  {
    key: "bardaklar",
    href: (en) => (en ? "/en/shop/icecek" : "/shop/icecek"),
    labelTr: "Bardaklar",
    labelEn: "Glassware",
    icon: <IcoBardaklar />,
    isActive: (pathname) => !!pathname?.includes("/shop/icecek"),
  },
  {
    key: "bar-ekipman",
    href: (en) => (en ? "/en/shop/hazirlik" : "/shop/hazirlik"),
    labelTr: "Bar Ekipmanları",
    labelEn: "Bar Equipment",
    icon: <IcoBarEkipman />,
    isActive: (pathname) => !!pathname?.includes("/shop/hazirlik"),
  },
  {
    key: "buz-makinesi",
    href: (en) => (en ? "/en/besos/imt300" : "/besos/imt300"),
    labelTr: "Buz Makinesi",
    labelEn: "Ice Machine",
    icon: <IcoBuzMakinesi />,
    isActive: (pathname) => !!pathname?.includes("/imt300"),
  },
  {
    key: "bar-istasyonlari",
    href: (en) => (en ? "/en/besos#bd-stations" : "/besos#bd-stations"),
    labelTr: "Bar İstasyonları",
    labelEn: "Bar Stations",
    icon: <IcoBarIstasyon />,
    isActive: (pathname) => {
      if (!pathname) return false;
      if (pathname.includes("/imt300")) return false;
      return !!pathname.match(/\/besos(\/modul\/|$)/);
    },
  },
];

/** Bar Design — header ile video arası bağımsız ikon şeridi */
export default function BesosSubnav() {
  const pathname = usePathname();
  const en = pathname?.startsWith("/en") ?? false;

  return (
    <nav className="bd-besos-subnav" aria-label={en ? "Bar Design categories" : "Bar Design kategorileri"}>
      <div className="bd-besos-subnav-inner">
        {ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const href = item.href(en);
          const label = en ? item.labelEn : item.labelTr;
          const className = `bd-besos-subnav-link${active ? " is-active" : ""}`;

          if (href.includes("#")) {
            return (
              <a key={item.key} className={className} href={href}>
                <span className="bd-besos-subnav-ico">{item.icon}</span>
                <span className="bd-besos-subnav-label">{label}</span>
              </a>
            );
          }

          return (
            <Link key={item.key} className={className} href={href}>
              <span className="bd-besos-subnav-ico">{item.icon}</span>
              <span className="bd-besos-subnav-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
