import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";
import { parseOnboardingState } from "@/lib/onboarding/storage";
import type { OnboardingState } from "@/lib/onboarding/types";

export type UserProfile = {
  id: string;
  email: string;
  plan_type: string;
  subscription_status: string;
  billing_period: string | null;
  has_completed_tutorial: boolean;
  tutorial_completed_at: string | null;
  onboarding_state: OnboardingState;
};

const profileColumnsWithOnboarding =
  "id, email, plan_type, subscription_status, billing_period, has_completed_tutorial, tutorial_completed_at, onboarding_state" as const;

const profileColumnsLegacy =
  "id, email, plan_type, subscription_status, billing_period" as const;

function resolveUserEmail(user: User): string | null {
  const direct = user.email?.trim();
  if (direct) return direct;

  const metaEmail = user.user_metadata?.email;
  if (typeof metaEmail === "string" && metaEmail.trim()) {
    return metaEmail.trim();
  }

  return null;
}

function isMissingOnboardingColumnError(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("has_completed_tutorial") ||
    message.includes("onboarding_state") ||
    message.includes("tutorial_completed_at") ||
    message.includes("does not exist")
  );
}

function mapProfileRow(data: {
  id: string;
  email: string;
  plan_type: string;
  subscription_status: string;
  billing_period: string | null;
  has_completed_tutorial?: boolean | null;
  tutorial_completed_at?: string | null;
  onboarding_state?: Record<string, unknown> | null;
}): UserProfile {
  return {
    id: data.id,
    email: data.email,
    plan_type: data.plan_type,
    subscription_status: data.subscription_status,
    billing_period: data.billing_period,
    has_completed_tutorial: Boolean(data.has_completed_tutorial),
    tutorial_completed_at: data.tutorial_completed_at ?? null,
    onboarding_state: parseOnboardingState(data.onboarding_state),
  };
}

async function fetchProfileByUserId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const full = await supabase
    .from("profile")
    .select(profileColumnsWithOnboarding)
    .eq("user_id", userId)
    .maybeSingle();

  if (!full.error) {
    return { profile: full.data ? mapProfileRow(full.data) : null, error: null };
  }

  if (!isMissingOnboardingColumnError(full.error)) {
    return { profile: null, error: full.error.message };
  }

  const legacy = await supabase
    .from("profile")
    .select(profileColumnsLegacy)
    .eq("user_id", userId)
    .maybeSingle();

  if (legacy.error) {
    return { profile: null, error: legacy.error.message };
  }

  if (!legacy.data) {
    return { profile: null, error: null };
  }

  return {
    profile: mapProfileRow({
      ...legacy.data,
      // Without onboarding columns, treat as incomplete so the welcome tour can run.
      // Completion is tracked in user-scoped localStorage until the migration is applied.
      has_completed_tutorial: false,
      tutorial_completed_at: null,
      onboarding_state: {},
    }),
    error: null,
  };
}

export async function getOrCreateProfileForUser(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const existing = await fetchProfileByUserId(supabase, user.id);
  if (existing.error || existing.profile) {
    return existing;
  }

  const email = resolveUserEmail(user);
  if (!email) {
    return { profile: null, error: "Profile not found for this account." };
  }

  const inserted = await supabase
    .from("profile")
    .insert({ user_id: user.id, email })
    .select(profileColumnsWithOnboarding)
    .single();

  if (!inserted.error && inserted.data) {
    return { profile: mapProfileRow(inserted.data), error: null };
  }

  if (inserted.error?.code === "23505") {
    return fetchProfileByUserId(supabase, user.id);
  }

  if (inserted.error && isMissingOnboardingColumnError(inserted.error)) {
    const legacyInsert = await supabase
      .from("profile")
      .insert({ user_id: user.id, email })
      .select(profileColumnsLegacy)
      .single();

    if (!legacyInsert.error && legacyInsert.data) {
      return {
        profile: mapProfileRow({
          ...legacyInsert.data,
          has_completed_tutorial: false,
          tutorial_completed_at: null,
          onboarding_state: {},
        }),
        error: null,
      };
    }

    if (legacyInsert.error?.code === "23505") {
      return fetchProfileByUserId(supabase, user.id);
    }

    return {
      profile: null,
      error: legacyInsert.error?.message ?? "Profile not found for this account.",
    };
  }

  return {
    profile: null,
    error: inserted.error?.message ?? "Profile not found for this account.",
  };
}
