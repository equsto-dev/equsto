import PFOSWizard from "@/components/pfos/PFOSWizard";

export const metadata = {
  title: "Proje Fabrikası — Equsto",
  description:
    "Konsept, alan ve şehrinizi girin; ekipman listeniz ve tahmini maliyetiniz hazır olsun.",
};

export default function PFOSPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <div
        style={{
          borderBottom: "1px solid #eee",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <a
          href="/"
          style={{
            fontSize: 18,
            fontWeight: 700,
            textDecoration: "none",
            color: "#000",
          }}
        >
          EQUSTO
        </a>
        <span style={{ color: "#ccc" }}>›</span>
        <span style={{ fontSize: 14, color: "#666" }}>Proje Fabrikası</span>
      </div>

      <div style={{ padding: "40px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            DÜNYADA BİR İLK
          </h1>
          <p style={{ fontSize: 15, color: "#666", marginBottom: 40 }}>
            Konsept ve alan bilgilerinizi girin — ekipman listeniz ve tahmini
            altyapı maliyetiniz hazır olsun.
          </p>
          <PFOSWizard />
        </div>
      </div>
    </main>
  );
}
