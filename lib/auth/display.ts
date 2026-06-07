import type { User } from "@supabase/supabase-js";

export function getUserDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.display_name === "string" && meta.display_name) ||
    user.email?.split("@")[0];

  return name ?? "Account";
}

export function getUserInitials(user: User): string {
  const name = getUserDisplayName(user);
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export function getUserEmail(user: User): string {
  return user.email ?? "";
}
