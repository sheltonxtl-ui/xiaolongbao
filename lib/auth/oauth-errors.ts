export type OAuthFailureReason = "oauth-exchange" | "discord-email" | "oauth";

export function parseOAuthFailureFromUrl(url: string): {
  error: string;
  description: string | null;
  reason: OAuthFailureReason;
} | null {
  const parsed = new URL(url);
  const query = parsed.searchParams;
  const hash = new URLSearchParams(parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash);

  const error = query.get("error") ?? hash.get("error");
  if (!error) {
    return null;
  }

  const description = query.get("error_description") ?? hash.get("error_description");
  const normalized = description?.toLowerCase() ?? "";

  let reason: OAuthFailureReason = "oauth";
  if (normalized.includes("email")) {
    reason = "discord-email";
  } else if (normalized.includes("exchange external code")) {
    reason = "oauth-exchange";
  }

  return { error, description, reason };
}

export function oauthFailureMessage(reason: OAuthFailureReason): string {
  switch (reason) {
    case "discord-email":
      return "Discord sign-in needs a verified email on your Discord account. Add one in Discord settings, then try again.";
    case "oauth-exchange":
      return "Social sign-in could not be completed. Confirm Discord is enabled in Supabase and your redirect URLs are configured correctly, then try again.";
    default:
      return "Something went wrong while signing in with Google, GitHub, or Discord. Try again, or sign in with email and password instead.";
  }
}

export function oauthFailureReasonFromDescription(description: string | null): OAuthFailureReason {
  const normalized = description?.toLowerCase() ?? "";
  if (normalized.includes("email")) {
    return "discord-email";
  }
  if (normalized.includes("exchange external code")) {
    return "oauth-exchange";
  }
  return "oauth";
}
