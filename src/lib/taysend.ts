import { createHmac, timingSafeEqual } from "crypto";
import { isTaysendConfigured } from "@/lib/env";
import { toE164 } from "@/lib/phone";
import type { NoticeKind, Order } from "@/lib/types";
import { formatGhsPlain } from "@/lib/format";
import { brand } from "@/lib/brand";

export async function sendOrderSms(order: Order, kind: NoticeKind) {
  const phone = order.phone;
  const message =
    kind === "order_paid"
      ? `Velora: we received ${formatGhsPlain(order.total)} for ${order.number}. The studio in Accra will prepare it. Help: ${brand.phones[1].tel}`
      : kind === "order_shipped"
        ? `Velora: ${order.number} is on the way to ${order.city}. Help: ${brand.phones[0].tel}`
        : `Velora: payment for ${order.number} was not completed. You can try Mobile Money again. Help: ${brand.phones[1].tel}`;

  if (!isTaysendConfigured()) {
    return { status: "skipped" as const, providerId: null, detail: "TAYSEND_API_KEY is not set." };
  }

  try {
    const response = await fetch("https://api.taysend.com/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TAYSEND_API_KEY}`,
        "Idempotency-Key": crypto.randomUUID(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: toE164(phone),
        sender_id: process.env.TAYSEND_SENDER_ID || "VELORA",
        message,
        type: "transactional",
      }),
    });
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string; error?: { message?: string } };
    if (!response.ok) {
      return {
        status: "failed" as const,
        providerId: body.id ?? null,
        detail: body.error?.message || body.message || `Taysend returned ${response.status}.`,
      };
    }
    return {
      status: "sent" as const,
      providerId: body.id ?? null,
      detail: "Taysend accepted the message. Delivery is confirmed later.",
    };
  } catch (error) {
    return {
      status: "failed" as const,
      providerId: null,
      detail: error instanceof Error ? error.message : "Taysend request failed.",
    };
  }
}

export function verifyTaysendSignature(header: string | null, rawBody: string) {
  const secret = process.env.TAYSEND_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key?.trim(), rest.join("=").trim()];
    }),
  );
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(parts.v1 ?? "");
  return left.length === right.length && timingSafeEqual(left, right);
}
