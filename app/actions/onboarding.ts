"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";
import { getOrCreateProfileForUser } from "@/lib/profile/get-or-create-profile";
import { parseOnboardingState } from "@/lib/onboarding/storage";
import type { OnboardingState } from "@/lib/onboarding/types";
import type { Database } from "@/types/database.generated";

type ProfileOnboardingState = Database["public"]["Tables"]["profile"]["Update"]["onboarding_state"];

function toJsonState(state: OnboardingState & { skipped?: boolean }): ProfileOnboardingState {
  return state as ProfileOnboardingState;
}

function isMissingOnboardingColumnError(message: string | undefined): boolean {
  const lower = (message ?? "").toLowerCase();
  return (
    lower.includes("has_completed_tutorial") ||
    lower.includes("onboarding_state") ||
    lower.includes("tutorial_completed_at") ||
    lower.includes("does not exist") ||
    lower.includes("42703")
  );
}

export type OnboardingProfileSnapshot = {
  hasCompletedTutorial: boolean;
  onboardingState: OnboardingState;
};

export type OnboardingActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function getOnboardingProfileAction(): Promise<
  | { ok: true; data: OnboardingProfileSnapshot }
  | { ok: false; error: string; data: OnboardingProfileSnapshot }
> {
  const fallback: OnboardingProfileSnapshot = {
    hasCompletedTutorial: false,
    onboardingState: {},
  };

  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    return { ok: false, error: "Supabase is not configured.", data: fallback };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not signed in.", data: fallback };
  }

  const { profile, error } = await getOrCreateProfileForUser(supabase, user);
  if (!profile) {
    return { ok: false, error: error ?? "Profile not found.", data: fallback };
  }

  return {
    ok: true,
    data: {
      hasCompletedTutorial: profile.has_completed_tutorial,
      onboardingState: parseOnboardingState(profile.onboarding_state),
    },
  };
}

export async function saveOnboardingProgressAction(
  state: OnboardingState,
): Promise<OnboardingActionResult> {
  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { profile, error } = await getOrCreateProfileForUser(supabase, user);
  if (!profile) {
    return { ok: false, error: error ?? "Profile not found." };
  }

  const previous = parseOnboardingState(profile.onboarding_state);
  const nextState: OnboardingState = {
    ...previous,
    ...state,
    seenTooltips: [...new Set([...(previous.seenTooltips ?? []), ...(state.seenTooltips ?? [])])],
  };

  const { error: updateError } = await supabase
    .from("profile")
    .update({ onboarding_state: toJsonState(nextState) })
    .eq("id", profile.id);

  if (updateError) {
    // Schema may not have onboarding columns yet — client keeps progress in localStorage.
    if (isMissingOnboardingColumnError(updateError.message)) {
      return { ok: true };
    }
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}

export async function completeTutorialAction(
  options: { skipped?: boolean } = {},
): Promise<OnboardingActionResult> {
  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { profile, error } = await getOrCreateProfileForUser(supabase, user);
  if (!profile) {
    return { ok: false, error: error ?? "Profile not found." };
  }

  const previous = parseOnboardingState(profile.onboarding_state);
  const nextState: OnboardingState = {
    ...previous,
    active: false,
    currentStepId: undefined,
    currentStepIndex: undefined,
  };

  const { error: updateError } = await supabase
    .from("profile")
    .update({
      has_completed_tutorial: true,
      tutorial_completed_at: new Date().toISOString(),
      onboarding_state: toJsonState({
        ...nextState,
        skipped: Boolean(options.skipped),
      }),
    })
    .eq("id", profile.id);

  if (updateError) {
    if (isMissingOnboardingColumnError(updateError.message)) {
      return { ok: true };
    }
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}

export async function resetTutorialAction(): Promise<OnboardingActionResult> {
  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { profile, error } = await getOrCreateProfileForUser(supabase, user);
  if (!profile) {
    return { ok: false, error: error ?? "Profile not found." };
  }

  const previous = parseOnboardingState(profile.onboarding_state);
  const nextState: OnboardingState = {
    ...previous,
    active: true,
    phase: "welcome",
    currentStepIndex: 0,
    currentStepId: "welcome",
  };

  const { error: updateError } = await supabase
    .from("profile")
    .update({
      has_completed_tutorial: false,
      tutorial_completed_at: null,
      onboarding_state: toJsonState(nextState),
    })
    .eq("id", profile.id);

  if (updateError) {
    if (isMissingOnboardingColumnError(updateError.message)) {
      return { ok: true };
    }
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}

export async function markTooltipSeenAction(tipId: string): Promise<OnboardingActionResult> {
  if (!tipId.trim()) {
    return { ok: false, error: "Missing tip id." };
  }

  return saveOnboardingProgressAction({ seenTooltips: [tipId] });
}
