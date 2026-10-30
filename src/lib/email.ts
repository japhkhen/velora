import { Resend } from "resend";
import { brand } from "@/lib/brand";
import { isResendConfigured, siteUrl } from "@/lib/env";
import { channelLabel, formatGhs, formatGhsPlain } from "@/lib/format";
import type { NoticeKind, Order, OrderItem } from "@/lib/types";

function subject(order: Order, kind: NoticeKind) {
  if (kind === "order_paid") return `Velora ${order.number} is confirmed`;
  if (kind === "order_shipped") return `Velora ${order.number} is on the way`;
  return `Velora ${order.number} payment was not completed`;
}

function textBody(order: Order, items: OrderItem[], kind: NoticeKind) {
  const lines = items.map(
    (item) => `- ${item.name} (${item.color}, ${item.size}) x ${item.qty} — ${formatGhsPlain(item.unitPrice * item.qty)}`,
  );
  const intro =
    kind === "order_paid"
      ? `Thank you, ${order.fullName}. We have received payment for ${order.number}.`
      : kind === "order_shipped"
        ? `${order.number} has left the Velora studio and is on the way to ${order.city}.`
        : `We could not confirm Mobile Money for ${order.number}. The pieces have been returned to stock.`;
  return [
    intro,
    "",
    ...lines,
    "",
    `Subtotal: ${formatGhsPlain(order.subtotal)}`,
    `Delivery: ${formatGhsPlain(order.shipping)}`,
    `Total: ${formatGhsPlain(order.total)}`,
    `Paid with: ${channelLabel[order.paymentChannel]}`,
    "",
    `${order.address}, ${order.city}, ${order.region}`,
    "",
    `Track: ${siteUrl()}/orders/${order.number}?t=${order.accessToken}`,
    "",
    `Velora, ${brand.location}`,
    brand.phones.map((phone) => phone.display).join(" / "),
  ].join("\n");
}

function htmlBody(order: Order, items: OrderItem[], kind: NoticeKind) {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e4dacd">${item.name}<br><span style="color:#6d645c">${item.color} · ${item.size} · ${item.qty}</span></td><td style="padding:8px 0;border-bottom:1px solid #e4dacd;text-align:right">${formatGhs(item.unitPrice * item.qty)}</td></tr>`,
    )
    .join("");
  const intro =
    kind === "order_paid"
      ? `Thank you, ${order.fullName}. Payment for <strong>${order.number}</strong> is confirmed and the studio will prepare it in Accra.`
      : kind === "order_shipped"
        ? `<strong>${order.number}</strong> has left the studio and is on the way to ${order.city}.`
        : `Mobile Money for <strong>${order.number}</strong> was not completed, so the pieces are back in stock.`;
  return `<div style="font-family:Georgia,serif;background:#f3eee6;padding:24px;color:#1c1614"><div style="max-width:560px;margin:0 auto;background:#faf7f2;padding:28px"><p style="letter-spacing:.2em;text-transform:uppercase;font-size:12px">Velora · Accra</p><h1 style="font-weight:500;font-size:32px;margin:8px 0 16px">${subject(order, kind)}</h1><p style="line-height:1.5">${intro}</p><table style="width:100%;border-collapse:collapse;margin-top:16px">${rows}</table><p style="margin-top:16px">Total ${formatGhs(order.total)} · ${channelLabel[order.paymentChannel]}</p><p>${order.address}, ${order.city}, ${order.region}</p><p><a href="${siteUrl()}/orders/${order.number}?t=${order.accessToken}">View the order</a></p><p style="color:#6d645c">${brand.phones.map((phone) => phone.display).join(" / ")}</p></div></div>`;
}

export async function sendOrderEmail(order: Order, items: OrderItem[], kind: NoticeKind) {
  if (!isResendConfigured()) {
    return { status: "skipped" as const, providerId: null, detail: "RESEND_API_KEY is not set." };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "Velora <onboarding@resend.dev>",
      to: order.email,
      subject: subject(order, kind),
      html: htmlBody(order, items, kind),
      text: textBody(order, items, kind),
    });
    if (error) {
      return { status: "failed" as const, providerId: null, detail: error.message };
    }
    return { status: "sent" as const, providerId: data?.id ?? null, detail: "Resend accepted the email." };
  } catch (error) {
    return {
      status: "failed" as const,
      providerId: null,
      detail: error instanceof Error ? error.message : "Resend request failed.",
    };
  }
}
