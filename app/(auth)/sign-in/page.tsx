import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to xiaolongbao to manage decks and study.",
};

function SignInFallback() {
  return (
    <div className="w-full max-w-[400px] animate-pulse space-y-6">
      <div className="h-8 w-40 rounded bg-neutral-200" />
      <div className="h-12 w-full rounded-[10px] bg-neutral-100" />
      <div className="h-12 w-full rounded-[10px] bg-neutral-100" />
      <div className="h-12 w-full rounded-full bg-neutral-200" />
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
