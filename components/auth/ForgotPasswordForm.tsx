"use client";

import Link from "next/link";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

const inputClassName =
  "w-full rounded-[10px] border border-neutral-300 bg-white px-3.5 py-3 text-[15px] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900";

export function ForgotPasswordForm() {
  const { isConfigured } = getSupabasePublicEnv();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!isConfigured) {
      setMessage("Supabase environment variables are missing. Add them to .env.local.");
      return;
    }

    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=/sign-in`,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[400px] space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Forgot password</h1>
      <p className="text-[15px] leading-relaxed text-neutral-600">
        Enter the email you use for xiaolongbao. We&apos;ll send a link to reset your password.
      </p>

      {message && (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      )}
      {sent && (
        <p className="text-sm text-neutral-700" role="status">
          If an account exists for that email, you&apos;ll receive a reset link shortly.
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="forgot-email" className="block text-[15px] text-neutral-950">
          Email
        </label>
        <input
          id="forgot-email"
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

      <button
        type="submit"
        disabled={loading || sent}
        className="w-full rounded-full bg-neutral-950 py-3.5 text-[15px] font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-[15px] text-neutral-500">
        <Link href="/sign-in" className="font-bold text-neutral-950 underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
