/** Besos hero — YouTube nocookie embed (SSR + client aynı URL). */
export const BESOS_HERO_YT_ID = "cOVgfu2o4h4";

const EMBED_ORIGIN = "https://equsto.com";

export function besosHeroYoutubeEmbedUrl(
  videoId: string = BESOS_HERO_YT_ID,
  origin: string = EMBED_ORIGIN,
): string {
  const q = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    origin,
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: videoId,
    controls: "0",
    disablekb: "1",
    iv_load_policy: "3",
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${q.toString()}`;
}
