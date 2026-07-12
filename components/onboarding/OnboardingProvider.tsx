"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  completeTutorialAction,
  getOnboardingProfileAction,
  markTooltipSeenAction,
  resetTutorialAction,
  saveOnboardingProgressAction,
} from "@/app/actions/onboarding";
import { TUTORIAL_STEPS, getTutorialStep } from "@/lib/onboarding/steps";
import {
  clearTutorialProgress,
  readLocalTutorialCompleted,
  readSeenTooltips,
  readTutorialProgress,
  writeLocalTutorialCompleted,
  writeSeenTooltips,
  writeTutorialProgress,
} from "@/lib/onboarding/storage";
import type { TourPhase, TutorialStep } from "@/lib/onboarding/types";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { TutorialWelcomeDialog } from "@/components/onboarding/TutorialWelcomeDialog";
import { TutorialCompleteDialog } from "@/components/onboarding/TutorialCompleteDialog";
import { TutorialTour } from "@/components/onboarding/TutorialTour";
import {
  OnboardingContext,
  type OnboardingContextValue,
} from "@/components/onboarding/onboarding-context";

export { useOnboarding, useOnboardingOptional } from "@/components/onboarding/onboarding-context";

function routeMatches(pathname: string, route?: string): boolean {
  if (!route) return true;
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn, loading: authLoading } = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();
  const userId = user?.id ?? null;

  const [isReady, setIsReady] = useState(false);
  const [phase, setPhase] = useState<TourPhase>("idle");
  const [isReplay, setIsReplay] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true);
  const [seenTooltips, setSeenTooltips] = useState<Set<string>>(() => new Set());
  const [activeFeatureTipId, setActiveFeatureTipId] = useState<string | null>(null);
  const seenTooltipsRef = useRef(seenTooltips);
  const activeFeatureTipRef = useRef<string | null>(null);
  const bootstrappedUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    seenTooltipsRef.current = seenTooltips;
  }, [seenTooltips]);

  const stepCount = TUTORIAL_STEPS.length;
  const step = phase === "touring" ? (getTutorialStep(stepIndex) ?? null) : null;
  const isTourOpen = phase === "welcome" || phase === "touring" || phase === "complete";

  const persistLocal = useCallback(
    (next: { phase: TourPhase; stepIndex: number; replay: boolean }, id: string | null) => {
      if (next.phase === "idle") {
        clearTutorialProgress(id);
        return;
      }
      writeTutorialProgress(next, id);
    },
    [],
  );

  const persistRemoteProgress = useCallback(
    (nextIndex: number, nextPhase: TourPhase) => {
      const current = getTutorialStep(nextIndex);
      void saveOnboardingProgressAction({
        active: nextPhase === "touring" || nextPhase === "welcome",
        phase: nextPhase,
        currentStepIndex: nextIndex,
        currentStepId: current?.id,
        seenTooltips: [...seenTooltipsRef.current],
      });
    },
    [],
  );

  const ensureRouteForStep = useCallback(
    (nextStep: TutorialStep) => {
      if (!nextStep.route || routeMatches(pathname, nextStep.route)) return;
      router.push(nextStep.route);
    },
    [pathname, router],
  );

  const goToTourStep = useCallback(
    (index: number, replay: boolean) => {
      const clamped = Math.max(0, Math.min(index, stepCount - 1));
      const next = getTutorialStep(clamped);
      if (!next) return;

      setStepIndex(clamped);
      setPhase("touring");
      setIsReplay(replay);
      persistLocal({ phase: "touring", stepIndex: clamped, replay }, userId);
      persistRemoteProgress(clamped, "touring");
      ensureRouteForStep(next);
    },
    [ensureRouteForStep, persistLocal, persistRemoteProgress, stepCount, userId],
  );

  const openWelcome = useCallback(
    (replay: boolean) => {
      setIsReplay(replay);
      setStepIndex(0);
      setPhase("welcome");
      setActiveFeatureTipId(null);
      if (userId) writeLocalTutorialCompleted(userId, false);
      persistLocal({ phase: "welcome", stepIndex: 0, replay }, userId);
      persistRemoteProgress(0, "welcome");
      if (!routeMatches(pathname, "/decks")) {
        router.push("/decks");
      }
    },
    [pathname, persistLocal, persistRemoteProgress, router, userId],
  );

  const startTutorial = useCallback(
    (options?: { replay?: boolean }) => {
      const replay = Boolean(options?.replay);
      if (replay) {
        void resetTutorialAction();
        setHasCompletedTutorial(false);
        if (userId) writeLocalTutorialCompleted(userId, false);
      }
      openWelcome(replay);
    },
    [openWelcome, userId],
  );

  const beginTour = useCallback(() => {
    goToTourStep(0, isReplay);
  }, [goToTourStep, isReplay]);

  const closeAsComplete = useCallback(
    async (skipped: boolean) => {
      setPhase("idle");
      setIsReplay(false);
      setActiveFeatureTipId(null);
      setHasCompletedTutorial(true);
      clearTutorialProgress(userId);
      if (userId) writeLocalTutorialCompleted(userId, true);
      await completeTutorialAction({ skipped });
      if (pathname !== "/decks") {
        router.push("/decks");
      }
    },
    [pathname, router, userId],
  );

  const nextStep = useCallback(() => {
    if (stepIndex >= stepCount - 1) {
      setPhase("complete");
      persistLocal({ phase: "complete", stepIndex, replay: isReplay }, userId);
      persistRemoteProgress(stepIndex, "complete");
      return;
    }
    goToTourStep(stepIndex + 1, isReplay);
  }, [
    goToTourStep,
    isReplay,
    persistLocal,
    persistRemoteProgress,
    stepIndex,
    stepCount,
    userId,
  ]);

  const previousStep = useCallback(() => {
    if (stepIndex <= 0) return;
    goToTourStep(stepIndex - 1, isReplay);
  }, [goToTourStep, isReplay, stepIndex]);

  const skipTutorial = useCallback(() => {
    void closeAsComplete(true);
  }, [closeAsComplete]);

  const finishTutorial = useCallback(() => {
    void closeAsComplete(false);
  }, [closeAsComplete]);

  const replayFromComplete = useCallback(() => {
    void resetTutorialAction();
    setHasCompletedTutorial(false);
    if (userId) writeLocalTutorialCompleted(userId, false);
    openWelcome(true);
  }, [openWelcome, userId]);

  const markTooltipSeen = useCallback(
    (tipId: string) => {
      if (seenTooltipsRef.current.has(tipId)) return;

      const next = new Set(seenTooltipsRef.current);
      next.add(tipId);
      seenTooltipsRef.current = next;
      setSeenTooltips(next);
      writeSeenTooltips([...next], userId);
      if (activeFeatureTipRef.current === tipId) {
        activeFeatureTipRef.current = null;
        setActiveFeatureTipId(null);
      }

      queueMicrotask(() => {
        void markTooltipSeenAction(tipId);
      });
    },
    [userId],
  );

  const hasSeenTooltip = useCallback(
    (tipId: string) => seenTooltips.has(tipId),
    [seenTooltips],
  );

  const claimFeatureTip = useCallback(
    (tipId: string) => {
      if (isTourOpen || !hasCompletedTutorial) return false;
      if (seenTooltipsRef.current.has(tipId)) return false;
      if (activeFeatureTipRef.current && activeFeatureTipRef.current !== tipId) {
        return false;
      }
      activeFeatureTipRef.current = tipId;
      setActiveFeatureTipId(tipId);
      return true;
    },
    [hasCompletedTutorial, isTourOpen],
  );

  const releaseFeatureTip = useCallback((tipId: string) => {
    if (activeFeatureTipRef.current !== tipId) return;
    activeFeatureTipRef.current = null;
    setActiveFeatureTipId(null);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    // Re-bootstrap whenever the signed-in user changes (including null → user after signup).
    if (bootstrappedUserIdRef.current === userId) return;

    let cancelled = false;
    bootstrappedUserIdRef.current = userId;

    async function bootstrap() {
      await Promise.resolve();
      if (cancelled) return;

      if (!isSignedIn || !userId) {
        setIsReady(true);
        setHasCompletedTutorial(true);
        setPhase("idle");
        setSeenTooltips(new Set());
        setActiveFeatureTipId(null);
        return;
      }

      setIsReady(false);

      const localProgress = readTutorialProgress(userId);
      const localTips = readSeenTooltips(userId);
      const localCompleted = readLocalTutorialCompleted(userId);
      const result = await getOnboardingProfileAction();
      if (cancelled) return;

      const remote = result.data;
      const mergedTips = new Set<string>([
        ...localTips,
        ...(remote.onboardingState.seenTooltips ?? []),
      ]);
      setSeenTooltips(mergedTips);
      writeSeenTooltips([...mergedTips], userId);

      const completed = remote.hasCompletedTutorial || localCompleted;
      setHasCompletedTutorial(completed);

      const remotePhase = remote.onboardingState.phase;
      const canResumeLocal =
        !completed &&
        localProgress &&
        (localProgress.phase === "welcome" || localProgress.phase === "touring");
      const canResumeRemote =
        !completed &&
        (remotePhase === "welcome" ||
          remotePhase === "touring" ||
          remote.onboardingState.active === true);
      const shouldAutoStart = !completed && !canResumeLocal;

      if (canResumeLocal && localProgress) {
        setIsReplay(localProgress.replay);
        setStepIndex(localProgress.stepIndex);
        setPhase(localProgress.phase);
        if (localProgress.phase === "touring") {
          const resumeStep = getTutorialStep(localProgress.stepIndex);
          if (resumeStep) ensureRouteForStep(resumeStep);
        }
      } else if (canResumeRemote) {
        const idx = remote.onboardingState.currentStepIndex ?? 0;
        const nextPhase: TourPhase =
          remotePhase === "welcome" || remotePhase === "touring" ? remotePhase : "welcome";
        setIsReplay(false);
        setStepIndex(idx);
        setPhase(nextPhase);
        persistLocal({ phase: nextPhase, stepIndex: idx, replay: false }, userId);
        if (nextPhase === "touring") {
          const resumeStep = getTutorialStep(idx);
          if (resumeStep) ensureRouteForStep(resumeStep);
        }
      } else if (shouldAutoStart) {
        setIsReplay(false);
        setStepIndex(0);
        setPhase("welcome");
        persistLocal({ phase: "welcome", stepIndex: 0, replay: false }, userId);
        persistRemoteProgress(0, "welcome");
        if (!routeMatches(pathname, "/decks")) {
          router.push("/decks");
        }
      } else {
        setPhase("idle");
      }

      setIsReady(true);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    ensureRouteForStep,
    isSignedIn,
    pathname,
    persistLocal,
    persistRemoteProgress,
    router,
    userId,
  ]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      isReady,
      phase,
      isTourOpen,
      isReplay,
      stepIndex,
      step,
      stepCount,
      hasCompletedTutorial,
      seenTooltips,
      activeFeatureTipId,
      startTutorial,
      beginTour,
      nextStep,
      previousStep,
      skipTutorial,
      finishTutorial,
      replayFromComplete,
      markTooltipSeen,
      hasSeenTooltip,
      claimFeatureTip,
      releaseFeatureTip,
    }),
    [
      activeFeatureTipId,
      beginTour,
      claimFeatureTip,
      finishTutorial,
      hasCompletedTutorial,
      hasSeenTooltip,
      isReady,
      isReplay,
      isTourOpen,
      markTooltipSeen,
      nextStep,
      phase,
      previousStep,
      releaseFeatureTip,
      replayFromComplete,
      seenTooltips,
      skipTutorial,
      startTutorial,
      step,
      stepCount,
      stepIndex,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <TutorialWelcomeDialog
        open={phase === "welcome"}
        onStart={beginTour}
        onSkip={skipTutorial}
      />
      <TutorialTour />
      <TutorialCompleteDialog
        open={phase === "complete"}
        onFinish={finishTutorial}
        onReplay={replayFromComplete}
      />
    </OnboardingContext.Provider>
  );
}
