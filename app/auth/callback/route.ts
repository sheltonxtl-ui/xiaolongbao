import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { oauthFailureReasonFromDescription } from "@/lib/auth/oauth-errors";
import { getSafeNextPath } from "@/lib/auth/client";
import { redirectUrlFromRequest } from "@/lib/app-url";
import { getOrCreateProfileForUser } from "@/lib/profile/get-or-create-profile";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

function authFailureRedirectPath(next: string): string {
  return next === "/reset-password"
    ? "/forgot-password?error=recovery-expired"
    : "/sign-in?error=auth";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));

  const oauthError = searchParams.get("error");
  if (oauthError) {
    const params = new URLSearchParams({ error: "oauth" });
    const description = searchParams.get("error_description");
    if (description) {
      params.set("reason", oauthFailureReasonFromDescription(description));
    }
    return NextResponse.redirect(
      redirectUrlFromRequest(request, `/sign-in?${params.toString()}`),
    );
  }

  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  if (!isConfigured || !code) {
    return NextResponse.redirect(
      redirectUrlFromRequest(request, authFailureRedirectPath(next)),
    );
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
      return NextResponse.redirect(
        redirectUrlFromRequest(request, authFailureRedirectPath(next)),
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await getOrCreateProfileForUser(supabase, user);
    }
  } catch {
    return NextResponse.redirect(
      redirectUrlFromRequest(request, authFailureRedirectPath(next)),
    );
  }

  return NextResponse.redirect(redirectUrlFromRequest(request, next));
}
