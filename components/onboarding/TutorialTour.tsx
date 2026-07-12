"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useOnboarding } from "@/components/onboarding/onboarding-context";
import { TutorialCoachmark } from "@/components/onboarding/TutorialCoachmark";
import {
  TutorialSpotlight,
  type SpotlightRect,
} from "@/components/onboarding/TutorialSpotlight";
import { TOUR_ATTR, type TutorialPlacement } from "@/lib/onboarding/types";

const PAD = 8;
const PANEL_MIN_WIDTH = 320;

function queryTourTarget(target: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[${TOUR_ATTR}="${CSS.escape(target)}"]`);
}

function readRect(el: HTMLElement | null): SpotlightRect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 && r.height < 2) return null;
  return {
    top: Math.max(0, r.top - PAD),
    left: Math.max(0, r.left - PAD),
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

function resolvePlacement(
  preferred: TutorialPlacement | undefined,
  target: SpotlightRect | null,
): TutorialPlacement {
  if (!target || preferred === "center") return "center";

  const minSpace = 280;
  const space = {
    top: target.top,
    bottom: window.innerHeight - (target.top + target.height),
    left: target.left,
    right: window.innerWidth - (target.left + target.width),
  };

  // Honor preferred side when it has enough room; otherwise pick the roomiest side.
  if (preferred && preferred !== "auto") {
    if (
      ((preferred === "top" || preferred === "bottom") && space[preferred] >= minSpace) ||
      ((preferred === "left" || preferred === "right") && space[preferred] >= PANEL_MIN_WIDTH)
    ) {
      return preferred;
    }
  }

  const ranked = (Object.entries(space) as [TutorialPlacement, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  return ranked[0]?.[0] ?? "bottom";
}

/** Single-step guided tour overlay: one spotlight + one coachmark. */
export function TutorialTour() {
  const {
    phase,
    step,
    stepIndex,
    stepCount,
    nextStep,
    previousStep,
    skipTutorial,
  } = useOnboarding();

  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);
  const [placement, setPlacement] = useState<TutorialPlacement>("center");

  const touring = phase === "touring" && step !== null;

  useLayoutEffect(() => {
    if (!touring || !step) return;

    let cancelled = false;
    let tries = 0;
    let timer: number | undefined;

    const measure = () => {
      if (cancelled || !step) return;

      if (!step.target) {
        setTargetRect(null);
        setPlacement("center");
        return;
      }

      const el = queryTourTarget(step.target);
      const rect = readRect(el);
      if (rect) {
        el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        setTargetRect(rect);
        setPlacement(resolvePlacement(step.placement, rect));
        return;
      }

      tries += 1;
      if (tries < 24) {
        timer = window.setTimeout(measure, 100);
      } else {
        setTargetRect(null);
        setPlacement("center");
      }
    };

    // Defer measurement so we never sync-setState inside the effect body.
    timer = window.setTimeout(measure, 0);

    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [touring, step]);

  useEffect(() => {
    if (!touring) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skipTutorial();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nextStep();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousStep();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [touring, nextStep, previousStep, skipTutorial]);

  if (!touring || !step) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      <TutorialSpotlight
        rect={targetRect}
        allowTargetInteraction={Boolean(step.allowTargetInteraction)}
      />

      <TutorialCoachmark
        step={step}
        stepIndex={stepIndex}
        stepCount={stepCount}
        targetRect={targetRect}
        placement={placement}
        onPrevious={previousStep}
        onNext={nextStep}
        onSkip={skipTutorial}
      />
    </div>
  );
}
