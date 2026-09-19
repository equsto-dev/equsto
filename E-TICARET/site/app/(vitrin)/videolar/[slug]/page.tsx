import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VideoObjectJsonLd from "@/components/seo/VideoObjectJsonLd";
import VitrinShell from "@/components/vitrin/VitrinShell";
import {
  getSiteVideo,
  SITE_VIDEOS,
  videoWatchPath,
  youtubeEmbedUrl,
} from "@/lib/seo/site-videos";
import { VIDEO_HUB_CSS } from "@/lib/vitrin/page-css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SITE_VIDEOS.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = getSiteVideo(slug);
  if (!video) return { title: "Video bulunamadı · Equsto", robots: { index: false } };
  const path = videoWatchPath(video.slug);
  return {
    title: `${video.title} · Equsto`,
    description: video.description,
    alternates: { canonical: `https://equsto.com${path}` },
    openGraph: {
      title: video.title,
      description: video.description,
      url: `https://equsto.com${path}`,
      type: "video.other",
      images: [{ url: video.thumbnailUrl }],
    },
  };
}

export default async function VideoWatchPage({ params }: Props) {
  const { slug } = await params;
  const video = getSiteVideo(slug);
  if (!video) notFound();

  return (
    <VitrinShell bodyClass="eq-shop eq-videolar" extraCss={VIDEO_HUB_CSS}>
      <VideoObjectJsonLd video={video} />
      <main className="eq-vid-main">
        <p className="eq-vid-bc">
          <Link href="/videolar">Videolar</Link>
          {" / "}
          <span>{video.title}</span>
        </p>
        <h1>{video.title}</h1>
        <div className="eq-vid-player">
          {video.youtubeId ? (
            <iframe
              src={youtubeEmbedUrl(video.youtubeId)}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <video
              controls
              playsInline
              poster={video.thumbnailUrl}
              preload="metadata"
            >
              {video.webmUrl ? <source src={video.webmUrl} type="video/webm" /> : null}
              {video.contentUrl ? (
                <source src={video.contentUrl} type={video.contentType || "video/mp4"} />
              ) : null}
            </video>
          )}
        </div>
        <p className="eq-vid-lead">{video.description}</p>
        <div className="eq-vid-actions">
          <Link className="eq-vid-a-primary" href={video.relatedHref}>
            {video.relatedLabel}
          </Link>
          <Link className="eq-vid-a-secondary" href="/videolar">
            Tüm videolar
          </Link>
        </div>
      </main>
    </VitrinShell>
  );
}
