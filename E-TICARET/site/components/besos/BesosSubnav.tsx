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

/** Coupe bardağı — referans line-art */
function IcoBardaklar() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 6h12l-2.2 10.2c-.35 1.35-1.45 2.3-3.8 2.3s-3.45-.95-3.8-2.3L10 6z" />
      <path d="M16 18.5V24" />
      <path d="M12.5 26.5h7" />
    </svg>
  );
}

/** Hawthorne süzgeç — bar ekipmanları */
function IcoBarEkipman() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="14.5" cy="16" r="7" />
      <path d="M21.5 16H28" />
      <path d="M8.2 11.2c-1.1 1.4-1.6 3.1-1.3 4.8" />
      <path d="M7.4 14.2c-.4 1.6 0 3.3 1.1 4.6" />
      <path d="M8.3 17.1c.9 1.2 2.1 2 3.5 2.2" />
      <path d="M9.8 19.2c1.2.5 2.5.4 3.5-.2" />
      <path d="M11.5 20.5c1-.6 1.7-1.5 2-2.5" />
    </svg>
  );
}

/** Buz makinesi — referanstaki dikey ünite (Evebot formu) */
function IcoBuzMakinesi() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5.5h10a2 2 0 0 1 2 2v17a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-17a2 2 0 0 1 2-2z" />
      <rect x="13" y="8" width="6" height="5" rx=".8" />
      <path d="M14 16h4M14 19h4" />
      <path d="M13.5 24.5h5l-1 2.5h-3l-1-2.5z" />
      <path d="M12 27.5h8" />
    </svg>
  );
}

/** Modüler bar istasyonu — speed rail + şişeler */
function IcoBarIstasyon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 14v10h7V14" />
      <path d="M5 14V11h3v3" />
      <path d="M10 11v13h12V8" />
      <path d="M12 8V6h8v2" />
      <path d="M13 13v6M15.5 12.5v6.5M18 13v6M20.5 12.5v6.5" />
      <path d="M22 14v10h7V14" />
      <path d="M24 14V11h3v3" />
      <path d="M3 24h26" />
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
    key: "buz-makinesi",
    href: (en) => (en ? "/en/besos/imt300" : "/besos/imt300"),
    labelTr: "Buz Makinesi",
    labelEn: "Ice Machine",
    icon: <IcoBuzMakinesi />,
    isActive: (pathname) => !!pathname?.includes("/imt300"),
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
