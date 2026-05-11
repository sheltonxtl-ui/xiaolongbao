import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/decks";

  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  if (!isConfigured || !code) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  if (!next.startsWith("/")) {
    return NextResponse.redirect(`${origin}/decks`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
