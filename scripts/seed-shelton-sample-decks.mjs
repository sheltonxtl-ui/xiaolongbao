/**
 * Seeds the three original UI sample decks for a single developer account.
 *
 * Usage (password via env — never commit it):
 *   SEED_USER_EMAIL=shelton.xtl@gmail.com SEED_USER_PASSWORD=... node scripts/seed-shelton-sample-decks.mjs
 *
 * Requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { loadEnvFile, resolveSupabaseAdminClient } from "./lib/load-env.mjs";
import {
  ensureAuthUser,
  ensureProfile,
  resolveDevPassword,
} from "./lib/ensure-auth-user.mjs";

const EMAIL = process.env.SEED_USER_EMAIL ?? "shelton.xtl@gmail.com";
const PASSWORD = process.env.SEED_USER_PASSWORD?.trim() || resolveDevPassword();

const SAMPLE_DECKS = [
  {
    title: "Python Essentials: Loops and Functions",
    is_public: false,
    cards: [
      { question: "What does `for` iterate over?", answer: "Any iterable (sequence, iterator, or object with __iter__)." },
      { question: "What is a `while` loop guard?", answer: "A boolean expression evaluated before each iteration." },
      { question: "Define a Python function with a default argument.", answer: "Use `def name(arg=value):` — defaults are evaluated at definition time." },
      { question: "What is `*args`?", answer: "Collects extra positional arguments into a tuple." },
      { question: "What is `**kwargs`?", answer: "Collects extra keyword arguments into a dict." },
      { question: "What does `return` do?", answer: "Ends the function and sends a value back to the caller." },
      { question: "What is recursion?", answer: "A function that calls itself, with a base case to stop." },
      { question: "What is a closure?", answer: "An inner function that remembers variables from its enclosing scope." },
      { question: "`break` vs `continue`?", answer: "`break` exits the loop; `continue` skips to the next iteration." },
      { question: "What is `range(3)`?", answer: "An iterable of 0, 1, 2 (stop-exclusive)." },
      { question: "List comprehension syntax?", answer: "`[expr for x in iterable if cond]`" },
      { question: "Why avoid mutable default args?", answer: "The default object is shared across calls; use `None` and assign inside." },
    ],
  },
  {
    title: "Conics Focus: Hyperbola Core Concepts",
    is_public: true,
    cards: [
      { question: "Standard form of a hyperbola (horizontal transverse axis)?", answer: "(x−h)²/a² − (y−k)²/b² = 1" },
      { question: "Where are the foci for a horizontal hyperbola?", answer: "At (h ± c, k) where c² = a² + b²." },
      { question: "What are asymptotes of (x/a)² − (y/b)² = 1?", answer: "y = ±(b/a)x (through the center)." },
      { question: "Eccentricity of a hyperbola?", answer: "e = c/a, and e > 1." },
      { question: "Difference of distances to foci?", answer: "Constant 2a for points on the hyperbola." },
      { question: "Conjugate axis length?", answer: "2b, perpendicular to the transverse axis." },
      { question: "Vertices of horizontal hyperbola?", answer: "(h ± a, k)." },
      { question: "Rectangular hyperbola example?", answer: "xy = k (asymptotes are the axes)." },
      { question: "How to complete the square?", answer: "Group x and y terms, add/subtract constants to form perfect squares." },
      { question: "Directrix relation (conceptual)?", answer: "Defined via constant ratio e > 1 to a focus and directrix line." },
    ],
  },
  {
    title: "Ellipse Equations and Geometry",
    is_public: false,
    cards: [
      { question: "Standard ellipse centered at origin?", answer: "x²/a² + y²/b² = 1 (a ≥ b for major on x-axis)." },
      { question: "Foci distance c?", answer: "c² = a² − b²." },
      { question: "Major axis length?", answer: "2a (the longer axis)." },
      { question: "Minor axis length?", answer: "2b." },
      { question: "Eccentricity of an ellipse?", answer: "e = c/a, with 0 ≤ e < 1." },
      { question: "Sum of distances to foci on ellipse?", answer: "Constant 2a." },
      { question: "Parametric form?", answer: "x = a cos t, y = b sin t." },
      { question: "Area of an ellipse?", answer: "πab." },
      { question: "When is it a circle?", answer: "When a = b (e = 0)." },
    ],
  },
];

async function seedDecks(supabase, profileId) {
  const results = [];

  for (const sample of SAMPLE_DECKS) {
    const { data: existingDeck, error: deckLookupError } = await supabase
      .from("deck")
      .select("id, title")
      .eq("profile_id", profileId)
      .eq("title", sample.title)
      .maybeSingle();

    if (deckLookupError) {
      throw new Error(`deck lookup (${sample.title}): ${deckLookupError.message}`);
    }

    let deckId = existingDeck?.id;

    if (deckId) {
      const { error: deleteCardsError } = await supabase.from("card").delete().eq("deck_id", deckId);
      if (deleteCardsError) {
        throw new Error(`delete cards (${sample.title}): ${deleteCardsError.message}`);
      }
      const { error: updateDeckError } = await supabase
        .from("deck")
        .update({ is_public: sample.is_public })
        .eq("id", deckId);
      if (updateDeckError) {
        throw new Error(`update deck (${sample.title}): ${updateDeckError.message}`);
      }
      console.log(`Refreshing cards for existing deck: ${sample.title}`);
    } else {
      const { data: createdDeck, error: deckError } = await supabase
        .from("deck")
        .insert({
          profile_id: profileId,
          title: sample.title,
          is_public: sample.is_public,
        })
        .select("id, title")
        .single();

      if (deckError) throw new Error(`insert deck (${sample.title}): ${deckError.message}`);
      deckId = createdDeck.id;
      console.log(`Created deck: ${sample.title}`);
    }

    const cardRows = sample.cards.map((card, index) => ({
      deck_id: deckId,
      front_question: card.question,
      back_answer: card.answer,
      order: index + 1,
    }));

    const { error: cardsError } = await supabase.from("card").insert(cardRows);
    if (cardsError) throw new Error(`insert cards (${sample.title}): ${cardsError.message}`);

    results.push({ title: sample.title, deckId, cardCount: cardRows.length });
  }

  return results;
}

async function run() {
  loadEnvFile();

  const adminConfig = resolveSupabaseAdminClient();
  if (!adminConfig) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(adminConfig.supabaseUrl, adminConfig.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const authUser = await ensureAuthUser(supabase, EMAIL, PASSWORD);
  const profile = await ensureProfile(supabase, authUser.id, EMAIL);
  const decks = await seedDecks(supabase, profile.id);

  console.log(
    JSON.stringify(
      {
        email: EMAIL,
        profileId: profile.id,
        decks,
        message: "Sample decks ready. Sign in at /sign-in to use them.",
      },
      null,
      2,
    ),
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
