import { createAuthSupabaseClient, getAuthCallbackUrl } from "@/lib/auth/client";
import type { OAuthProvider } from "@/lib/auth/oauth-providers";

export type OAuthSignInOptions = {
  loginHint?: string;
  selectAccount?: boolean;
};

export async function startOAuthSignIn(
  provider: OAuthProvider,
  redirectNext: string,
  options: OAuthSignInOptions = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  const googleQueryParams: Record<string, string> = {};

  if (provider === "google") {
    if (options.loginHint) {
      googleQueryParams.login_hint = options.loginHint;
    }
    if (options.selectAccount) {
      googleQueryParams.prompt = "select_account";
    }
  }

  const supabase = createAuthSupabaseClient(true);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getAuthCallbackUrl(redirectNext),
      ...(Object.keys(googleQueryParams).length > 0 ? { queryParams: googleQueryParams } : {}),
      ...(provider === "discord" ? { scopes: "identify email" } : {}),
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data.url) {
    window.location.assign(data.url);
    return { ok: true };
  }

  return {
    ok: false,
    error: "Could not start social sign-in. Check your connection and try again.",
  };
}
