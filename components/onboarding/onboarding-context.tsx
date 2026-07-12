"use client";

import { createContext, useContext } from "react";
import type { TourPhase, TutorialStep } from "@/lib/onboarding/types";

export type OnboardingContextValue = {
  isReady: boolean;
  phase: TourPhase;
  /** True while welcome, touring, or complete dialogs are showing. */
  isTourOpen: boolean;
  isReplay: boolean;
  stepIndex: number;
  step: TutorialStep | null;
  stepCount: number;
  hasCompletedTutorial: boolean;
  seenTooltips: Set<string>;
  /** Which FeatureTip (if any) may show its first-time callout. */
  activeFeatureTipId: string | null;
  /** Open welcome dialog (or resume touring). Used by Settings / Help replay. */
  startTutorial: (options?: { replay?: boolean }) => void;
  /** Welcome → begin step 1 */
  beginTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  finishTutorial: () => void;
  replayFromComplete: () => void;
  markTooltipSeen: (tipId: string) => void;
  hasSeenTooltip: (tipId: string) => boolean;
  /** Claim exclusive first-time tip slot (returns false if another tip is active). */
  claimFeatureTip: (tipId: string) => boolean;
  releaseFeatureTip: (tipId: string) => void;
};

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}

export function useOnboardingOptional(): OnboardingContextValue | null {
  return useContext(OnboardingContext);
}
