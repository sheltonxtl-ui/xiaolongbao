"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/catalyst/button";
import { Heading } from "@/components/catalyst/heading";
import { Text, TextLink } from "@/components/catalyst/text";
import { getSafeNextPath } from "@/lib/auth/client";
import {
  getOAuthProviderMeta,
  type OAuthProvider,
} from "@/lib/auth/oauth-providers";
import { startOAuthSignIn } from "@/lib/auth/start-oauth-sign-in";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";
import { DiscordIcon, GitHubIcon, GoogleIcon } from "./OAuthProviderIcons";

const PROVIDER_ICONS = {
  google: GoogleIcon,
  github: GitHubIcon,
  discord: DiscordIcon,
} as const;

type OAuthConfirmFormProps = {
  provider: OAuthProvider;
  returnTo?: "/sign-in" | "/signup";
};

export function OAuthConfirmForm({
  provider,
  returnTo = "/sign-in",
}: OAuthConfirmFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConfigured } = getSupabasePublicEnv();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = getOAuthProviderMeta(provider);
  const Icon = PROVIDER_ICONS[provider];
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const returnHref =
    returnTo === "/signup"
      ? "/signup"
      : nextPath === "/decks"
        ? "/sign-in"
        : `/sign-in?next=${encodeURIComponent(nextPath)}`;

  async function onContinue() {
    setError(null);

    if (!isConfigured) {
      setError("Supabase environment variables are missing. Add them to .env.local.");
      return;
    }

    setLoading(true);
    try {
      const result = await startOAuthSignIn(provider, nextPath);
      if (!result.ok) {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid w-full max-w-sm grid-cols-1 gap-8">
      <div className="space-y-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          <Icon className="size-6" />
        </div>
        <div className="space-y-2">
          <Heading>Continue with {meta.label}</Heading>
          <Text>{meta.confirmDescription}</Text>
        </div>
      </div>

      {error ? (
        <Text role="alert" className="text-red-600 dark:text-red-500">
          {error}
        </Text>
      ) : null}

      <div className="grid grid-cols-1 gap-3">
        <Button type="button" color="dark" className="w-full" disabled={loading} onClick={onContinue}>
          {loading ? "Redirecting…" : `Continue to ${meta.label}`}
        </Button>
        <Button
          type="button"
          outline
          className="w-full"
          disabled={loading}
          onClick={() => router.push(returnHref)}
        >
          Cancel
        </Button>
      </div>

      <Text className="text-center text-sm/6">
        <TextLink href={returnHref}>Back to {returnTo === "/signup" ? "sign up" : "sign in"}</TextLink>
      </Text>
    </div>
  );
}
