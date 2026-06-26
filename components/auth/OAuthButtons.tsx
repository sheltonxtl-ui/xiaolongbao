"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/catalyst/button";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/auth/oauth-providers";
import { DiscordIcon, GitHubIcon, GoogleIcon } from "./OAuthProviderIcons";

const PROVIDER_ICONS = {
  google: GoogleIcon,
  github: GitHubIcon,
  discord: DiscordIcon,
} as const;

type OAuthButtonsProps = {
  redirectNext?: string;
  disabled?: boolean;
  onError?: (message: string | null) => void;
  returnTo?: "/sign-in" | "/signup";
};

export function OAuthButtons({
  redirectNext = "/decks",
  disabled = false,
  onError,
  returnTo = "/sign-in",
}: OAuthButtonsProps) {
  const router = useRouter();

  function goToConfirmPage(provider: OAuthProvider) {
    onError?.(null);

    const params = new URLSearchParams({ next: redirectNext });
    if (returnTo === "/signup") {
      params.set("from", "signup");
    }

    router.push(`/sign-in/oauth/${provider}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 gap-3" role="group" aria-label="Social sign in">
      {OAUTH_PROVIDERS.map(({ id, label }) => {
        const Icon = PROVIDER_ICONS[id];

        return (
          <Button
            key={id}
            type="button"
            outline
            disabled={disabled}
            onClick={() => goToConfirmPage(id)}
            className="w-full"
          >
            <Icon className="size-5" />
            {`Continue with ${label}`}
          </Button>
        );
      })}
    </div>
  );
}
