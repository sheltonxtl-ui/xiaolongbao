export type TutorialPlacement = "center" | "top" | "bottom" | "left" | "right" | "auto";

export type TourPhase = "idle" | "welcome" | "touring" | "complete";

export type TutorialStep = {
  id: string;
  title: string;
  body: string;
  /** Preferred app route for this step. Navigates before spotlighting. */
  route?: string;
  /** Matches `[data-tour="<target>"]` in the DOM. Omit for centered coachmarks. */
  target?: string;
  placement?: TutorialPlacement;
  /** When true, clicks can pass through the spotlight hole to the target. */
  allowTargetInteraction?: boolean;
};

export type OnboardingState = {
  currentStepId?: string;
  currentStepIndex?: number;
  active?: boolean;
  phase?: TourPhase;
  seenTooltips?: string[];
};

export type TutorialProgressSnapshot = {
  phase: TourPhase;
  stepIndex: number;
  replay: boolean;
};

export const ONBOARDING_STORAGE_KEY = "xlb.onboarding.progress";
export const TOOLTIPS_STORAGE_KEY = "xlb.onboarding.tooltips";

export const TOUR_ATTR = "data-tour";
