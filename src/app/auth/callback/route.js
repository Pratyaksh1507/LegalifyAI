import { NextResponse } from "next/server";

/**
 * Auth callback route – used only if someone lands here directly.
 *
 * With implicit-flow OAuth (our current setup), Supabase appends tokens to the
 * URL hash and redirects straight to /dashboard where the Supabase client
 * parses them automatically. This route is therefore not part of the normal
 * flow, but kept as a safety net.
 *
 * If the project ever switches to PKCE flow, swap in the code-exchange logic here.
 */
export async function GET(request) {
  const { origin, searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");

  if (error) {
    console.error("[auth/callback] OAuth error:", error, searchParams.get("error_description"));
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, origin));
  }

  // Redirect to the intended destination; the client-side Supabase will handle
  // any remaining session setup from the URL hash.
  return NextResponse.redirect(new URL(next, origin));
}
