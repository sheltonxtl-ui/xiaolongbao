import type { SupabaseClient } from "@supabase/supabase-js";

export function parseRecoveryHashFromUrl(url: string): {
  accessToken: string;
  refreshToken: string;
} | null {
  const parsed = new URL(url);
  const hash = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  if (params.get("type") !== "recovery") {
    return null;
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

export async function establishRecoverySession(
  supabase: SupabaseClient,
  url = typeof window !== "undefined" ? window.location.href : "",
): Promise<boolean> {
  const tokens = parseRecoveryHashFromUrl(url);
  if (!tokens) {
    return false;
  }

  const { error } = await supabase.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });

  if (error) {
    return false;
  }

  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", window.location.pathname);
  }

  return true;
}
