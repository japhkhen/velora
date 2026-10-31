export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isMoolreConfigured() {
  return Boolean(
    process.env.MOOLRE_USERNAME &&
      process.env.MOOLRE_PUBLIC_KEY &&
      process.env.MOOLRE_ACCOUNT_NUMBER,
  );
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isTaysendConfigured() {
  return Boolean(process.env.TAYSEND_API_KEY);
}

export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.VERCEL && productionHost && (!configured || configured.includes("localhost"))) {
    return `https://${productionHost}`;
  }
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function sessionSecret() {
  return process.env.SESSION_SECRET || "velora-dev-only-session-secret";
}

export function integrationStatus() {
  return {
    supabase: isSupabaseConfigured(),
    moolre: isMoolreConfigured(),
    resend: isResendConfigured(),
    taysend: isTaysendConfigured(),
  };
}
