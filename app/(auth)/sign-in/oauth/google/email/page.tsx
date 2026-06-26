import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleOAuthEmailForm } from "@/components/auth/GoogleOAuthEmailForm";

export const metadata: Metadata = {
  title: "Sign in with Google",
  description: "Enter your Google email or phone number to continue to xiaolongbao.",
};

function GoogleOAuthEmailFallback() {
  return (
    <div className="fixed inset-0 z-50 bg-[#eef2f6] px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-[960px] animate-pulse rounded-lg border border-[#dadce0] bg-white">
        <div className="h-14 border-b border-[#e8eaed]" />
        <div className="grid min-h-[320px] grid-cols-1 gap-8 px-6 py-8 md:grid-cols-2 md:px-14 md:py-12">
          <div className="space-y-4">
            <div className="size-7 rounded bg-[#e8eaed]" />
            <div className="h-10 w-32 rounded bg-[#e8eaed]" />
            <div className="h-4 w-40 rounded bg-[#f1f3f4]" />
          </div>
          <div className="space-y-4">
            <div className="h-16 rounded bg-[#f1f3f4]" />
            <div className="h-4 w-28 rounded bg-[#f1f3f4]" />
            <div className="h-16 rounded bg-[#f1f3f4]" />
            <div className="ml-auto h-10 w-24 rounded-full bg-[#e8eaed]" />
          </div>
        </div>
      </div>
    </div>
  );
}

type GoogleOAuthEmailPageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function GoogleOAuthEmailPage({ searchParams }: GoogleOAuthEmailPageProps) {
  const { from } = await searchParams;
  const returnTo = from === "signup" ? "/signup" : "/sign-in";

  return (
    <Suspense fallback={<GoogleOAuthEmailFallback />}>
      <GoogleOAuthEmailForm returnTo={returnTo} />
    </Suspense>
  );
}
