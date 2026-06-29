import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile, resolveDatabaseUrl } from "./lib/load-env.mjs";
import { runSeedDevUsers } from "./lib/run-seed-dev-users.mjs";

async function main() {
  loadEnvFile();

  const sqlPath = resolve(
    process.cwd(),
    "supabase/migrations/20260628130000_drop_profile_public_deck_authors_policy.sql",
  );
  const sql = readFileSync(sqlPath, "utf8");
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    console.error(
      [
        "Missing database connection details.",
        "",
        "Run this SQL in Supabase Dashboard → SQL editor:",
        "",
        "  DROP POLICY IF EXISTS profile_select_public_deck_authors ON public.profile;",
        "",
        "Or add SUPABASE_DB_PASSWORD to .env.local and rerun:",
        "  npm run db:migrate:fix-profile-rls",
      ].join("\n"),
    );
    process.exit(1);
  }

  const postgres = (await import("postgres")).default;
  const sqlClient = postgres(databaseUrl, { max: 1 });

  try {
    await sqlClient.unsafe(sql);
    console.log("Dropped recursive profile RLS policy successfully.");
  } finally {
    await sqlClient.end({ timeout: 5 });
  }

  await runSeedDevUsers();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
