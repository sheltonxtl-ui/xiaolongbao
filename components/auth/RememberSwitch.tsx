"use client";

import clsx from "clsx";

type RememberSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
};

export function RememberSwitch({ checked, onChange }: RememberSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
        checked ? "border-neutral-900 bg-neutral-900" : "border-neutral-300 bg-neutral-200",
      )}
    >
      <span
        className={clsx(
          "pointer-events-none absolute top-1/2 block h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform",
          checked ? "left-[calc(100%-1.375rem)]" : "left-1",
        )}
      />
      <span className="sr-only">Remember me</span>
    </button>
  );
}
