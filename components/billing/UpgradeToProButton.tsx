"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/catalyst/button";

type UpgradeToProButtonProps = {
  label?: string;
  color?: "indigo" | "dark/zinc" | "light";
  className?: string;
  disabled?: boolean;
};

export function UpgradeToProButton({
  label = "Upgrade to Pro",
  color = "indigo",
  className,
  disabled = false,
}: UpgradeToProButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (loading || disabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in?next=/pricing/upgrade");
          return;
        }

        setError(data.error ?? "Could not start checkout.");
        return;
      }

      if (!data.url) {
        setError("Stripe did not return a checkout URL.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        color={color}
        className="w-full"
        disabled={disabled || loading}
        onClick={startCheckout}
      >
        {loading ? "Redirecting to checkout…" : label}
      </Button>
      {error ? (
        <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
