export const DEFAULT_TEST_USER_EMAIL = "123@example.com";
export const DEFAULT_DEV_PASSWORD = "password123";

export function resolveDevPassword() {
  return (
    process.env.SEED_TEST_USER_PASSWORD?.trim() ||
    process.env.SEED_USER_PASSWORD?.trim() ||
    DEFAULT_DEV_PASSWORD
  );
}

export async function findAuthUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  return null;
}

export async function ensureAuthUser(supabase, email, password) {
  let authUser = await findAuthUserByEmail(supabase, email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      throw new Error(`createUser (${email}): ${error.message}`);
    }
    authUser = data.user;
    console.log(`Created auth user for ${email}`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
    });
    if (error) {
      throw new Error(`updateUser password (${email}): ${error.message}`);
    }
    console.log(`Synced password for ${email}`);
  }

  return authUser;
}

export async function ensureProfile(supabase, authUserId, email) {
  const { data: existing, error: selectError } = await supabase
    .from("profile")
    .select("id, user_id, email")
    .eq("user_id", authUserId)
    .maybeSingle();

  if (selectError) {
    throw new Error(`profile select (${email}): ${selectError.message}`);
  }
  if (existing) {
    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("profile")
    .insert({ user_id: authUserId, email })
    .select("id, user_id, email")
    .single();

  if (insertError?.code === "23505") {
    const { data: raced, error: raceError } = await supabase
      .from("profile")
      .select("id, user_id, email")
      .eq("user_id", authUserId)
      .maybeSingle();
    if (raceError || !raced) {
      throw new Error(`profile lookup after conflict (${email}): ${raceError?.message}`);
    }
    return raced;
  }

  if (insertError) {
    throw new Error(`profile insert (${email}): ${insertError.message}`);
  }

  console.log(`Created profile for ${email}`);
  return created;
}

export async function verifyPasswordSignIn(supabaseUrl, anonKey, email, password) {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`sign-in verification failed for ${email}: ${error.message}`);
  }
}
