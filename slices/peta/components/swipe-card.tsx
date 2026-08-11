"use client";
// One concept card, and the only place in this app that reads raw pointer
// events. There is no animation library here and none may be added — the
// physics is `event.clientX` minus a start position, written to a CSS
// transform. That is the whole trick.
//
// THREE WAYS TO ANSWER, all equal citizens:
//   · drag it left or right past the threshold (pointer events, so mouse, pen
//     and touch are one code path);
//   · press ArrowLeft / ArrowRight while the card has focus;
//   · press one of the two buttons the parent renders under it.
// The gesture is the garnish. A quiz that can ONLY be swiped locks out the
// keyboard, the screen reader and anyone whose hands do not do that — on the
// one page in the product written to welcome a stranger.
//
// `touch-action: pan-y` (not `none`): horizontal drags are ours, vertical
// scrolling stays the browser's, so the page never feels stuck.
import { useRef, useState } from "react";
import type { ConceptCard } from "@/lib/peta";

/** Pixels of travel that commit an answer. ~1/5 of a 390px screen. */
const THRESHOLD = 72;

const TIER_LABEL = { dasar: "Dasar", menengah: "Menengah", lanjut: "Lanjut" } as const;

export type SwipeCardProps = {
  card: ConceptCard;
  position: number;
  total: number;
  reducedMotion: boolean;
  onDecide: (knows: boolean) => void;
};

export function SwipeCard({ card, position, total, reducedMotion, onDecide }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);

  const settle = (committed: boolean, knows: boolean) => {
    dragging.current = false;
    setDx(0);
    if (committed) onDecide(knows);
  };

  // The gesture stays under `prefers-reduced-motion`; only its ANIMATION goes.
  // Removing the pointer handlers made a 150px drag do nothing at all on the
  // one interaction this page is named for. Reduced-motion asks us to stop
  // moving things, not to withdraw touch input — the buttons and arrow keys
  // were always the accessible path, and they remain it.
  const handlers = {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
          dragging.current = true;
          startX.current = e.clientX;
          e.currentTarget.setPointerCapture(e.pointerId);
        },
        onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
          if (dragging.current) setDx(e.clientX - startX.current);
        },
        onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
          if (!dragging.current) return;
          e.currentTarget.releasePointerCapture(e.pointerId);
          settle(Math.abs(dx) >= THRESHOLD, dx > 0);
        },
        onPointerCancel: () => settle(false, false),
      };

  const lean = Math.max(-1, Math.min(1, dx / THRESHOLD));
  return (
    <div
      // A focusable group, not a button: it holds two opposite actions, and
      // the arrow keys are how you choose between them.
      role="group"
      tabIndex={0}
      aria-label={`Kartu ${position} dari ${total}: ${card.title}. Panah kanan kalau sudah tahu, panah kiri kalau belum.`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          onDecide(true);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          onDecide(false);
        }
      }}
      {...handlers}
      style={{
        transform: reducedMotion ? undefined : `translateX(${dx}px) rotate(${lean * 4}deg)`,
        touchAction: "pan-y",
        // Only the SPRING-BACK is animated. While the finger is down the card
        // must track it exactly — a transition there feels like lag, not polish.
        transition: dragging.current || reducedMotion ? undefined : "transform 140ms steps(4, end)",
      }}
      className="relative select-none border-2 border-border bg-card p-5 shadow-[4px_4px_0_0_var(--pixel-shadow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">{TIER_LABEL[card.tier]}</span>
        <span className="text-caption text-muted-foreground tabular-nums">
          {position}/{total}
        </span>
      </div>
      <h3 className="mt-3 text-balance font-display text-marquee">{card.title}</h3>
      <p className="mt-3 min-h-20 text-pretty text-body">{card.blurb}</p>

      {/* Verdict watermarks — the drag's only feedback, and the reason the
          gesture reads as an answer rather than as the page moving. */}
      <span
        aria-hidden
        style={{ opacity: Math.max(0, lean) }}
        className="pointer-events-none absolute right-3 top-3 border-2 border-success px-2 py-1 font-display text-caption text-success"
      >
        TAHU
      </span>
      <span
        aria-hidden
        style={{ opacity: Math.max(0, -lean) }}
        className="pointer-events-none absolute left-3 top-3 border-2 border-destructive px-2 py-1 font-display text-caption text-destructive-text"
      >
        BELUM
      </span>
    </div>
  );
}
