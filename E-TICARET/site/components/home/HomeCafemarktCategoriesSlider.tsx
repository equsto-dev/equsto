"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { CafemarktCategory } from "@/lib/home-cafemarkt-content";
import { SHOP_ASSET_V } from "@/lib/shop/assets";

const AUTO_MS = 5500;
const DRAG_THRESH = 5;

function assetUrl(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}v=${SHOP_ASSET_V}`;
}

function goLink(
  e: React.MouseEvent,
  card: {
    href: string;
    legacyGo?: string;
    dept?: string;
    anchor?: string;
  },
  didDrag: boolean,
) {
  if (didDrag) {
    e.preventDefault();
    return;
  }
  e.preventDefault();
  const w = window as Window & {
    eqGo?: (key: string) => void;
    eqDeptGo?: (dept: string) => void;
  };
  if (card.anchor) {
    const el = document.getElementById(card.anchor);
    const onHome = window.location.pathname === "/" || window.location.pathname === "";
    if (onHome && el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.location.href = card.anchor.startsWith("#")
      ? `/${card.anchor}`
      : `/#${card.anchor}`;
    return;
  }
  if (card.legacyGo && typeof w.eqGo === "function") {
    w.eqGo(card.legacyGo);
    return;
  }
  if (card.dept && typeof w.eqDeptGo === "function" && !card.href.includes("?")) {
    w.eqDeptGo(card.dept);
    return;
  }
  window.location.href = card.href;
}

function perPageForWidth(w: number): number {
  if (w <= 640) return 2;
  if (w <= 1100) return 3;
  return 5;
}

/** Beyaz zemin: cm-* işlendi; katalog fotoğrafları contain */
function popCatImgWrapClass(image: string): string {
  const catalogShot = !/\/cm-|pop-cats\/cm-/i.test(image);
  return catalogShot
    ? "eq-cmkt-cat__img-wrap eq-cmkt-cat__img-wrap--contain"
    : "eq-cmkt-cat__img-wrap eq-cmkt-cat__img-wrap--cm";
}

function CategoryCard({
  cat,
  didDragRef,
}: {
  cat: CafemarktCategory;
  didDragRef: React.RefObject<boolean>;
}) {
  return (
    <a
      className="eq-cmkt-cat"
      href={cat.href}
      draggable={false}
      onClick={(e) => goLink(e, cat, didDragRef.current)}
    >
      <span className={popCatImgWrapClass(cat.image)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetUrl(cat.image)} alt="" loading="lazy" decoding="async" draggable={false} />
      </span>
      <span className="eq-cmkt-cat__label">{cat.label}</span>
    </a>
  );
}

type DragState = {
  active: boolean;
  startX: number;
  scrollStart: number;
  moved: boolean;
  pointerId: number;
};

export function HomeCafemarktCategoriesSlider({
  categories,
}: {
  categories: CafemarktCategory[];
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef(false);
  const dragRef = useRef<DragState>({
    active: false,
    startX: 0,
    scrollStart: 0,
    moved: false,
    pointerId: -1,
  });
  const pageRef = useRef(0);
  const pauseUntilRef = useRef(0);

  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const pageCount = Math.max(1, Math.ceil(categories.length / perPage));

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    const update = () => setPerPage(perPageForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const scrollToPage = useCallback(
    (target: number, behavior: ScrollBehavior = "smooth") => {
      const vp = viewportRef.current;
      const track = trackRef.current;
      if (!vp || !track) return;

      const clamped = ((target % pageCount) + pageCount) % pageCount;
      const cardIndex = Math.min(clamped * perPage, categories.length - 1);
      const card = track.children.item(cardIndex) as HTMLElement | null;
      if (card) {
        card.scrollIntoView({ behavior, inline: "start", block: "nearest" });
      } else {
        vp.scrollTo({ left: clamped * vp.clientWidth, behavior });
      }
      setPage(clamped);
    },
    [categories.length, pageCount, perPage],
  );

  const go = useCallback(
    (dir: -1 | 1) => {
      scrollToPage(pageRef.current + dir);
      pauseUntilRef.current = Date.now() + AUTO_MS;
    },
    [scrollToPage],
  );

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount, perPage]);

  useEffect(() => {
    scrollToPage(Math.min(pageRef.current, pageCount - 1), "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- perPage/resize reposition only
  }, [perPage, pageCount]);

  useEffect(() => {
    if (pageCount <= 1 || paused) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const tick = () => {
      if (Date.now() < pauseUntilRef.current) return;
      scrollToPage(pageRef.current + 1);
    };

    const id = window.setInterval(tick, AUTO_MS);
    return () => window.clearInterval(id);
  }, [pageCount, paused, scrollToPage]);

  const syncPageFromScroll = useCallback(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track) return;

    const vpLeft = vp.getBoundingClientRect().left;
    let best = 0;
    let bestDist = Infinity;

    for (let i = 0; i < track.children.length; i += perPage) {
      const el = track.children.item(i) as HTMLElement | null;
      if (!el) continue;
      const dist = Math.abs(el.getBoundingClientRect().left - vpLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = Math.floor(i / perPage);
      }
    }

    const clamped = Math.max(0, Math.min(pageCount - 1, best));
    if (clamped !== pageRef.current) setPage(clamped);
  }, [pageCount, perPage]);

  const onScroll = useCallback(() => {
    if (dragRef.current.active) return;
    syncPageFromScroll();
  }, [syncPageFromScroll]);

  const endDrag = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || !dragRef.current.active) return;

    dragRef.current.active = false;
    setDragging(false);

    if (dragRef.current.moved) {
      didDragRef.current = true;
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 80);
      syncPageFromScroll();
      const cardIndex = pageRef.current * perPage;
      const track = trackRef.current;
      const card = track?.children.item(Math.min(cardIndex, categories.length - 1)) as
        | HTMLElement
        | null;
      card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      pauseUntilRef.current = Date.now() + AUTO_MS;
    }

    dragRef.current.moved = false;
  }, [categories.length, perPage, syncPageFromScroll]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const vp = viewportRef.current;
    if (!vp) return;

    dragRef.current = {
      active: true,
      startX: e.clientX,
      scrollStart: vp.scrollLeft,
      moved: false,
      pointerId: e.pointerId,
    };
    setDragging(true);
    pauseUntilRef.current = Date.now() + AUTO_MS * 2;
    vp.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const vp = viewportRef.current;
    if (!vp || !dragRef.current.active || e.pointerId !== dragRef.current.pointerId) {
      return;
    }

    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > DRAG_THRESH) dragRef.current.moved = true;
    vp.scrollLeft = dragRef.current.scrollStart - dx;
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const vp = viewportRef.current;
    if (!vp || e.pointerId !== dragRef.current.pointerId) return;
    try {
      vp.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    endDrag();
  };

  return (
    <div
      className="eq-cmkt-cats-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        pauseUntilRef.current = Date.now() + AUTO_MS;
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
          pauseUntilRef.current = Date.now() + AUTO_MS;
        }
      }}
    >
      <h2 className="eq-cmkt-cats__title">Popüler Kategoriler</h2>
      <div className="eq-cmkt-cats">
        <button
          type="button"
          className="eq-cmkt-cats__nav eq-cmkt-cats__nav--prev"
          aria-label="Önceki sayfa"
          onClick={() => go(-1)}
        >
          ‹
        </button>
        <div
          ref={viewportRef}
          className={`eq-cmkt-cats__viewport${dragging ? " is-dragging" : ""}`}
          style={{ ["--eq-cmkt-cats-cols" as string]: String(perPage) }}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div ref={trackRef} className="eq-cmkt-cats__track">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} didDragRef={didDragRef} />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="eq-cmkt-cats__nav eq-cmkt-cats__nav--next"
          aria-label="Sonraki sayfa"
          onClick={() => go(1)}
        >
          ›
        </button>
      </div>
      {pageCount > 1 ? (
        <div className="eq-cmkt-cats__dots" aria-hidden={pageCount <= 1}>
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`eq-cmkt-cats__dot${i === page ? " is-active" : ""}`}
              aria-label={`Sayfa ${i + 1}`}
              aria-current={i === page ? "true" : undefined}
              onClick={() => {
                scrollToPage(i);
                pauseUntilRef.current = Date.now() + AUTO_MS;
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
