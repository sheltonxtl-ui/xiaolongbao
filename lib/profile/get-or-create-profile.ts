import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";

export type UserProfile = {
  id: string;
  email: string;
  plan_type: string;
  subscription_status: string;
  billing_period: string | null;
};

const profileColumns =
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

async function fetchProfileByUserId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profile")
    .select(profileColumns)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data, error: null };
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

  const { data: created, error: insertError } = await supabase
    .from("profile")
    .insert({ user_id: user.id, email })
    .select(profileColumns)
    .single();

  if (!insertError && created) {
    return { profile: created, error: null };
  }

  if (insertError?.code === "23505") {
    return fetchProfileByUserId(supabase, user.id);
  }

  return {
    profile: null,
    error: insertError?.message ?? "Profile not found for this account.",
  };
}
