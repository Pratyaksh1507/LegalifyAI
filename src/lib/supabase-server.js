import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client using the service role key.
 * This bypasses RLS and should ONLY be used server-side.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Admin Supabase keys are missing from environment variables.");
    throw new Error("Supabase admin configuration is missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}
