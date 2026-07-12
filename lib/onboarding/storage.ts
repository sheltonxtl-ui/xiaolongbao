import {
  ONBOARDING_STORAGE_KEY,
  TOOLTIPS_STORAGE_KEY,
  type OnboardingState,
  type TourPhase,
  type TutorialProgressSnapshot,
} from "@/lib/onboarding/types";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isTourPhase(value: unknown): value is TourPhase {
  return value === "idle" || value === "welcome" || value === "touring" || value === "complete";
}

function progressKey(userId?: string | null): string {
  return userId ? `${ONBOARDING_STORAGE_KEY}.${userId}` : ONBOARDING_STORAGE_KEY;
}

function completedKey(userId: string): string {
  return `${ONBOARDING_STORAGE_KEY}.completed.${userId}`;
}

function tooltipsKey(userId?: string | null): string {
  return userId ? `${TOOLTIPS_STORAGE_KEY}.${userId}` : TOOLTIPS_STORAGE_KEY;
}

export function readTutorialProgress(
  userId?: string | null,
): TutorialProgressSnapshot | null {
  if (!canUseStorage()) return null;
  try {
    const raw =
      window.localStorage.getItem(progressKey(userId)) ??
      // Fall back to legacy unscoped key once, then ignore if user-scoped exists later.
      (!userId ? null : window.localStorage.getItem(ONBOARDING_STORAGE_KEY));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TutorialProgressSnapshot> & {
      active?: boolean;
      userId?: string;
    };

    if (userId && parsed.userId && parsed.userId !== userId) {
      return null;
    }

    // Migrate legacy snapshots that used `active: boolean`.
    if (!isTourPhase(parsed.phase)) {
      if (parsed.active === true && typeof parsed.stepIndex === "number") {
        return {
          phase: "touring",
          stepIndex: Math.max(0, parsed.stepIndex),
          replay: Boolean(parsed.replay),
        };
      }
      return null;
    }

    if (typeof parsed.stepIndex !== "number") return null;

    return {
      phase: parsed.phase,
      stepIndex: Math.max(0, parsed.stepIndex),
      replay: Boolean(parsed.replay),
    };
  } catch {
    return null;
  }
}

export function writeTutorialProgress(
  snapshot: TutorialProgressSnapshot,
  userId?: string | null,
): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(
      progressKey(userId),
      JSON.stringify({ ...snapshot, userId: userId ?? undefined }),
    );
  } catch {
    // Ignore quota / private mode failures — in-memory state still works.
  }
}

export function clearTutorialProgress(userId?: string | null): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(progressKey(userId));
    if (userId) {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  } catch {
    // no-op
  }
}

export function readLocalTutorialCompleted(userId: string): boolean {
  if (!canUseStorage() || !userId) return false;
  try {
    return window.localStorage.getItem(completedKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function writeLocalTutorialCompleted(userId: string, completed: boolean): void {
  if (!canUseStorage() || !userId) return;
  try {
    if (completed) {
      window.localStorage.setItem(completedKey(userId), "1");
    } else {
      window.localStorage.removeItem(completedKey(userId));
    }
  } catch {
    // no-op
  }
}

export function readSeenTooltips(userId?: string | null): string[] {
  if (!canUseStorage()) return [];
  try {
    const raw =
      window.localStorage.getItem(tooltipsKey(userId)) ??
      (!userId ? null : window.localStorage.getItem(TOOLTIPS_STORAGE_KEY));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function writeSeenTooltips(ids: string[], userId?: string | null): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(tooltipsKey(userId), JSON.stringify([...new Set(ids)]));
  } catch {
    // no-op
  }
}

export function parseOnboardingState(value: unknown): OnboardingState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  const seen = record.seenTooltips;
  return {
    currentStepId: typeof record.currentStepId === "string" ? record.currentStepId : undefined,
    currentStepIndex:
      typeof record.currentStepIndex === "number" ? record.currentStepIndex : undefined,
    active: typeof record.active === "boolean" ? record.active : undefined,
    phase: isTourPhase(record.phase) ? record.phase : undefined,
    seenTooltips: Array.isArray(seen)
      ? seen.filter((id): id is string => typeof id === "string")
      : undefined,
  };
}
