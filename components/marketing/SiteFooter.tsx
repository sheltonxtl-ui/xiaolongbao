"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth/client";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

export function SiteFooter() {
  const router = useRouter();
  const { isSignedIn, loading } = useAuthUser();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <footer className="border-t border-zinc-200 py-12 dark:border-zinc-800">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          © {new Date().getFullYear()} xiaolongbao. Built for students.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          {!loading &&
            (isSignedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="hover:text-foreground disabled:opacity-50"
              >
                {signingOut ? "Logging out…" : "Log out"}
              </button>
            ) : (
              <Link href="/signup" className="hover:text-foreground">
                Sign up
              </Link>
            ))}
        </div>
      </div>
    </footer>
  );
}
