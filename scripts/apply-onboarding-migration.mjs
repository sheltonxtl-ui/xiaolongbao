import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile, resolveDatabaseUrl } from "./lib/load-env.mjs";

async function main() {
  loadEnvFile();

  const sqlPath = resolve(
    process.cwd(),
    "supabase/migrations/20260712120000_add_onboarding_tutorial_state.sql",
  );
  const sql = readFileSync(sqlPath, "utf8");
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    console.error(
      [
        "Missing database connection details.",
        "",
        "Add one of these to .env.local, then rerun: npm run db:migrate:onboarding",
        "",
        "  SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres",
        "",
        "or",
        "",
        "  SUPABASE_DB_PASSWORD=YOUR_PASSWORD",
        "",
        "Find the password in Supabase Dashboard → Project Settings → Database.",
        "",
        "Alternatively, paste supabase/migrations/20260712120000_add_onboarding_tutorial_state.sql",
        "into the Supabase SQL editor and run it there.",
      ].join("\n"),
    );
    process.exit(1);
  }

  const postgres = (await import("postgres")).default;
  const sqlClient = postgres(databaseUrl, { max: 1 });

  try {
    await sqlClient.unsafe(sql);
    console.log("Applied onboarding tutorial state migration successfully.");
  } finally {
    await sqlClient.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
