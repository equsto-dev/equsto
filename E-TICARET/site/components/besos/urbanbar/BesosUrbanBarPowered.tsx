import { URBAN_BAR_SITE_URL } from "@/lib/besos/urbanbar/branding";

type Props = {
  className?: string;
};

export default function BesosUrbanBarPowered({ className }: Props) {
  return (
    <p className={["ub-besos-powered", className].filter(Boolean).join(" ")}>
      Powered By{" "}
      <a href={URBAN_BAR_SITE_URL} target="_blank" rel="noopener noreferrer">
        <strong>Urban Bar</strong>
      </a>
    </p>
  );
}
