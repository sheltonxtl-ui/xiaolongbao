import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function createAuthSupabaseClient(rememberMe = false) {
  return createBrowserSupabaseClient({
    isSingleton: false,
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      ...(rememberMe ? { maxAge: 60 * 60 * 24 * 365 } : {}),
    },
  });
}

export function getAuthCallbackUrl(next = "/decks") {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const safeNext = next.startsWith("/") ? next : "/decks";
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
