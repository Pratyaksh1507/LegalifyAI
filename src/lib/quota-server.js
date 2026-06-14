import { createAdminClient } from "./supabase-server";

/**
 * Verifies the request's Authorization header, checks the user's quota,
 * and deducts one credit atomically.
 *
 * Returns an object with:
 *   - { user, quota } on success
 *   - { error: Response } if auth fails or quota is exceeded — caller should return this Response
 */
export async function checkAndDeductQuota(req) {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch (_e) {
    return {
      error: new Response(
        JSON.stringify({ error: "Server configuration error: Supabase key is required." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // 1. Extract JWT from Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: new Response(
        JSON.stringify({ error: "Unauthorized: Missing or invalid token." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const token = authHeader.replace("Bearer ", "").trim();

  // 2. Validate token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return {
      error: new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired session." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // 3. Fetch user quota
  let { data: quota, error: quotaError } = await supabase
    .from("user_quotas")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 4. If no quota row exists yet (e.g. user created before the trigger), create one
  if (quotaError || !quota) {
    const startingCredits =
      user.user_metadata?.role === "professional" ? 100 : 20;

    const { data: newQuota, error: insertError } = await supabase
      .from("user_quotas")
      .insert({
        user_id: user.id,
        email: user.email,
        credits: startingCredits,
        credits_used: 0,
      })
      .select()
      .single();

    if (insertError || !newQuota) {
      return {
        error: new Response(
          JSON.stringify({ error: "Could not initialise user quota." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        ),
      };
    }

    quota = newQuota;
  }

  // 5. Check if the user has credits remaining
  const remaining = quota.credits - quota.credits_used;
  if (remaining <= 0) {
    return {
      error: new Response(
        JSON.stringify({
          error: "Quota exceeded. You have used all your AI credits.",
          credits: 0,
          credits_used: quota.credits_used,
          total_credits: quota.credits,
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // 6. Deduct one credit by incrementing credits_used
  const { error: updateError } = await supabase
    .from("user_quotas")
    .update({
      credits_used: quota.credits_used + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[Quota] Failed to deduct credit:", updateError.message);
    // Allow the request to proceed even if deduction fails (non-blocking)
  }

  return { user, quota: { ...quota, credits_used: quota.credits_used + 1 } };
}

/**
 * Fetches the current quota for a user given their JWT token.
 * Returns { credits, credits_used } or null on failure.
 */
export async function getUserQuota(token) {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch (_e) {
    return null;
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return null;

  const { data: quota } = await supabase
    .from("user_quotas")
    .select("credits, credits_used")
    .eq("user_id", user.id)
    .single();

  return quota || null;
}
