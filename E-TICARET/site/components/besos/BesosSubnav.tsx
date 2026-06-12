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
  isActive: (pathname: string | null, en: boolean) => boolean;
};

function IcoGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IcoPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M10 9v6l5-3-5-3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IcoProjects() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true">
      <path d="M4 7h16v12H4z" />
      <path d="M8 7V5h8v2" />
      <path d="M9 12h6M9 15h4" />
    </svg>
  );
}

function IcoIce() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true">
      <path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function IcoQuote() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true">
      <path d="M4 6h16v12H4z" />
      <path d="M7 10h4M7 14h7" />
    </svg>
  );
}

const ITEMS: SubnavItem[] = [
  {
    key: "vitrin",
    href: (en) => (en ? "/en/besos#bd-hero" : "/besos#bd-hero"),
    labelTr: "Vitrin",
    labelEn: "Showcase",
    icon: <IcoPlay />,
    isActive: (pathname) => {
      if (!pathname) return false;
      return /^\/(?:en\/)?besos\/?$/.test(pathname);
    },
  },
  {
    key: "moduller",
    href: (en) => (en ? "/en/besos#bd-stations" : "/besos#bd-stations"),
    labelTr: "Modüller",
    labelEn: "Modules",
    icon: <IcoGrid />,
    isActive: (pathname) => !!pathname?.includes("/besos/modul/"),
  },
  {
    key: "projeler",
    href: (en) => (en ? "/en/besos#bd-vitrum-projects" : "/besos#bd-vitrum-projects"),
    labelTr: "Projeler",
    labelEn: "Projects",
    icon: <IcoProjects />,
    isActive: () => false,
  },
  {
    key: "imt300",
    href: (en) => (en ? "/en/besos/imt300" : "/besos/imt300"),
    labelTr: "IMT300",
    labelEn: "IMT300",
    icon: <IcoIce />,
    isActive: (pathname) => !!pathname?.includes("/imt300"),
  },
  {
    key: "teklif",
    href: (en) => (en ? "/en/iletisim" : "/iletisim"),
    labelTr: "Teklif iste",
    labelEn: "Get a quote",
    icon: <IcoQuote />,
    isActive: () => false,
  },
];

/** Bar Design — header ile video arası bağımsız ikon şeridi */
export default function BesosSubnav() {
  const pathname = usePathname();
  const en = pathname?.startsWith("/en") ?? false;

  return (
    <nav className="bd-besos-subnav" aria-label={en ? "Bar Design sections" : "Bar Design bölümleri"}>
      <div className="bd-besos-subnav-inner">
        {ITEMS.map((item) => {
          const active = item.isActive(pathname, en);
          const href = item.href(en);
          const label = en ? item.labelEn : item.labelTr;
          const className = `bd-besos-subnav-link${active ? " is-active" : ""}`;

          if (href.startsWith("#") || href.includes("#")) {
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
