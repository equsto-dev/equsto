"use client";

import { useEffect, useRef } from "react";

/**
 * CursorDotGrid
 * Tüm sayfayı kaplayan, imlecin etrafında camgöbeği renginde
 * parlayan nokta ızgarası efekti. Equsto'nun mevcut void/camgöbeği
 * dilini (#0B0C0E / #5EEAD4) kullanır.
 *
 * Kullanım: layout.tsx içinde <body> açılışının hemen altına
 * <CursorDotGrid /> olarak ekle. position: fixed olduğu için
 * içerik akışını etkilemez.
 */
export default function CursorDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SPACING = 21; // nokta aralığı (px) — %30 artırıldı (16 -> ~21)
    const RADIUS = 0.8; // baz nokta yarıçapı — %25 küçültüldü (1.1 -> 0.8)
    const GLOW_RADIUS = 220; // imlecin etkileme yarıçapı
    // Electrolux Professional mavisi (kullanıcının verdiği görselden örneklendi)
    const ACCENT = "0, 30, 80"; // #001E50

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function handleMove(e: PointerEvent) {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    }

    function handleLeave() {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    }

    let rafId: number;
    function draw() {
      ctx!.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * SPACING;
          const y = j * SPACING;

          const dx = x - mouse.current.x;
          const dy = y - mouse.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const proximity = Math.max(0, 1 - dist / GLOW_RADIUS);
          const eased = proximity * proximity; // yumuşak düşüş

          const baseOpacity = 0.08;
          const opacity = baseOpacity + eased * 0.85;
          const radius = RADIUS + eased * 1.35; // büyüme oranı da %25 küçültüldü

          // Pseudo-3D "kabarma": imlece yakın noktalar yüzeyden hafifçe
          // kalkıp ışığa doğru yükseliyormuş gibi yukarı kayar; altlarında
          // ayrı bir gölge çizilerek derinlik illüzyonu güçlendirilir.
          const lift = eased * 3; // px cinsinden yükselme
          const drawX = x;
          const drawY = y - lift;

          if (eased > 0.02) {
            // Kalkan noktanın altına düşen gölge (elipse) — three.js'e
            // geçmeden önce "yüzeyden ayrılma" hissi veren basit bir numara.
            ctx!.beginPath();
            ctx!.ellipse(
              x,
              y + radius * 0.6,
              radius * 0.9,
              radius * 0.35,
              0,
              0,
              Math.PI * 2
            );
            ctx!.fillStyle = `rgba(0, 0, 0, ${0.25 * eased})`;
            ctx!.shadowBlur = 0;
            ctx!.fill();
          }

          ctx!.beginPath();
          ctx!.arc(drawX, drawY, radius, 0, Math.PI * 2);

          if (eased > 0.02) {
            // "Cam boncuk" simülasyonu: gerçek backdrop-blur canvas'ta
            // mümkün değil, bunun yerine highlight + renk + şeffaf kenar
            // ile cam hissi veren bir radial gradient kullanıyoruz.
            const gradient = ctx!.createRadialGradient(
              drawX - radius * 0.3,
              drawY - radius * 0.3,
              0,
              drawX,
              drawY,
              radius
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * eased})`);
            gradient.addColorStop(0.45, `rgba(${ACCENT}, ${opacity})`);
            gradient.addColorStop(1, `rgba(${ACCENT}, 0)`);

            ctx!.fillStyle = gradient;
            ctx!.shadowColor = `rgba(${ACCENT}, ${eased * 0.8})`;
            ctx!.shadowBlur = 6 * eased;
          } else {
            ctx!.fillStyle = `rgba(255, 255, 255, ${baseOpacity})`;
            ctx!.shadowBlur = 0;
          }

          ctx!.fill();
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}