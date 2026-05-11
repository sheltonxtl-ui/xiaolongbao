"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

const inputClassName =
  "w-full rounded-[10px] border border-neutral-300 bg-white px-3.5 py-3 text-[15px] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900";

export function SignUpForm() {
  const router = useRouter();
  const { isConfigured } = getSupabasePublicEnv();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setInfo(null);

    if (!isConfigured) {
      setMessage("Supabase environment variables are missing. Add them to .env.local.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setMessage("Use at least 8 characters for your password.");
      return;
    }

    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const supabase = createBrowserSupabaseClient({
        isSingleton: false,
        cookieOptions: {
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 365,
        },
      });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/decks`,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        router.push("/decks");
        router.refresh();
        return;
      }

      setInfo("Check your email to confirm your account, then sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[400px] space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Sign up</h1>

      {message && (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      )}
      {info && (
        <p className="text-sm text-neutral-700" role="status">
          {info}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="signup-email" className="block text-[15px] text-neutral-950">
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClassName}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signup-password" className="block text-[15px] text-neutral-950">
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signup-confirm" className="block text-[15px] text-neutral-950">
          Confirm password
        </label>
        <input
          id="signup-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClassName}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-neutral-950 py-3.5 text-[15px] font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-[15px] text-neutral-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-bold text-neutral-950 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
