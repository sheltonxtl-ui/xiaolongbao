"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/catalyst/button";
import { Description, Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Text, TextLink } from "@/components/catalyst/text";
import { establishRecoverySession } from "@/lib/auth/recovery";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

export function ResetPasswordForm() {
  const router = useRouter();
  const { isConfigured } = getSupabasePublicEnv();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      setMessage("Supabase environment variables are missing. Add them to .env.local.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function verifySession() {
      const supabase = createBrowserSupabaseClient();
      await establishRecoverySession(supabase);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (error || !user) {
        setMessage(
          "This reset link is invalid or has expired. Request a new link from the forgot password page.",
        );
        setReady(false);
      } else {
        setReady(true);
      }

      setLoading(false);
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [isConfigured]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

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

    setSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        return;
      }

      await supabase.auth.signOut();

      router.push("/sign-in?message=password-updated");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid w-full max-w-sm animate-pulse grid-cols-1 gap-8">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800/80" />
        </div>
        <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
        <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
        <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <div className="space-y-2">
          <Heading>Reset link expired</Heading>
          <Text>We couldn&apos;t verify your password reset link.</Text>
        </div>

        {message && (
          <Text role="alert" className="text-red-600 dark:text-red-500">
            {message}
          </Text>
        )}

        <Button color="dark" href="/forgot-password" className="w-full">
          Request a new reset link
        </Button>

        <Text className="text-center">
          <TextLink href="/sign-in">Back to sign in</TextLink>
        </Text>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <div className="space-y-2">
        <Heading>Choose a new password</Heading>
        <Text>Enter and confirm your new password below.</Text>
      </div>

      {message && (
        <Text role="alert" className="text-red-600 dark:text-red-500">
          {message}
        </Text>
      )}

      <Fieldset>
        <Field>
          <Label>New password</Label>
          <Input
            id="reset-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Description>Use at least 8 characters.</Description>
        </Field>

        <Field>
          <Label>Confirm new password</Label>
          <Input
            id="reset-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
      </Fieldset>

      <Button type="submit" color="dark" className="w-full" disabled={submitting}>
        {submitting ? "Updating password…" : "Update password"}
      </Button>

      <Text className="text-center">
        <TextLink href="/sign-in">Back to sign in</TextLink>
      </Text>
    </form>
  );
}
