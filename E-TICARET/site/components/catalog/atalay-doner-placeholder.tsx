/** Harici SVG dosyasına bağlı kalmadan ürün görseli yedeği */
export function AtalayDonerPlaceholder({ modelCode }: { modelCode: string }) {
  return (
    <div
      className="w-full sm:w-80 aspect-[4/3] flex flex-col items-center justify-center border border-neutral-200 rounded-lg bg-gradient-to-b from-neutral-50 to-neutral-100 p-6 text-center"
      role="img"
      aria-label={`${modelCode} ürün görseli henüz yüklenmedi`}
    >
      <svg
        viewBox="0 0 120 80"
        className="w-24 h-16 text-neutral-300 mb-4"
        aria-hidden
      >
        <rect x="8" y="12" width="104" height="56" rx="6" fill="currentColor" opacity="0.35" />
        <circle cx="60" cy="40" r="18" fill="currentColor" opacity="0.5" />
        <rect x="52" y="8" width="16" height="10" rx="2" fill="currentColor" opacity="0.45" />
      </svg>
      <p className="text-sm font-medium text-neutral-600">Atalay Döner Ocağı</p>
      <p className="text-lg font-semibold text-neutral-800 mt-1">{modelCode}</p>
      <p className="text-xs text-neutral-500 mt-3">Ürün fotoğrafı yakında</p>
    </div>
  );
}
