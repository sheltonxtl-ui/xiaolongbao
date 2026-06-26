export type OAuthProvider = "google" | "github" | "discord";

export type OAuthProviderMeta = {
  id: OAuthProvider;
  label: string;
  confirmDescription: string;
};

export const OAUTH_PROVIDERS: OAuthProviderMeta[] = [
  {
    id: "google",
    label: "Google",
    confirmDescription:
      "You will continue to Google to verify your account, then return here to finish signing in.",
  },
  {
    id: "github",
    label: "GitHub",
    confirmDescription:
      "You will continue to GitHub to verify your account, then return here to finish signing in.",
  },
  {
    id: "discord",
    label: "Discord",
    confirmDescription:
      "You will continue to Discord to verify your account, then return here to finish signing in. Discord needs a verified email on your account.",
  },
];

export function isOAuthProvider(value: string | undefined | null): value is OAuthProvider {
  return OAUTH_PROVIDERS.some((provider) => provider.id === value);
}

export function getOAuthProviderMeta(provider: OAuthProvider): OAuthProviderMeta {
  const meta = OAUTH_PROVIDERS.find((entry) => entry.id === provider);
  if (!meta) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }

  return meta;
}
