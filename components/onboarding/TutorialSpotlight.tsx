"use client";

import { motion } from "motion/react";

export type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TutorialSpotlightProps = {
  rect: SpotlightRect | null;
  /** When false, the hole still looks cut out but clicks are blocked everywhere. */
  allowTargetInteraction?: boolean;
};

/**
 * Dims the whole app with four panels around a spotlight hole.
 * Clicks outside the hole are blocked; the hole optionally lets events through.
 */
export function TutorialSpotlight({
  rect,
  allowTargetInteraction = false,
}: TutorialSpotlightProps) {
  if (!rect) {
    return (
      <motion.div
        className="fixed inset-0 z-[200] bg-zinc-950/65 dark:bg-zinc-950/75"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
        onClick={(event) => event.stopPropagation()}
      />
    );
  }

  const { top, left, width, height } = rect;
  const right = left + width;
  const bottom = top + height;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden="true">
      {/* Top dim */}
      <motion.div
        className="pointer-events-auto absolute left-0 right-0 top-0 bg-zinc-950/65 dark:bg-zinc-950/75"
        initial={false}
        animate={{ height: Math.max(0, top) }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        onClick={(event) => event.stopPropagation()}
      />
      {/* Bottom dim */}
      <motion.div
        className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-zinc-950/65 dark:bg-zinc-950/75"
        initial={false}
        animate={{ top: bottom }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        onClick={(event) => event.stopPropagation()}
      />
      {/* Left dim */}
      <motion.div
        className="pointer-events-auto absolute bg-zinc-950/65 dark:bg-zinc-950/75"
        initial={false}
        animate={{ top, height, width: Math.max(0, left), left: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        onClick={(event) => event.stopPropagation()}
      />
      {/* Right dim */}
      <motion.div
        className="pointer-events-auto absolute right-0 bg-zinc-950/65 dark:bg-zinc-950/75"
        initial={false}
        animate={{ top, height, left: right }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        onClick={(event) => event.stopPropagation()}
      />

      {/* Glow / elevated ring around the target */}
      <motion.div
        className="absolute rounded-xl ring-2 ring-white shadow-[0_0_0_4px_rgba(99,102,241,0.35),0_8px_30px_rgba(0,0,0,0.25)] dark:ring-indigo-300"
        initial={false}
        animate={{ top, left, width, height }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        style={{ pointerEvents: allowTargetInteraction ? "none" : "auto" }}
        onClick={
          allowTargetInteraction
            ? undefined
            : (event) => {
                event.preventDefault();
                event.stopPropagation();
              }
        }
      />
    </div>
  );
}
