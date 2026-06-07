export function passwordSignInFailureMessage(supabaseMessage: string): string {
  const normalized = supabaseMessage.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "Incorrect email or password. Check your credentials and try again, or use Forgot password below to reset it.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
  }

  return supabaseMessage;
}

export function authCallbackFailureMessage(): string {
  return "Sign-in could not be completed. If you use email and password, double-check both. If you signed up with Google, GitHub, or Discord, use that button instead.";
}
