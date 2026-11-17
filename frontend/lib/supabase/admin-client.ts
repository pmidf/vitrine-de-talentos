import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service role.
 * Ignora RLS — use apenas em server actions protegidas por getAdminId().
 * Nunca exponha este cliente ao navegador.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_serviceRoleKey;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase não configurado: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_serviceRoleKey ausente."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}