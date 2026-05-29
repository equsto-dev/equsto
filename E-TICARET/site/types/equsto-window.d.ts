/** public/*.js script'lerinin window üzerine yazdığı API'ler */
export {};

declare global {
  interface Window {
    __eqRerenderNav?: () => void;
    __eqYoutubeEmbedInit?: () => void;
    __eqYoutubeActivate?: (root?: ParentNode) => void;
    EqMarkaHub?: { mount: (root: HTMLElement | null) => void };
    EqCategoryShell?: {
      mount: (opts: Record<string, unknown>) => void;
    };
    EqustoShopCatalog?: {
      load?: () => Promise<unknown[]>;
      loadMergedCatalog?: () => Promise<unknown[]>;
    };
    eqBrandFromSlug?: (slug: string) => string;
    eqBrandMatchesRow?: (row: { brand?: string; marka?: string; name?: string }, brand: string) => boolean;
  }
}
