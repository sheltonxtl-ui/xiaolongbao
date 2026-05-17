"use client";

import { ArrowPathIcon, ExclamationTriangleIcon, InboxIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "@/components/catalyst/button";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";

const panelClassName = clsx(
  "rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-16 text-center",
  "dark:border-zinc-600 dark:bg-zinc-900/30",
);

const plainPanelClassName = "text-left";

type DeckStatePanelProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  headingId?: string;
  role?: "status" | "alert";
  busy?: boolean;
  variant?: "panel" | "plain";
};

export function DeckStatePanel({
  title,
  description,
  icon,
  actions,
  className,
  headingId,
  role = "status",
  busy = false,
  variant = "panel",
}: DeckStatePanelProps) {
  const isPlain = variant === "plain";

  return (
    <div
      className={clsx(isPlain ? plainPanelClassName : panelClassName, className)}
      role={role}
      aria-busy={busy || undefined}
      aria-labelledby={headingId}
    >
      {icon ? (
        isPlain ? (
          <div className="mb-4">{icon}</div>
        ) : (
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-white shadow-xs ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
            {icon}
          </div>
        )
      ) : null}
      <Heading id={headingId} level={2} className={clsx(icon && "mt-5")}>
        {title}
      </Heading>
      {description ? (
        <Text className={clsx("mt-2", isPlain ? "max-w-2xl" : "mx-auto max-w-md")}>{description}</Text>
      ) : null}
      {actions ? (
        <div
          className={clsx(
            "mt-6 flex flex-wrap items-center gap-3",
            !isPlain && "justify-center",
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function DeckLoadingPanel({
  title = "Loading…",
  description = "Fetching your data from the server.",
  className,
  headingId,
}: {
  title?: string;
  description?: string;
  className?: string;
  headingId?: string;
}) {
  return (
    <DeckStatePanel
      title={title}
      description={description}
      headingId={headingId}
      busy
      icon={
        <ArrowPathIcon
          className="size-6 animate-spin text-indigo-600 dark:text-indigo-400"
          aria-hidden
        />
      }
      className={className}
    />
  );
}

export function DeckErrorPanel({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  actions,
  className,
  headingId,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  actions?: ReactNode;
  className?: string;
  headingId?: string;
}) {
  const actionContent =
    actions ??
    (onRetry ? (
      <Button color="indigo" onClick={onRetry}>
        {retryLabel}
      </Button>
    ) : undefined);

  return (
    <DeckStatePanel
      title={title}
      description={message}
      headingId={headingId}
      role="alert"
      className={className}
      icon={
        <ExclamationTriangleIcon
          className="size-6 text-red-600 dark:text-red-400"
          aria-hidden
        />
      }
      actions={actionContent}
    />
  );
}

export function DeckEmptyPanel({
  title,
  description,
  actions,
  className,
  headingId,
  variant = "panel",
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  headingId?: string;
  variant?: "panel" | "plain";
}) {
  return (
    <DeckStatePanel
      title={title}
      description={description}
      headingId={headingId}
      className={className}
      variant={variant}
      icon={
        <InboxIcon className="size-6 text-zinc-400 dark:text-zinc-500" aria-hidden />
      }
      actions={actions}
    />
  );
}

export type DeckSaveStatusState = "idle" | "saving" | "saved" | "error";

export function DeckSaveStatus({
  status,
  errorMessage,
  className,
}: {
  status: DeckSaveStatusState;
  errorMessage?: string | null;
  className?: string;
}) {
  if (status === "idle") return null;

  const label =
    status === "saving"
      ? "Saving changes…"
      : status === "saved"
        ? "All changes saved"
        : (errorMessage ?? "Could not save changes");

  const tone =
    status === "error"
      ? "text-red-600 dark:text-red-400"
      : status === "saving"
        ? "text-zinc-500 dark:text-zinc-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <p
      className={clsx("text-sm tabular-nums", tone, className)}
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {status === "saving" ? (
        <ArrowPathIcon className="mr-1.5 inline size-4 animate-spin align-[-2px]" aria-hidden />
      ) : null}
      {label}
    </p>
  );
}
