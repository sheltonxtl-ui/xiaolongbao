"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { Description, Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Text, TextLink } from "@/components/catalyst/text";
import { createAuthSupabaseClient, getAuthCallbackUrl } from "@/lib/auth/client";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

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
      const supabase = createAuthSupabaseClient(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl("/decks"),
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
    <form onSubmit={onSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <div className="space-y-2">
        <Heading>Create your account</Heading>
        <Text>Get started with email or connect a provider below.</Text>
      </div>

      {message && (
        <Text role="alert" className="text-red-600 dark:text-red-500">
          {message}
        </Text>
      )}
      {info && (
        <Text role="status" className="text-zinc-700 dark:text-zinc-300">
          {info}
        </Text>
      )}

      <OAuthButtons disabled={loading} onError={setMessage} />

      <div className="flex items-center gap-4">
        <Divider soft className="flex-1" />
        <Text className="shrink-0 text-zinc-400">or</Text>
        <Divider soft className="flex-1" />
      </div>

      <Fieldset>
        <Field>
          <Label>Email</Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field>
          <Label>Password</Label>
          <Input
            id="signup-password"
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
          <Label>Confirm password</Label>
          <Input
            id="signup-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
      </Fieldset>

      <Button type="submit" color="dark" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <Text className="text-center">
        Already have an account? <TextLink href="/sign-in">Sign in</TextLink>
      </Text>
    </form>
  );
}
