"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser, signIn, signOut, signUp } from "@/lib/auth";
import {
  captureDemoPayment,
  CommerceError,
  placeOrder,
  retryPayment,
  submitPaymentOtp,
} from "@/lib/commerce";
import { store } from "@/lib/db";
import { isResendConfigured } from "@/lib/env";
import { checkoutSchema, contactSchema, registerSchema } from "@/lib/validators";

function safeNext(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return value;
  return "/account";
}

export async function loginAction(_prev: { error: string }, formData: FormData) {
  const result = await signIn(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  if (!result.ok) return { error: result.error };
  redirect(safeNext(String(formData.get("next") ?? "")));
}

export async function registerAction(_prev: { error: string }, formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== parsed.data.password) return { error: "The passwords do not match." };
  const result = await signUp(parsed.data);
  if (!result.ok) return { error: result.error };
  redirect("/account");
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}

export async function placeOrderAction(payload: unknown) {
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const user = await getSessionUser();
  try {
    return await placeOrder({ ...parsed.data, note: parsed.data.note ?? "", userId: user?.id ?? null });
  } catch (error) {
    return { ok: false as const, error: error instanceof CommerceError ? error.message : "Could not place the order." };
  }
}

export async function otpAction(orderNumber: string, token: string, otp: string) {
  try {
    return await submitPaymentOtp(orderNumber, token, otp);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not submit the OTP." };
  }
}

export async function demoPayAction(orderNumber: string, token: string) {
  try {
    await captureDemoPayment(orderNumber, token);
    revalidatePath(`/orders/${orderNumber}`);
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not approve the payment." };
  }
}

export async function retryPayAction(orderNumber: string, token: string) {
  try {
    return await retryPayment(orderNumber, token);
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not retry the payment." };
  }
}

export async function contactAction(_prev: { error: string; ok: boolean }, formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form.", ok: false };
  await store().addMessage({
    id: crypto.randomUUID(),
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? "",
    message: parsed.data.message,
    createdAt: new Date().toISOString(),
  });
  if (isResendConfigured() && process.env.CONTACT_INBOX) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails
      .send({
        from: process.env.RESEND_FROM || "Velora <onboarding@resend.dev>",
        to: process.env.CONTACT_INBOX,
        subject: `Velora message from ${parsed.data.name}`,
        text: `${parsed.data.message}\n\n${parsed.data.email}\n${parsed.data.phone ?? ""}`,
      })
      .catch(() => undefined);
  }
  revalidatePath("/admin/messages");
  return { error: "", ok: true };
}
