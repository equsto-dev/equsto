export type SiteVideo = {
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  relatedHref: string;
  relatedLabel: string;
  youtubeId?: string;
  contentUrl?: string;
  contentType?: "video/mp4" | "video/webm";
  webmUrl?: string;
};

export const VITRUM_BARS_HERO_MP4 =
  "https://cdn.prod.website-files.com/678a5dce92e76b8ef57ebc9d%2F678fcaaaeb2ce6f77c20ab7a_vitrum%20bars%20hero-transcode.mp4";
export const VITRUM_BARS_HERO_WEBM =
  "https://cdn.prod.website-files.com/678a5dce92e76b8ef57ebc9d%2F678fcaaaeb2ce6f77c20ab7a_vitrum%20bars%20hero-transcode.webm";
export const VITRUM_BARS_HERO_POSTER =
  "https://cdn.prod.website-files.com/678a5dce92e76b8ef57ebc9d%2F678fcaaaeb2ce6f77c20ab7a_vitrum%20bars%20hero-poster-00001.jpg";

export const SITE_VIDEOS: SiteVideo[] = [
  {
    slug: "imt300-berrak-buz",
    title: "IMT300 ticari berrak buz makinesi",
    description:
      "Skyra IMT300 berrak buz makinesi: kesim gerektirmeden küp, küre, çubuk ve elmas buz. Bar, otel ve restoran projeleri için Equsto Besos vitrininde.",
    thumbnailUrl: "https://i.ytimg.com/vi/cOVgfu2o4h4/hqdefault.jpg",
    uploadDate: "2024-06-01",
    relatedHref: "/besos/imt300",
    relatedLabel: "IMT300 ürün sayfası",
    youtubeId: "cOVgfu2o4h4",
  },
  {
    slug: "besos-bar-modulleri",
    title: "Besos modüler bar hatları",
    description:
      "Besos · Bar Design Studio modüler kokteyl bar istasyonları. Otel, restoran ve lounge projeleri için paslanmaz bar hatları.",
    thumbnailUrl: VITRUM_BARS_HERO_POSTER,
    uploadDate: "2026-06-13",
    relatedHref: "/besos",
    relatedLabel: "Besos bar vitrini",
    contentUrl: VITRUM_BARS_HERO_MP4,
    contentType: "video/mp4",
    webmUrl: VITRUM_BARS_HERO_WEBM,
  },
];

export function getSiteVideo(slug: string): SiteVideo | undefined {
  return SITE_VIDEOS.find((v) => v.slug === slug);
}

export function videoWatchPath(slug: string): string {
  return `/videolar/${slug}`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`;
}
