"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Text, TextLink } from "@/components/catalyst/text";
import { getAuthCallbackUrl } from "@/lib/auth/client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const { isConfigured } = getSupabasePublicEnv();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(
    searchParams.get("error") === "recovery-expired"
      ? "That reset link has expired. Enter your email below to receive a new one."
      : null,
  );
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
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getAuthCallbackUrl("/reset-password"),
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
    <form onSubmit={onSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <div className="space-y-2">
        <Heading>Forgot password</Heading>
        <Text>Enter the email you use for xiaolongbao. We&apos;ll send a link to reset your password.</Text>
      </div>

      {message && (
        <Text role="alert" className="text-red-600 dark:text-red-500">
          {message}
        </Text>
      )}
      {sent && (
        <Text role="status" className="text-zinc-700 dark:text-zinc-300">
          If an account exists for that email, you&apos;ll receive a reset link shortly.
        </Text>
      )}

      <Fieldset>
        <Field>
          <Label>Email</Label>
          <Input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={sent}
          />
        </Field>
      </Fieldset>

      <Button type="submit" color="dark" className="w-full" disabled={loading || sent}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>

      <Text className="text-center">
        <TextLink href="/sign-in">Back to sign in</TextLink>
      </Text>
    </form>
  );
}
