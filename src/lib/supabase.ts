import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/env";

let service: SupabaseClient | null = null;

export function getServiceClient() {
  if (!isSupabaseConfigured()) return null;
  if (!service) {
    service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return service;
}

export async function getAuthClient() {
  if (!isSupabaseConfigured()) return null;
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return jar.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            // Server Components cannot always write cookies. The proxy/middleware refresh covers that path.
          }
        },
      },
    },
  );
}
