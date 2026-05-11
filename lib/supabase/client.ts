import { createBrowserClient, type CookieMethodsBrowser, type CookieOptionsWithName } from "@supabase/ssr";
import type { SupabaseClient, SupabaseClientOptions } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./public-env";

type BrowserSupabaseOptions = SupabaseClientOptions<"public"> & {
  cookies?: CookieMethodsBrowser;
  cookieOptions?: CookieOptionsWithName;
  cookieEncoding?: "raw" | "base64url";
  isSingleton?: boolean;
};

export function createBrowserSupabaseClient(options?: BrowserSupabaseOptions): SupabaseClient {
  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local.",
    );
  }
  return createBrowserClient(url, anonKey, options);
}
