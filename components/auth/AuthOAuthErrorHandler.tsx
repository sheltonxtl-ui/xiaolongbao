"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { parseOAuthFailureFromUrl } from "@/lib/auth/oauth-errors";

export function AuthOAuthErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const failure = parseOAuthFailureFromUrl(window.location.href);
    if (!failure) {
      return;
    }

    const params = new URLSearchParams();
    params.set("error", "oauth");
    params.set("reason", failure.reason);
    router.replace(`/sign-in?${params.toString()}`);
  }, [router]);

  return null;
}
