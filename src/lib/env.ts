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
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
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
