/** pfos-referans-sku-links.json anahtarı: {listeKey}|{POZ} */
export function referansLinkKey(listeKey: string, poz: string): string {
  return `${listeKey.trim().toLowerCase()}|${poz.trim().toUpperCase()}`;
}

export function parseReferansLinkKey(linkKey: string): { listeKey: string; poz: string } | null {
  const i = linkKey.indexOf("|");
  if (i <= 0) return null;
  return {
    listeKey: linkKey.slice(0, i).trim().toLowerCase(),
    poz: linkKey.slice(i + 1).trim().toUpperCase(),
  };
}
