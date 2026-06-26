import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OAuthConfirmForm } from "@/components/auth/OAuthConfirmForm";
import {
  getOAuthProviderMeta,
  isOAuthProvider,
  type OAuthProvider,
} from "@/lib/auth/oauth-providers";

type OAuthConfirmPageProps = {
  params: Promise<{ provider: string }>;
  searchParams: Promise<{ from?: string }>;
};

function OAuthConfirmFallback() {
  return (
    <div className="grid w-full max-w-sm animate-pulse grid-cols-1 gap-8">
      <div className="space-y-4">
        <div className="size-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800/80" />
        </div>
      </div>
      <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
    </div>
  );
}

export async function generateMetadata({ params }: OAuthConfirmPageProps): Promise<Metadata> {
  const { provider } = await params;

  if (!isOAuthProvider(provider)) {
    return { title: "Sign in" };
  }

  const meta = getOAuthProviderMeta(provider);
  return {
    title: `Continue with ${meta.label}`,
    description: meta.confirmDescription,
  };
}

function OAuthConfirmPageContent({
  provider,
  returnTo,
}: {
  provider: OAuthProvider;
  returnTo: "/sign-in" | "/signup";
}) {
  return <OAuthConfirmForm provider={provider} returnTo={returnTo} />;
}

export default async function OAuthConfirmPage({
  params,
  searchParams,
}: OAuthConfirmPageProps) {
  const { provider } = await params;
  const { from } = await searchParams;

  if (!isOAuthProvider(provider) || provider === "google") {
    notFound();
  }

  const returnTo = from === "signup" ? "/signup" : "/sign-in";

  return (
    <Suspense fallback={<OAuthConfirmFallback />}>
      <OAuthConfirmPageContent provider={provider} returnTo={returnTo} />
    </Suspense>
  );
}
