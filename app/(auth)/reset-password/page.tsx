import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your xiaolongbao account.",
};

function ResetPasswordFallback() {
  return (
    <div className="grid w-full max-w-sm animate-pulse grid-cols-1 gap-8">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800/80" />
      </div>
      <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
      <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
      <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
