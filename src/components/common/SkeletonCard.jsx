import React from "react";

/**
 * SkeletonCard — Animated loading placeholder.
 * Matches the visual footprint of real content so there's no layout jump.
 *
 * Usage:
 *   <SkeletonCard type="contractor" />   — 2-col card with avatar
 *   <SkeletonCard type="service" />      — service tile
 *   <SkeletonCard type="stat" />         — small stat box
 *   <SkeletonCard type="list" rows={4} /> — plain text lines
 */
export default function SkeletonCard({ type = "contractor", rows = 3 }) {
  if (type === "contractor") {
    return (
      <div className="glass-card p-6 animate-pulse" aria-hidden>
        <div className="flex gap-5">
          <div className="skeleton w-20 h-20 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="skeleton h-6 w-3/4 rounded-lg" />
            <div className="skeleton h-4 w-1/2 rounded-md" />
            <div className="flex gap-2">
              <div className="skeleton h-7 w-24 rounded-full" />
              <div className="skeleton h-7 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <div className="skeleton h-10 flex-1 rounded-xl" />
          <div className="skeleton h-10 flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  if (type === "service") {
    return (
      <div className="glass-card p-8 animate-pulse" aria-hidden>
        <div className="skeleton w-14 h-14 rounded-2xl mb-5" />
        <div className="skeleton h-6 w-3/4 rounded-lg mb-3" />
        <div className="skeleton h-4 w-full rounded-md mb-2" />
        <div className="skeleton h-4 w-5/6 rounded-md mb-6" />
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>
    );
  }

  if (type === "stat") {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 animate-pulse" aria-hidden>
        <div className="skeleton h-3 w-16 rounded mb-3" />
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>
    );
  }

  // "list" — generic rows
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={`skeleton h-4 rounded-md ${i % 3 === 2 ? "w-2/3" : i % 2 === 1 ? "w-5/6" : "w-full"}`} />
      ))}
    </div>
  );
}
