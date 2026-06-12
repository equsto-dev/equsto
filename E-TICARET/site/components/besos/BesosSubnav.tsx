"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BESOS_SUBNAV_ICON_V } from "@/lib/shop/assets";

type SubnavItem = {
  key: string;
  href: (en: boolean) => string;
  labelTr: string;
  labelEn: string;
  iconSrc: string;
  isActive: (pathname: string | null) => boolean;
};

const ICON_V = BESOS_SUBNAV_ICON_V;

const ITEMS: SubnavItem[] = [
  {
    key: "bardaklar",
    href: (en) => (en ? "/en/besos/bardaklar" : "/besos/bardaklar"),
    labelTr: "Bardaklar",
    labelEn: "Glassware",
    iconSrc: `/besos/subnav/glassware.png?v=${ICON_V}`,
    isActive: (pathname) => !!pathname?.includes("/besos/bardaklar"),
  },
  {
    key: "buz-makinesi",
    href: (en) => (en ? "/en/besos/imt300" : "/besos/imt300"),
    labelTr: "Buz Makinesi",
    labelEn: "Ice Machine",
    iconSrc: `/besos/subnav/ice-machine.png?v=${ICON_V}`,
    isActive: (pathname) => !!pathname?.includes("/imt300"),
  },
  {
    key: "bar-ekipman",
    href: (en) => (en ? "/en/besos/bar-ekipman" : "/besos/bar-ekipman"),
    labelTr: "Bar Ekipmanları",
    labelEn: "Bar Equipment",
    iconSrc: `/besos/subnav/bar-equipment.png?v=${ICON_V}`,
    isActive: (pathname) => !!pathname?.includes("/besos/bar-ekipman"),
  },
  {
    key: "bar-istasyonlari",
    href: (en) => (en ? "/en/besos/bar-istasyonlari" : "/besos/bar-istasyonlari"),
    labelTr: "Bar İstasyonları",
    labelEn: "Bar Stations",
    iconSrc: `/besos/subnav/bar-stations.png?v=${ICON_V}`,
    isActive: (pathname) => {
      if (!pathname) return false;
      if (pathname.includes("/imt300")) return false;
      return (
        !!pathname.includes("/besos/bar-istasyonlari") ||
        !!pathname.match(/\/besos(\/modul\/|$)/)
      );
    },
  },
];

/** Bar Design — header ile video arası bağımsız ikon şeridi (Vitrum referans ikonları) */
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
          const icon = (
            <span className="bd-besos-subnav-ico">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.iconSrc} alt="" aria-hidden="true" decoding="async" draggable={false} />
            </span>
          );

          if (href.includes("#")) {
            return (
              <a key={item.key} className={className} href={href}>
                {icon}
                <span className="bd-besos-subnav-label">{label}</span>
              </a>
            );
          }

          return (
            <Link key={item.key} className={className} href={href}>
              {icon}
              <span className="bd-besos-subnav-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
