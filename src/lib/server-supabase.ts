/**
 * Server-side Supabase helpers for TanStack server functions.
 * Ported from the shared patterns of the old Supabase edge functions.
 */
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";

export function supabaseUrl(): string {
  return (process.env['SUPABASE_URL'] ?? process.env['VITE_SUPABASE_URL'])!;
}

export function supabaseAnonKey(): string {
  return (
    process.env['SUPABASE_ANON_KEY'] ??
    process.env['SUPABASE_PUBLISHABLE_KEY'] ??
    process.env['VITE_SUPABASE_PUBLISHABLE_KEY']
  )!;
}

export function supabaseServiceKey(): string {
  return process.env['SUPABASE_SERVICE_ROLE_KEY']!;
}

/** Supabase project ref (used to build edge-function callback URLs that stay on Supabase). */
export function supabaseProjectRef(): string {
  return supabaseUrl().match(/https:\/\/(.+?)\./)?.[1] ?? "";
}

export function adminClient(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseServiceKey());
}

export function userScopedClient(authHeader: string): SupabaseClient {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    global: { headers: { Authorization: authHeader } },
  });
}

export function getAuthHeader(): string {
  return getRequestHeader("Authorization") ?? getRequestHeader("authorization") ?? "";
}

export function getClientOrigin(): string {
  return getRequestHeader("Origin") ?? getRequestHeader("Referer") ?? "";
}

export async function getAuthedUser(): Promise<{ user: User; client: SupabaseClient; authHeader: string } | null> {
  const authHeader = getAuthHeader();
  if (!authHeader) return null;
  const client = userScopedClient(authHeader);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user, client, authHeader };
}
