/**
 * Keeps local dev/test auth accounts in a known-good state.
 *
 * Why this exists:
 * - shelton.xtl@gmail.com is refreshed by scripts/seed-shelton-sample-decks.mjs and can
 *   also sign in with OAuth.
 * - 123@example.com is email/password-only and had no equivalent reset step, so ad-hoc
 *   debugging or migration workflows could leave it with an unknown password.
 *
 * Usage:
 *   npm run seed:dev-users
 *
 * Optional .env.local overrides:
 *   SEED_TEST_USER_EMAIL=123@example.com
 *   SEED_TEST_USER_PASSWORD=your-password
 *   SEED_USER_PASSWORD=your-password   (fallback for both dev accounts)
 */

import { createClient } from "@supabase/supabase-js";
import { loadEnvFile, resolveSupabaseAdminClient } from "./lib/load-env.mjs";
import {
  DEFAULT_TEST_USER_EMAIL,
  ensureAuthUser,
  ensureProfile,
  resolveDevPassword,
  verifyPasswordSignIn,
} from "./lib/ensure-auth-user.mjs";

const SHELTON_EMAIL = process.env.SEED_USER_EMAIL?.trim() || "shelton.xtl@gmail.com";

async function main() {
  loadEnvFile();

  const adminConfig = resolveSupabaseAdminClient();
  if (!adminConfig) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.");
  }

  const password = resolveDevPassword();
  const testEmail = process.env.SEED_TEST_USER_EMAIL?.trim() || DEFAULT_TEST_USER_EMAIL;

  const supabase = createClient(adminConfig.supabaseUrl, adminConfig.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const accounts = [
    { email: testEmail, label: "test account" },
    { email: SHELTON_EMAIL, label: "primary dev account" },
  ];

  const results = [];

  for (const account of accounts) {
    const authUser = await ensureAuthUser(supabase, account.email, password);
    const profile = await ensureProfile(supabase, authUser.id, account.email);
    await verifyPasswordSignIn(adminConfig.supabaseUrl, anonKey, account.email, password);

    results.push({
      email: account.email,
      userId: authUser.id,
      profileId: profile.id,
      label: account.label,
    });
  }

  console.log(
    JSON.stringify(
      {
        message:
          "Dev auth accounts synced. Email/password sign-in verified for each account below.",
        passwordSource: process.env.SEED_TEST_USER_PASSWORD
          ? "SEED_TEST_USER_PASSWORD"
          : process.env.SEED_USER_PASSWORD
            ? "SEED_USER_PASSWORD"
            : `default (${password === "password123" ? "password123" : "custom"})`,
        accounts: results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
