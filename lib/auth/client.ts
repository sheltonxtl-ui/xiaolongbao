import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 365;

export function createAuthSupabaseClient(rememberMe = false) {
  return createBrowserSupabaseClient({
    isSingleton: false,
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      ...(rememberMe ? { maxAge: REMEMBER_ME_MAX_AGE } : {}),
    },
  });
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
  const supabase = createBrowserSupabaseClient({ isSingleton: false });
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export function getAuthCallbackUrl(next = "/decks") {
  const origin = getSiteOrigin();
  const safeNext = next.startsWith("/") ? next : "/decks";
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
