"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/catalyst/button";
import type { TutorialPlacement, TutorialStep } from "@/lib/onboarding/types";
import type { SpotlightRect } from "@/components/onboarding/TutorialSpotlight";

const PANEL_WIDTH = 360;
const PANEL_GAP = 16;
const VIEWPORT_PAD = 12;
const ESTIMATED_HEIGHT = 260;

type TutorialCoachmarkProps = {
  step: TutorialStep;
  stepIndex: number;
  stepCount: number;
  targetRect: SpotlightRect | null;
  placement: TutorialPlacement;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
};

type PanelPosition = {
  top: number;
  left: number;
  width: number;
};

/**
 * Choose a side that actually fits, then return the panel's top-left in viewport pixels.
 * Avoid CSS transforms for anchoring — motion's enter animation owns `transform`.
 */
function resolvePanelPosition(
  preferred: TutorialPlacement,
  target: SpotlightRect | null,
  panelWidth: number,
  panelHeight: number,
): PanelPosition {
  const width = Math.min(panelWidth, window.innerWidth - VIEWPORT_PAD * 2);
  const height = Math.max(panelHeight, ESTIMATED_HEIGHT);

  if (!target || preferred === "center") {
    return {
      top: Math.max(VIEWPORT_PAD, (window.innerHeight - height) / 2),
      left: Math.max(VIEWPORT_PAD, (window.innerWidth - width) / 2),
      width,
    };
  }

  type Side = "top" | "bottom" | "left" | "right";
  const space: Record<Side, number> = {
    top: target.top - VIEWPORT_PAD,
    bottom: window.innerHeight - (target.top + target.height) - VIEWPORT_PAD,
    left: target.left - VIEWPORT_PAD,
    right: window.innerWidth - (target.left + target.width) - VIEWPORT_PAD,
  };

  const fits = (side: Side): boolean => {
    if (side === "top" || side === "bottom") {
      return space[side] >= height + PANEL_GAP;
    }
    return space[side] >= width + PANEL_GAP;
  };

  const fallbackOrder: Side[] = ["bottom", "top", "right", "left"];
  const order: Side[] =
    preferred === "auto"
      ? fallbackOrder
      : [preferred, ...fallbackOrder.filter((side) => side !== preferred)];

  let placement: Side | null = order.find(fits) ?? null;
  if (!placement) {
    placement = (Object.entries(space) as [Side, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "bottom";
  }

  let top = VIEWPORT_PAD;
  let left = target.left + target.width / 2 - width / 2;

  switch (placement) {
    case "bottom":
      top = target.top + target.height + PANEL_GAP;
      break;
    case "top":
      top = target.top - PANEL_GAP - height;
      break;
    case "left":
      top = target.top + target.height / 2 - height / 2;
      left = target.left - PANEL_GAP - width;
      break;
    case "right":
      top = target.top + target.height / 2 - height / 2;
      left = target.left + target.width + PANEL_GAP;
      break;
  }

  const maxTop = Math.max(VIEWPORT_PAD, window.innerHeight - height - VIEWPORT_PAD);
  const maxLeft = Math.max(VIEWPORT_PAD, window.innerWidth - width - VIEWPORT_PAD);

  return {
    top: Math.min(Math.max(VIEWPORT_PAD, top), maxTop),
    left: Math.min(Math.max(VIEWPORT_PAD, left), maxLeft),
    width,
  };
}

export function TutorialCoachmark({
  step,
  stepIndex,
  stepCount,
  targetRect,
  placement,
  onPrevious,
  onNext,
  onSkip,
}: TutorialCoachmarkProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= stepCount - 1;
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<PanelPosition>(() =>
    typeof window === "undefined"
      ? { top: 80, left: 24, width: PANEL_WIDTH }
      : resolvePanelPosition(placement, targetRect, PANEL_WIDTH, ESTIMATED_HEIGHT),
  );

  useLayoutEffect(() => {
    const measure = () => {
      const measuredHeight = panelRef.current?.offsetHeight ?? ESTIMATED_HEIGHT;
      setPosition(
        resolvePanelPosition(placement, targetRect, PANEL_WIDTH, measuredHeight),
      );
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [placement, targetRect, step.id]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tour-title-${step.id}`}
        aria-describedby={`tour-body-${step.id}`}
        tabIndex={-1}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed z-[210] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-zinc-950/10 outline-none dark:bg-zinc-900 dark:ring-white/10"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Step {stepIndex + 1} of {stepCount}
          </p>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
          >
            Skip Tutorial
          </button>
        </div>

        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10"
          aria-hidden="true"
        >
          <motion.div
            className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
            initial={false}
            animate={{ width: `${((stepIndex + 1) / stepCount) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>

        <h2
          id={`tour-title-${step.id}`}
          className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white"
        >
          {step.title}
        </h2>
        <p
          id={`tour-body-${step.id}`}
          className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
        >
          {step.body}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button outline disabled={isFirst} onClick={onPrevious}>
            Previous
          </Button>
          <Button color="indigo" onClick={onNext}>
            {isLast ? "Finish" : "Next"}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
