"use client";

import { useState } from "react";
import { Button } from "@/components/catalyst/button";
import { createAuthSupabaseClient, getAuthCallbackUrl } from "@/lib/auth/client";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";
import { DiscordIcon, GitHubIcon, GoogleIcon } from "./OAuthProviderIcons";

export type OAuthProvider = "google" | "github" | "discord";

const OAUTH_PROVIDERS: {
  id: OAuthProvider;
  label: string;
  icon: typeof GoogleIcon;
}[] = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "github", label: "GitHub", icon: GitHubIcon },
  { id: "discord", label: "Discord", icon: DiscordIcon },
];

type OAuthButtonsProps = {
  redirectNext?: string;
  disabled?: boolean;
  onError?: (message: string | null) => void;
};

export function OAuthButtons({
  redirectNext = "/decks",
  disabled = false,
  onError,
}: OAuthButtonsProps) {
  const { isConfigured } = getSupabasePublicEnv();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  async function signInWithProvider(provider: OAuthProvider) {
    onError?.(null);

    if (!isConfigured) {
      onError?.("Supabase environment variables are missing. Add them to .env.local.");
      return;
    }

    setLoadingProvider(provider);
    try {
      const supabase = createAuthSupabaseClient(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthCallbackUrl(redirectNext),
          ...(provider === "discord" ? { scopes: "identify email" } : {}),
        },
      });

      if (error) {
        onError?.(error.message);
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      onError?.("Could not start social sign-in. Check your connection and try again.");
    } finally {
      setLoadingProvider(null);
    }
  }

  const busy = disabled || loadingProvider !== null;

  return (
    <div className="grid grid-cols-1 gap-3" role="group" aria-label="Social sign in">
      {OAUTH_PROVIDERS.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          type="button"
          outline
          disabled={busy}
          onClick={() => signInWithProvider(id)}
          className="w-full"
        >
          <Icon className="size-5" />
          {loadingProvider === id ? "Redirecting…" : `Continue with ${label}`}
        </Button>
      ))}
    </div>
  );
}
