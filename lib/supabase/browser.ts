import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./public-env";

let browserClient: SupabaseClient | null = null;

/** Shared browser Supabase client — avoids concurrent auth token lock contention. */
export function getBrowserSupabaseClient(): SupabaseClient {
  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local.",
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, anonKey, {
      isSingleton: true,
      cookieOptions: {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    });
  }

  return browserClient;
}
