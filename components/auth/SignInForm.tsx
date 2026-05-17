"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { ErrorMessage, Field, FieldGroup, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Switch, SwitchField } from "@/components/catalyst/switch";
import { Text, TextLink } from "@/components/catalyst/text";
import { createAuthSupabaseClient } from "@/lib/auth/client";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConfigured } = getSupabasePublicEnv();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const urlError = searchParams.get("error");
  const displayError =
    message ??
    (urlError === "auth"
      ? "Something went wrong while signing you in. Try again or use another sign-in method."
      : null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!isConfigured) {
      setMessage("Supabase environment variables are missing. Add them to .env.local.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createAuthSupabaseClient(rememberMe);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
    <form onSubmit={onSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <div className="space-y-2">
        <Heading>Sign in</Heading>
        <Text>Welcome back. Sign in to manage decks and study.</Text>
      </div>

      {displayError && <ErrorMessage role="alert">{displayError}</ErrorMessage>}

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
            id="signin-email"
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
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <FieldGroup className="mt-8">
          <SwitchField>
            <Label>Remember me</Label>
            <Switch checked={rememberMe} onChange={setRememberMe} name="remember" />
          </SwitchField>

          <div className="flex justify-end">
            <TextLink href="/forgot-password" className="text-sm/6">
              Forgot password?
            </TextLink>
          </div>
        </FieldGroup>
      </Fieldset>

      <Button type="submit" color="dark" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <Text className="text-center">
        Don&apos;t have an account? <TextLink href="/signup">Sign up</TextLink>
      </Text>
    </form>
  );
}
