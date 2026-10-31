import { isSupabaseConfigured } from "@/lib/env";
import { localStore } from "@/lib/db/local";
import { supabaseStore } from "@/lib/db/supabase-store";

type Store = typeof localStore;

function isUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /supabase|schema\.sql|fetch failed|ECONN|ENOTFOUND|getaddrinfo|relation |PGRST|invalid api key|JWT/i.test(message);
}

function resilient(primary: Store): Store {
  return new Proxy(primary, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "mode" || typeof value !== "function") return value;
      return async (...args: unknown[]) => {
        try {
          return await value.apply(target, args);
        } catch (error) {
          if (target === localStore || !isUnavailable(error)) throw error;
          const fallback = localStore[prop as keyof Store];
          if (typeof fallback !== "function") throw error;
          return (fallback as (...input: unknown[]) => unknown).apply(localStore, args);
        }
      };
    },
  });
}

export function store() {
  const primary = isSupabaseConfigured() ? supabaseStore : localStore;
  return resilient(primary as Store);
}
