import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to xiaolongbao to manage decks and study.",
};

function SignInFallback() {
  return (
    <div className="grid w-full max-w-sm animate-pulse grid-cols-1 gap-8">
      <div className="space-y-2">
        <div className="h-8 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800/80" />
      </div>
      <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
      <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
      <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
