/**
 * The browser and the Node server may use different Supabase URLs in
 * code-server development (public proxy vs. internal API). Keep the auth
 * cookie name stable so both sides share the same session.
 */
export const SUPABASE_AUTH_COOKIE_NAME = "sb-brewing-management-auth-token";
