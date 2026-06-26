"use client";

import { useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  buildGoogleOAuthHref,
  GoogleOAuthLeftPanel,
  GoogleOAuthLegalNotice,
  GoogleOAuthShell,
} from "@/components/auth/GoogleOAuthShell";
import { Button } from "@/components/catalyst/button";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Input } from "@/components/catalyst/input";
import { Link } from "@/components/catalyst/link";
import { Text } from "@/components/catalyst/text";
import { getSafeNextPath } from "@/lib/auth/client";
import { startOAuthSignIn } from "@/lib/auth/start-oauth-sign-in";
import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

type GoogleOAuthEmailFormProps = {
  returnTo?: "/sign-in" | "/signup";
};

function isEmailOrPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }

  return /^[+]?[\d\s().-]{7,}$/.test(trimmed);
}

export function GoogleOAuthEmailForm({ returnTo = "/sign-in" }: GoogleOAuthEmailFormProps) {
  const searchParams = useSearchParams();
  const { isConfigured } = getSupabasePublicEnv();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = getSafeNextPath(searchParams.get("next"));
  const accountPickerHref = buildGoogleOAuthHref("/sign-in/oauth/google", nextPath, returnTo);
  const signupHref = "/signup";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isConfigured) {
      setError("Supabase environment variables are missing. Add them to .env.local.");
      return;
    }

    const trimmed = identifier.trim();
    if (!isEmailOrPhone(trimmed)) {
      setError("Enter a valid email address or phone number.");
      return;
    }

    setLoading(true);
    try {
      const result = await startOAuthSignIn("google", nextPath, {
        loginHint: trimmed,
        selectAccount: true,
      });
      if (!result.ok) {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <GoogleOAuthShell
      left={<GoogleOAuthLeftPanel title="Sign in" />}
      right={
        <form onSubmit={onSubmit} className="flex min-h-full flex-col">
          <Field className="[&>[data-slot=label]+[data-slot=control]]:mt-0">
            <div className="rounded-[4px] border border-[#dadce0] px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-2 focus-within:ring-[#1a73e8]/15 dark:border-zinc-600 dark:focus-within:border-blue-500">
              <Label className="text-xs font-normal text-[#1a73e8] dark:text-blue-400">
                Email or phone
              </Label>
              <Input
                id="google-email-or-phone"
                name="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                disabled={loading}
                aria-invalid={error ? true : undefined}
                className="mt-1 [&_[data-slot=control]]:before:hidden [&_[data-slot=control]]:after:hidden [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:px-0 [&_input]:py-0 [&_input]:text-base [&_input]:text-[#202124] [&_input]:shadow-none dark:[&_input]:text-white"
              />
            </div>
          </Field>

          <Link
            href="https://accounts.google.com/signin/recovery"
            className="mt-3 w-fit text-sm font-medium text-[#1a73e8] decoration-[#1a73e8]/50 hover:decoration-[#1a73e8] dark:text-blue-400"
          >
            Forgot email?
          </Link>

          <GoogleOAuthLegalNotice />

          {error ? (
            <Text role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </Text>
          ) : null}

          <div className="mt-auto flex items-center justify-end gap-6 pt-10">
            <Link
              href={signupHref}
              className="text-sm font-medium text-[#1a73e8] decoration-[#1a73e8]/50 hover:decoration-[#1a73e8] dark:text-blue-400"
            >
              Create account
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#1a73e8] px-6 [--btn-bg:#1a73e8] [--btn-border:#1a73e8] hover:[--btn-bg:#1765cc] data-hover:[--btn-bg:#1765cc]"
            >
              {loading ? "Redirecting…" : "Next"}
            </Button>
          </div>

          {loading ? (
            <Text className="mt-6 text-sm font-medium text-[#1a73e8]/60 dark:text-blue-400/60">Back</Text>
          ) : (
            <Button
              plain
              href={accountPickerHref}
              className="mt-6 w-fit px-0 text-sm font-medium text-[#1a73e8] hover:bg-transparent dark:text-blue-400"
            >
              Back
            </Button>
          )}
        </form>
      }
    />
  );
}
