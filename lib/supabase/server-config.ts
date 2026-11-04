/**
 * Server-side Supabase URL.
 *
 * The browser must use NEXT_PUBLIC_SUPABASE_URL, which may be a code-server
 * `/proxy/<port>` URL. Node-side auth calls should use the internal URL so
 * they do not loop back through the public reverse proxy.
 */
export function getSupabaseServerConfig() {
  return {
    url: process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  };
}
