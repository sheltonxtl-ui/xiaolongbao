"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { parseRecoveryHashFromUrl } from "@/lib/auth/recovery";

export function AuthRecoveryHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const tokens = parseRecoveryHashFromUrl(window.location.href);
    if (!tokens) {
      return;
    }

    if (window.location.pathname !== "/reset-password") {
      router.replace(`/reset-password${window.location.hash}`);
    }
  }, [router]);

  return null;
}
