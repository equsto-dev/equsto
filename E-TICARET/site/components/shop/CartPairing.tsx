"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

function readCookie(name: string): string | null {
  try {
    const m = String(document.cookie || "").match(
      new RegExp(String.raw`(?:^|;\s*)${name}=([^;]+)`),
    );
    return m ? decodeURIComponent(m[1]!) : null;
  } catch {
    return null;
  }
}

function readSyncToken(): string | null {
  // legacy cart client stores this key
  try {
    const t = localStorage.getItem("equsto_cart_sync_v1");
    if (t && /^[0-9a-f-]{36}$/i.test(t)) return t.toLowerCase();
  } catch {
    /* ignore */
  }
  const c = readCookie("equsto_cart_sync");
  if (c && /^[0-9a-f-]{36}$/i.test(c)) return c.toLowerCase();
  return null;
}

export default function CartPairing() {
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSyncToken(readSyncToken());
  }, []);

  const pairUrl = useMemo(() => {
    if (!syncToken) return null;
    const u = new URL("/api/shop/cart/pair", window.location.origin);
    u.searchParams.set("syncToken", syncToken);
    u.searchParams.set("next", "/sepet");
    return u.toString();
  }, [syncToken]);

  useEffect(() => {
    let alive = true;
    setQrDataUrl(null);
    if (!pairUrl) return;
    void QRCode.toDataURL(pairUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 164,
      color: { dark: "#001e50", light: "#ffffff" },
    }).then((url: string) => {
      if (!alive) return;
      setQrDataUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [pairUrl]);

  if (!syncToken || !pairUrl) return null;

  return (
    <aside className="eq-cart-pair" aria-label="Telefon ile sepet eşleştirme">
      <div className="eq-cart-pair__hd">
        <div className="eq-cart-pair__title">Telefonla eşleştir</div>
        <div className="eq-cart-pair__sub">
          QR kodu okutun; telefonda aynı sepet açılır.
        </div>
      </div>
      <div className="eq-cart-pair__body">
        <div className="eq-cart-pair__qr">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="" width={164} height={164} />
          ) : (
            <div className="eq-cart-pair__qrph" aria-hidden="true" />
          )}
        </div>
        <div className="eq-cart-pair__actions">
          <a className="eq-cart-pair__link" href={pairUrl} target="_blank" rel="noreferrer">
            Linki aç
          </a>
          <button
            type="button"
            className="eq-cart-pair__btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(pairUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              } catch {
                window.prompt("Linki kopyalayın:", pairUrl);
              }
            }}
          >
            {copied ? "Kopyalandı" : "Linki kopyala"}
          </button>
          <div className="eq-cart-pair__token" title="Sepet eşleşme anahtarı">
            {syncToken.slice(0, 8)}…
          </div>
        </div>
      </div>
    </aside>
  );
}

