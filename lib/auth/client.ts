import { resolveBrowserOrigin } from "@/lib/app-url";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 365;

export function createAuthSupabaseClient(_rememberMe = false) {
  return getBrowserSupabaseClient();
}

/** Re-apply cookie lifetime after sign-in because @supabase/ssr always uses its default maxAge. */
export function applyRememberMeCookies(rememberMe: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  for (const entry of document.cookie.split(";")) {
    const trimmed = entry.trim();
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const name = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);
    if (!name.startsWith("sb-")) {
      continue;
    }

    if (rememberMe) {
      document.cookie = `${name}=${value}; path=/; max-age=${REMEMBER_ME_MAX_AGE}; SameSite=Lax${secure}`;
    } else {
      document.cookie = `${name}=${value}; path=/; SameSite=Lax${secure}`;
    }
  }
}

export async function signOut() {
  const supabase = getBrowserSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

/** Absolute callback URL for Supabase OAuth / email links (provider APIs require absolute URLs). */
export function getAuthCallbackUrl(next = "/decks") {
  const safeNext = getSafeNextPath(next);
  return `${resolveBrowserOrigin()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function getSafeNextPath(next: string | null | undefined, fallback = "/decks"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}
