"use client";

import clsx from "clsx";
import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";

export function DeckToast({
  message,
  tone = "success",
  onDismiss,
  autoDismissMs = 5000,
}: {
  message: string;
  tone?: "success" | "error";
  onDismiss: () => void;
  autoDismissMs?: number;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs, message, onDismiss]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div
        className={clsx(
          "pointer-events-auto flex max-w-lg items-start gap-3 rounded-xl px-4 py-3 shadow-lg ring-1",
          tone === "error"
            ? "bg-red-50 text-red-950 ring-red-200 dark:bg-red-950/90 dark:text-red-50 dark:ring-red-900"
            : "bg-emerald-50 text-emerald-950 ring-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-50 dark:ring-emerald-900",
        )}
      >
        <p className="min-w-0 flex-1 text-sm/6">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className={clsx(
            "rounded-md p-1 transition-colors",
            tone === "error"
              ? "text-red-700 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-900"
              : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900",
          )}
          aria-label="Dismiss notification"
        >
          <XMarkIcon className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
