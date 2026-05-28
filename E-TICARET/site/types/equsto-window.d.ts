/** public/*.js script'lerinin window üzerine yazdığı API'ler */
export {};

declare global {
  interface Window {
    __eqYoutubeEmbedInit?: () => void;
    __eqYoutubeActivate?: (root?: ParentNode) => void;
  }
}
