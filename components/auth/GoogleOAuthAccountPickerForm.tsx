"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  buildGoogleOAuthHref,
  buildGoogleOAuthReturnHref,
  GoogleOAuthLeftPanel,
  GoogleOAuthLegalNotice,
  GoogleOAuthShell,
} from "@/components/auth/GoogleOAuthShell";
import { Avatar } from "@/components/catalyst/avatar";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { Strong, Text, TextLink } from "@/components/catalyst/text";
import { getSafeNextPath } from "@/lib/auth/client";
import { startOAuthSignIn } from "@/lib/auth/start-oauth-sign-in";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

type GoogleOAuthAccountPickerFormProps = {
  returnTo?: "/sign-in" | "/signup";
};

function AccountOption({
  disabled,
  avatar,
  title,
  subtitle,
  onClick,
}: {
  disabled: boolean;
  avatar: ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <Button
      plain
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full justify-start gap-4 rounded-none px-1 py-3 text-left hover:bg-[#f8f9fa] dark:hover:bg-zinc-800/50"
    >
      {avatar}
      <span className="min-w-0 text-left">
        <Strong className="block truncate text-sm font-medium text-[#3c4043] dark:text-zinc-100">
          {title}
        </Strong>
        {subtitle ? (
          <Text className="block truncate text-sm text-[#5f6368] dark:text-zinc-400">{subtitle}</Text>
        ) : null}
      </span>
    </Button>
  );
}

export function GoogleOAuthAccountPickerForm({
  returnTo = "/sign-in",
}: GoogleOAuthAccountPickerFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConfigured } = getSupabasePublicEnv();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = getSafeNextPath(searchParams.get("next"));
  const returnHref = buildGoogleOAuthReturnHref(nextPath, returnTo);
  const emailPageHref = buildGoogleOAuthHref("/sign-in/oauth/google/email", nextPath, returnTo);

  async function onContinue() {
    setError(null);

    if (!isConfigured) {
      setError("Supabase environment variables are missing. Add them to .env.local.");
      return;
    }

    setLoading(true);
    try {
      const result = await startOAuthSignIn("google", nextPath);
      if (!result.ok) {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <GoogleOAuthShell
      left={<GoogleOAuthLeftPanel title="Choose an account" />}
      right={
        <>
          <AccountOption
            disabled={loading}
            avatar={
              <Avatar
                initials="G"
                alt=""
                className="size-7 bg-[#fbbc04] text-white outline-none [&_text]:fill-white"
              />
            }
            title={loading ? "Redirecting…" : "Continue with Google"}
            subtitle="Select or add a Google account"
            onClick={onContinue}
          />

          <Divider className="border-[#e8eaed] dark:border-zinc-700" />

          <AccountOption
            disabled={loading}
            avatar={
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[#dadce0] text-[#5f6368] dark:border-zinc-600 dark:text-zinc-400">
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </span>
            }
            title="Use another account"
            onClick={() => router.push(emailPageHref)}
          />

          <GoogleOAuthLegalNotice />

          {error ? (
            <Text role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </Text>
          ) : null}

          <Button
            plain
            type="button"
            disabled={loading}
            onClick={() => router.push(returnHref)}
            className="mt-6 w-fit px-0 text-sm font-medium text-[#1a73e8] hover:bg-transparent dark:text-blue-400"
          >
            Cancel
          </Button>
        </>
      }
    />
  );
}
