import { NextResponse } from "next/server";
import { applyMoolreWebhook } from "@/lib/commerce";
import type { MoolreWebhook } from "@/lib/moolre";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as MoolreWebhook | null;
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  const result = await applyMoolreWebhook(body);
  if (!result.ok) return NextResponse.json({ ok: false }, { status: result.status });
  return NextResponse.json({ ok: true });
}
