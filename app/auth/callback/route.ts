import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { oauthFailureReasonFromDescription } from "@/lib/auth/oauth-errors";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

function getRedirectOrigin(request: Request) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return origin;
  }

  if (forwardedHost) {
    return `https://${forwardedHost}`;
  }

  return origin;
}

function authFailureRedirectPath(next: string): string {
  return next === "/reset-password"
    ? "/forgot-password?error=recovery-expired"
    : "/sign-in?error=auth";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/decks";
  const redirectOrigin = getRedirectOrigin(request);

  const oauthError = searchParams.get("error");
  if (oauthError) {
    const params = new URLSearchParams({ error: "oauth" });
    const description = searchParams.get("error_description");
    if (description) {
      params.set("reason", oauthFailureReasonFromDescription(description));
    }
    return NextResponse.redirect(`${redirectOrigin}/sign-in?${params.toString()}`);
  }

  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  if (!isConfigured || !code) {
    return NextResponse.redirect(`${redirectOrigin}${authFailureRedirectPath(next)}`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // ignore
        }
      },
    },
  });

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${redirectOrigin}${authFailureRedirectPath(next)}`);
    }
  } catch {
    return NextResponse.redirect(`${redirectOrigin}${authFailureRedirectPath(next)}`);
  }

  if (!next.startsWith("/")) {
    return NextResponse.redirect(`${redirectOrigin}/decks`);
  }

  return NextResponse.redirect(`${redirectOrigin}${next}`);
}
