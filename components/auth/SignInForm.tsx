"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";
import { RememberSwitch } from "./RememberSwitch";

const inputClassName =
  "w-full rounded-[10px] border border-neutral-300 bg-white px-3.5 py-3 text-[15px] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConfigured } = getSupabasePublicEnv();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const urlError = searchParams.get("error");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!isConfigured) {
      setMessage("Supabase environment variables are missing. Add them to .env.local.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient({
        isSingleton: false,
        cookieOptions: {
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          ...(rememberMe ? { maxAge: 60 * 60 * 24 * 365 } : {}),
        },
      });

      const email = username.trim();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.push("/decks");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[400px] space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Sign in</h1>

      {(urlError === "auth" || message) && (
        <p className="text-sm text-red-600" role="alert">
          {message ??
            "Something went wrong while signing you in. Try again or request a new magic link from your email."}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="signin-username" className="block text-[15px] text-neutral-950">
          Username
        </label>
        <input
          id="signin-username"
          name="username"
          type="email"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClassName}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signin-password" className="block text-[15px] text-neutral-950">
          Password
        </label>
        <input
          id="signin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2.5">
          <RememberSwitch checked={rememberMe} onChange={setRememberMe} />
          <span className="text-[15px] text-neutral-950">Remember me</span>
        </label>
        <Link
          href="/forgot-password"
          className="text-[15px] font-bold text-neutral-950 underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-neutral-950 py-3.5 text-[15px] font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Get started"}
      </button>

      <p className="text-center text-[15px] text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold text-neutral-950 underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
