import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function projectRefFromSupabaseUrl(url) {
  const match = url?.match(/^https:\/\/([^.]+)\.supabase\.co\/?$/);
  return match?.[1] ?? null;
}

function resolveDatabaseUrl() {
  const direct = process.env.SUPABASE_DB_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (direct) {
    return direct;
  }

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() || projectRefFromSupabaseUrl(supabaseUrl);

  if (!password || !projectRef) {
    return null;
  }

  const encodedPassword = encodeURIComponent(password);
  return `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env.local"));

  const sqlPath = resolve(
    process.cwd(),
    "supabase/migrations/20260618120000_stripe_subscriptions.sql",
  );
  const sql = readFileSync(sqlPath, "utf8");
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    console.error(
      [
        "Missing database connection details.",
        "",
        "Add one of these to .env.local, then rerun: npm run db:migrate:stripe",
        "",
        "  SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.hggjjklnzbuvaazpziyr.supabase.co:5432/postgres",
        "",
        "or",
        "",
        "  SUPABASE_DB_PASSWORD=YOUR_PASSWORD",
        "",
        "Find the password in Supabase Dashboard → Project Settings → Database.",
        "",
        "Alternatively, with Supabase CLI logged in:",
        "  npx supabase login",
        "  npx supabase link --project-ref hggjjklnzbuvaazpziyr",
        "  npx supabase db push --linked",
      ].join("\n"),
    );
    process.exit(1);
  }

  const postgres = (await import("postgres")).default;
  const sqlClient = postgres(databaseUrl, { max: 1 });

  try {
    await sqlClient.unsafe(sql);
    console.log("Applied Stripe subscriptions migration successfully.");
  } finally {
    await sqlClient.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
