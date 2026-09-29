"use client";

import { useState, type CSSProperties } from "react";

type Piece = {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  color: string;
};

const COLORS = ["#c07a35", "#914955", "#d7a8b8", "#2f6b4f", "#552c4a"];
const PIECE_COUNT = 20;

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 150,
    duration: 1100 + Math.random() * 500,
    drift: (Math.random() - 0.5) * 80,
    rotate: 180 + Math.random() * 360,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
}

/**
 * A brief CSS-only confetti burst. The caller decides if/when to mount
 * this (see CelebrationOverlay's reduced-motion and once-per-device checks) —
 * pieces are randomized once via lazy useState, not regenerated on
 * re-render, and it never needs to unmount itself since it shares the
 * celebration overlay's lifecycle.
 */
export function ConfettiBurst() {
  const [pieces] = useState(makePieces);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="animate-confetti-fall absolute top-0 h-2.5 w-1.5 rounded-[1px]"
          style={
            {
              left: `${p.left}%`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}ms`,
              "--confetti-drift": `${p.drift}px`,
              "--confetti-rotate": `${p.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
