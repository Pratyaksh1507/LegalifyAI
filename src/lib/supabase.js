import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing. Please check your .env.local file.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      // Implicit flow: tokens come back in the URL hash fragment (#access_token=…)
      // so the client can parse them synchronously without a server round-trip.
      // PKCE (the v2 default) would put a `?code=` param that needs async exchange,
      // causing a race-condition on the dashboard before getSession() resolves.
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
    },
  }
);
