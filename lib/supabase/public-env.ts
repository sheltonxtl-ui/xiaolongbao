export function getSupabasePublicEnv(): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "";
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}
