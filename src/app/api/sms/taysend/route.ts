import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { verifyTaysendSignature } from "@/lib/taysend";

export async function POST(request: Request) {
  const raw = await request.text();
  const header =
    request.headers.get("taysend-signature") ||
    request.headers.get("x-taysend-signature") ||
    request.headers.get("x-webhook-signature");
  if (!verifyTaysendSignature(header, raw)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = JSON.parse(raw) as {
    id?: string;
    type?: string;
    event?: string;
    data?: { id?: string; status?: string };
  };
  const event = body.type || body.event || "message";
  const messageId = body.data?.id;
  const eventKey = body.id || `${messageId ?? "event"}:${event}`;
  const fresh = await store().rememberWebhook("taysend", eventKey);
  if (!fresh) return NextResponse.json({ ok: true });
  if (messageId && (event === "message.delivered" || event === "message.failed" || event === "message.rejected")) {
    const notice = await store().findNotificationByProvider(messageId);
    if (notice) {
      await store().updateNotification(notice.id, {
        status: event === "message.delivered" ? "sent" : "failed",
        detail: event === "message.delivered" ? "Taysend delivered the SMS." : `Taysend reported ${event}.`,
      });
    }
  }
  return NextResponse.json({ ok: true });
}
