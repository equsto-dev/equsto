import type { Metadata } from "next";
import Link from "next/link";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { VIDEO_HUB_CSS } from "@/lib/vitrin/page-css";
import { SITE_VIDEOS, videoWatchPath } from "@/lib/seo/site-videos";

export const metadata: Metadata = {
  title: "Videolar · Equsto",
  description:
    "Equsto Besos tanıtım videoları: IMT300 berrak buz makinesi ve modüler bar hatları.",
  alternates: { canonical: "https://equsto.com/videolar" },
};

export default function VideolarPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-videolar" extraCss={VIDEO_HUB_CSS}>
      <main className="eq-vid-main">
        <h1>Videolar</h1>
        <p className="eq-vid-lead">
          Besos · Bar Design Studio videoları. Her video kendi izleme sayfasında açılır.
        </p>
        <ul className="eq-vid-grid">
          {SITE_VIDEOS.map((video) => (
            <li key={video.slug}>
              <Link className="eq-vid-card" href={videoWatchPath(video.slug)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnailUrl} alt="" width={480} height={270} />
                <span className="eq-vid-card-title">{video.title}</span>
                <span className="eq-vid-card-desc">{video.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </VitrinShell>
  );
}
