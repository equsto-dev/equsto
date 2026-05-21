import Link from "next/link";

const LEGACY = [
  { href: "/pfos", label: "PFOS" },
  { href: "/besos", label: "BESOS / Bar Design" },
  { href: "/admin.html", label: "Admin" },
];

export function StoreShell({
  children,
  title,
  fullBleed,
}: {
  children: React.ReactNode;
  title?: string;
  /** Ana sayfa (Vitrum tarzı) — tam genişlik */
  fullBleed?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col border-neutral-200">
      <header className="border-b border-neutral-200 px-4 py-3">
        <div
          className={`mx-auto flex flex-wrap items-center gap-4 justify-between ${fullBleed ? "max-w-[90rem]" : "max-w-6xl"}`}
        >
          <Link href="/" className="font-semibold tracking-tight text-neutral-900">
            EQUSTO
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm text-neutral-600">
            <Link href="/arama">Arama</Link>
            <Link href="/kategori/pisirme">Pişirme</Link>
            <Link href="/marka/atalay">Atalay</Link>
            {LEGACY.map((l) => (
              <Link key={l.href} href={l.href} className="text-neutral-500">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main
        className={
          fullBleed
            ? "flex-1 w-full"
            : "flex-1 mx-auto w-full max-w-6xl px-4 py-8"
        }
      >
        {title && !fullBleed ? (
          <h1 className="text-2xl font-semibold text-neutral-900 mb-6">{title}</h1>
        ) : null}
        {children}
      </main>
      <footer className="border-t border-neutral-200 px-4 py-4 text-center text-xs text-neutral-500">
        Sprint 0 — iskelet mağaza (renk/marka kimliği sonra)
      </footer>
    </div>
  );
}
