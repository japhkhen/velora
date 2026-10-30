import { demoAdmin } from "@/lib/brand";
import { store } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/password";
import { normalizeGhPhone } from "@/lib/phone";
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from "@/lib/session";
import { getAuthClient, getServiceClient } from "@/lib/supabase";
import type { UserPublic } from "@/lib/types";

export async function getSessionUser(): Promise<UserPublic | null> {
  if (isSupabaseConfigured()) {
    const supabase = await getAuthClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const profile = await store().getUser(data.user.id);
    if (profile) return profile;
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      fullName: String(data.user.user_metadata?.full_name ?? ""),
      phone: String(data.user.user_metadata?.phone ?? ""),
      role: "customer",
      createdAt: data.user.created_at,
    };
  }

  const session = await readSessionCookie();
  if (!session) return null;
  return store().getUser(session.uid);
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    throw new Error("The studio desk is for staff.");
  }
  return user;
}

export async function signIn(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    const supabase = await getAuthClient();
    if (!supabase) return { ok: false as const, error: "Supabase auth is not available." };
    const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) return { ok: false as const, error: "Email or password is not correct." };
    return { ok: true as const };
  }

  const user = await store().findLocalUserByEmail(normalized);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false as const, error: "Email or password is not correct." };
  }
  await writeSessionCookie(user.id);
  return { ok: true as const };
}

export async function signUp(input: { fullName: string; email: string; phone: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const phone = normalizeGhPhone(input.phone);
  if (!phone) return { ok: false as const, error: "Enter a Ghana phone number." };

  if (isSupabaseConfigured()) {
    const supabase = await getAuthClient();
    if (!supabase) return { ok: false as const, error: "Supabase auth is not available." };
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: { data: { full_name: input.fullName.trim(), phone } },
    });
    if (error) return { ok: false as const, error: error.message };
    const adminEmail = (process.env.ADMIN_EMAIL || demoAdmin.email).toLowerCase();
    if (data.user && email === adminEmail) {
      await getServiceClient()?.from("profiles").update({ role: "admin", phone, full_name: input.fullName.trim() }).eq("id", data.user.id);
    }
    if (data.session) return { ok: true as const };
    return { ok: false as const, error: "Account created. Confirm the email, then sign in. For class demos, turn off email confirmation in Supabase." };
  }

  const passwordHash = await hashPassword(input.password);
  const adminEmail = (process.env.ADMIN_EMAIL || demoAdmin.email).toLowerCase();
  try {
    await store().insertLocalUser({
      id: crypto.randomUUID(),
      email,
      fullName: input.fullName.trim(),
      phone,
      role: email === adminEmail ? "admin" : "customer",
      passwordHash,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not create the account." };
  }
  const created = await store().findLocalUserByEmail(email);
  if (created) await writeSessionCookie(created.id);
  return { ok: true as const };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await getAuthClient();
    await supabase?.auth.signOut();
    return;
  }
  await clearSessionCookie();
}
