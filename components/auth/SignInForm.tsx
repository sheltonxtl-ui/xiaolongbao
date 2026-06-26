"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Switch, SwitchField } from "@/components/catalyst/switch";
import { Text, TextLink } from "@/components/catalyst/text";
import { applyRememberMeCookies, createAuthSupabaseClient, getSafeNextPath } from "@/lib/auth/client";
import { oauthFailureMessage, type OAuthFailureReason } from "@/lib/auth/oauth-errors";
import {
  authCallbackFailureMessage,
  passwordSignInFailureMessage,
} from "@/lib/auth/sign-in-errors";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConfigured } = getSupabasePublicEnv();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");
  const oauthReason = searchParams.get("reason") as OAuthFailureReason | null;
  const confirmedEmail = searchParams.get("email");
  const nextPath = getSafeNextPath(searchParams.get("next"));

  const oauthDisplayError =
    oauthMessage ??
    (urlError === "auth"
      ? authCallbackFailureMessage()
      : urlError === "oauth"
        ? oauthFailureMessage(oauthReason ?? "oauth")
        : null);

  const displayInfo =
    urlMessage === "check-email"
      ? confirmedEmail
        ? `Account created. Check ${confirmedEmail} for a confirmation link, then sign in.`
        : "Account created. Check your email for a confirmation link, then sign in."
      : urlMessage === "password-updated"
        ? "Your password has been updated. Sign in with your new password."
        : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormMessage(null);

    if (!isConfigured) {
      setFormMessage("Supabase environment variables are missing. Add them to .env.local.");
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
        setFormMessage(passwordSignInFailureMessage(error.message));
        return;
      }

      applyRememberMeCookies(rememberMe);

      router.push(nextPath);
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

      {displayInfo && (
        <Text role="status" className="text-zinc-700 dark:text-zinc-300">
          {displayInfo}
        </Text>
      )}

      {oauthDisplayError && (
        <Text role="alert" className="text-red-600 dark:text-red-500">
          {oauthDisplayError}
        </Text>
      )}

      <OAuthButtons disabled={loading} onError={setOauthMessage} redirectNext={nextPath} />

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

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <SwitchField className="w-auto grid-cols-[auto_auto] gap-x-2">
            <Label>Remember me</Label>
            <Switch checked={rememberMe} onChange={setRememberMe} name="remember" />
          </SwitchField>

          <TextLink href="/forgot-password" className="text-sm/6">
            Forgot password?
          </TextLink>
        </div>
      </Fieldset>

      {formMessage && (
        <Text role="alert" className="text-red-600 dark:text-red-500">
          {formMessage}
        </Text>
      )}

      <Button type="submit" color="dark" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <Text className="text-center">
        Don&apos;t have an account? <TextLink href="/signup">Sign up</TextLink>
      </Text>
    </form>
  );
}
