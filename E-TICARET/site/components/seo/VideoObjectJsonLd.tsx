import { getSiteOrigin } from "@/lib/site-origin";
import {
  type SiteVideo,
  videoWatchPath,
  youtubeEmbedUrl,
  youtubeWatchUrl,
} from "@/lib/seo/site-videos";

export default function VideoObjectJsonLd({ video }: { video: SiteVideo }) {
  const origin = getSiteOrigin();
  const watchUrl = `${origin}${videoWatchPath(video.slug)}`;
  const embedUrl = video.youtubeId ? youtubeEmbedUrl(video.youtubeId) : undefined;

  const data = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: [video.thumbnailUrl],
    uploadDate: video.uploadDate,
    url: watchUrl,
    mainEntityOfPage: watchUrl,
    ...(embedUrl ? { embedUrl } : {}),
    ...(video.youtubeId ? { contentUrl: youtubeWatchUrl(video.youtubeId) } : {}),
    ...(video.contentUrl && !video.youtubeId ? { contentUrl: video.contentUrl } : {}),
    publisher: {
      "@type": "Organization",
      name: "Equsto",
      url: origin,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
