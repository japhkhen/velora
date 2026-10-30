import { isSupabaseConfigured } from "@/lib/env";
import { localStore } from "@/lib/db/local";
import { supabaseStore } from "@/lib/db/supabase-store";

export function store() {
  return isSupabaseConfigured() ? supabaseStore : localStore;
}
