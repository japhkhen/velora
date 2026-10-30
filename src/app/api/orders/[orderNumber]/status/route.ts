import { NextResponse } from "next/server";
import { store } from "@/lib/db";

export async function GET(request: Request, context: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await context.params;
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const order = await store().getOrderByNumber(orderNumber);
  if (!order || order.accessToken !== token) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    status: order.status,
    paymentStatus: order.paymentStatus,
  });
}
