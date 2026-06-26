import type { CookieMethodsBrowser, CookieOptionsWithName } from "@supabase/ssr";
import type { SupabaseClient, SupabaseClientOptions } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "./browser";

type BrowserSupabaseOptions = SupabaseClientOptions<"public"> & {
  cookies?: CookieMethodsBrowser;
  cookieOptions?: CookieOptionsWithName;
  cookieEncoding?: "raw" | "base64url";
  isSingleton?: boolean;
};

/** Prefer getBrowserSupabaseClient() — returns the shared singleton by default. */
export function createBrowserSupabaseClient(
  options?: BrowserSupabaseOptions,
): SupabaseClient {
  if (options?.isSingleton === false) {
    throw new Error(
      "Do not create extra browser Supabase clients. Use getBrowserSupabaseClient() instead.",
    );
  }

  return getBrowserSupabaseClient();
}

export { getBrowserSupabaseClient } from "./browser";
