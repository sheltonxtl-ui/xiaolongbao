import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase env vars.");
  process.exit(1);
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent("/decks")}`;

const supabase = createClient(url, key);

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "discord",
  options: {
    redirectTo,
    scopes: "identify email",
  },
});

if (error) {
  console.error("OAuth initiation failed:", error.message);
  process.exit(1);
}

if (!data?.url) {
  console.error("OAuth initiation returned no redirect URL.");
  process.exit(1);
}

console.log("OAuth initiation: OK");
console.log("Supabase authorize URL:", data.url);
console.log("App callback URL:", redirectTo);

const firstHop = await fetch(data.url, { redirect: "manual" });
if (firstHop.status !== 302 && firstHop.status !== 303) {
  console.error(`Expected redirect from Supabase authorize, got ${firstHop.status}`);
  process.exit(1);
}

const discordUrl = firstHop.headers.get("location");
if (!discordUrl?.startsWith("https://discord.com/")) {
  console.error("Supabase did not redirect to Discord:", discordUrl);
  process.exit(1);
}

const parsedDiscordUrl = new URL(discordUrl);
const redirectUri = parsedDiscordUrl.searchParams.get("redirect_uri");
const clientId = parsedDiscordUrl.searchParams.get("client_id");
const expectedSupabaseCallback = `${url.replace(/\/$/, "")}/auth/v1/callback`;

console.log("Discord redirect: OK");
console.log("Discord client ID:", clientId);
console.log("Discord redirect URI:", redirectUri);

if (!clientId) {
  console.error("Discord authorize URL is missing client_id.");
  process.exit(1);
}

if (redirectUri !== expectedSupabaseCallback) {
  console.error(`Redirect URI mismatch. Expected ${expectedSupabaseCallback}, got ${redirectUri}`);
  process.exit(1);
}

const discordProbe = await fetch(discordUrl, { redirect: "manual" });
if (discordProbe.status !== 302 && discordProbe.status !== 303 && discordProbe.status !== 200) {
  console.error(`Discord rejected the authorize request with status ${discordProbe.status}`);
  process.exit(1);
}

console.log("Discord OAuth preflight checks passed.");
console.log("Next step: click Continue with Discord in the browser and finish login.");
