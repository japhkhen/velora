import { randomBytes } from "crypto";
import { store } from "@/lib/db";
import { sendOrderEmail } from "@/lib/email";
import { isMoolreConfigured } from "@/lib/env";
import { initiateMobileMoney, safeEqual, type MoolreWebhook } from "@/lib/moolre";
import { normalizeGhPhone } from "@/lib/phone";
import { shippingFee } from "@/lib/shipping";
import { sendOrderSms } from "@/lib/taysend";
import type {
  CartLineInput,
  MomoChannel,
  Notice,
  NoticeKind,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  UserPublic,
} from "@/lib/types";

export class CommerceError extends Error {}

type CheckoutDraft = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  note?: string;
  channel: MomoChannel;
  momoNumber: string;
  items: CartLineInput[];
  userId: string | null;
};

export type CheckoutResult = {
  ok: true;
  orderNumber: string;
  token: string;
  paymentStatus: PaymentStatus;
  message: string;
};

function groups(items: { productId: string; qty: number }[]) {
  const map = new Map<string, number>();
  for (const item of items) map.set(item.productId, (map.get(item.productId) ?? 0) + item.qty);
  return [...map.entries()].map(([productId, qty]) => ({ productId, qty }));
}

async function notify(order: Order, kind: NoticeKind) {
  const db = store();
  const existing = await db.listNotifications(order.id);
  const items = await db.listOrderItems(order.id);
  const jobs: { channel: Notice["channel"]; run: () => Promise<{ status: Notice["status"]; providerId: string | null; detail: string }>; to: string }[] = [
    {
      channel: "email",
      to: order.email,
      run: () => sendOrderEmail(order, items, kind),
    },
    {
      channel: "sms",
      to: order.phone,
      run: () => sendOrderSms(order, kind),
    },
  ];

  for (const job of jobs) {
    if (existing.some((notice) => notice.kind === kind && notice.channel === job.channel && notice.status === "sent")) {
      continue;
    }
    const result = await job.run();
    const notice: Notice = {
      id: crypto.randomUUID(),
      orderId: order.id,
      channel: job.channel,
      kind,
      to: job.to,
      status: result.status,
      providerId: result.providerId,
      detail: result.detail,
      createdAt: new Date().toISOString(),
    };
    await db.addNotification(notice);
  }
}

async function recordSale(order: Order) {
  const db = store();
  const items = await db.listOrderItems(order.id);
  for (const group of groups(items)) {
    await db.addMovement({
      id: crypto.randomUUID(),
      productId: group.productId,
      delta: 0,
      reason: "sale",
      orderId: order.id,
      note: "Payment captured",
      createdAt: new Date().toISOString(),
    });
  }
}

async function releaseReservation(order: Order) {
  const db = store();
  const items = await db.listOrderItems(order.id);
  for (const group of groups(items)) {
    await db.adjustStock(group.productId, group.qty);
    await db.addMovement({
      id: crypto.randomUUID(),
      productId: group.productId,
      delta: group.qty,
      reason: "release",
      orderId: order.id,
      note: `Released from ${order.number}`,
      createdAt: new Date().toISOString(),
    });
  }
}

export async function markPaid(order: Order, transactionId: string | null, detail: string) {
  if (order.paymentStatus === "paid") return;
  const db = store();
  await db.updateOrder(order.id, {
    status: order.status === "pending_payment" || order.status === "payment_failed" ? "paid" : order.status,
    paymentStatus: "paid",
    moolreTransactionId: transactionId,
  });
  await db.updateLatestPayment(order.id, { status: "paid", detail, transactionId });
  await recordSale(order);
  const fresh = await db.getOrderByNumber(order.number);
  if (fresh) await notify(fresh, "order_paid");
}

export async function markFailed(order: Order, detail: string) {
  if (order.paymentStatus === "paid" || order.status === "payment_failed" || order.status === "cancelled") return;
  const db = store();
  await releaseReservation(order);
  await db.updateOrder(order.id, { status: "payment_failed", paymentStatus: "failed" });
  await db.updateLatestPayment(order.id, { status: "failed", detail });
  const fresh = await db.getOrderByNumber(order.number);
  if (fresh) await notify(fresh, "payment_failed");
}

async function applyInit(order: Order, result: { outcome: "otp" | "prompt" | "error"; message: string }): Promise<CheckoutResult> {
  const db = store();
  if (result.outcome === "otp") {
    await db.updateOrder(order.id, { paymentStatus: "otp_required", status: "pending_payment" });
    await db.updateLatestPayment(order.id, { status: "otp_required", detail: result.message });
  } else if (result.outcome === "prompt") {
    await db.updateOrder(order.id, { paymentStatus: "prompt_sent", status: "pending_payment" });
    await db.updateLatestPayment(order.id, { status: "prompt_sent", detail: result.message });
  } else {
    await db.updateOrder(order.id, { paymentStatus: "pending", status: "pending_payment" });
    await db.updateLatestPayment(order.id, { status: "pending", detail: result.message });
  }
  return {
    ok: true,
    orderNumber: order.number,
    token: order.accessToken,
    paymentStatus: result.outcome === "otp" ? "otp_required" : result.outcome === "prompt" ? "prompt_sent" : "pending",
    message: result.message,
  };
}

export async function placeOrder(draft: CheckoutDraft): Promise<CheckoutResult> {
  const phone = normalizeGhPhone(draft.phone);
  const momo = normalizeGhPhone(draft.momoNumber);
  if (!phone) throw new CommerceError("Enter a Ghana phone number, for example 055 314 0985.");
  if (!momo) throw new CommerceError("Enter the Mobile Money number in local format, for example 024 000 0000.");
  if (!draft.items.length) throw new CommerceError("Your bag is empty.");

  const db = store();
  const products = new Map<string, Product>();
  for (const line of draft.items) {
    const product = await db.getProductById(line.productId);
    if (!product || !product.active) throw new CommerceError("A piece in your bag is no longer available.");
    if (!product.sizes.includes(line.size) || !product.colors.includes(line.color)) {
      throw new CommerceError(`Choose a valid size and colour for ${product.name}.`);
    }
    products.set(product.id, product);
  }

  const reservations = groups(draft.items);
  for (const reservation of reservations) {
    const product = products.get(reservation.productId)!;
    if (product.stock < reservation.qty) {
      throw new CommerceError(`${product.name} has only ${product.stock} left.`);
    }
  }

  const subtotal = draft.items.reduce((sum, line) => sum + products.get(line.productId)!.price * line.qty, 0);
  const shipping = shippingFee(draft.region, subtotal);
  const now = new Date().toISOString();
  const count = (await db.listOrders()).length;
  const number = `VL-${10421 + count}`;
  const order: Order = {
    id: crypto.randomUUID(),
    number,
    accessToken: randomBytes(18).toString("base64url"),
    userId: draft.userId,
    email: draft.email.trim().toLowerCase(),
    phone,
    fullName: draft.fullName.trim(),
    address: draft.address.trim(),
    city: draft.city.trim(),
    region: draft.region,
    note: draft.note?.trim() ?? "",
    subtotal,
    shipping,
    total: subtotal + shipping,
    status: "pending_payment",
    paymentStatus: "pending",
    paymentChannel: draft.channel,
    momoNumber: momo,
    externalRef: `VLORA-${number}-${randomBytes(3).toString("hex")}`,
    moolreTransactionId: null,
    createdAt: now,
    updatedAt: now,
  };

  const items: OrderItem[] = draft.items.map((line) => {
    const product = products.get(line.productId)!;
    return {
      id: crypto.randomUUID(),
      orderId: order.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? "",
      size: line.size,
      color: line.color,
      qty: line.qty,
      unitPrice: product.price,
    };
  });

  await db.createCheckout({ order, items, reservations });

  if (!isMoolreConfigured()) {
    await db.updateOrder(order.id, { paymentStatus: "prompt_sent" });
    await db.updateLatestPayment(order.id, {
      status: "prompt_sent",
      detail: "Demo mode: Moolre keys are not set, so the studio can approve this payment locally.",
    });
    return {
      ok: true,
      orderNumber: order.number,
      token: order.accessToken,
      paymentStatus: "prompt_sent",
      message: "Order saved. Approve the demo Mobile Money prompt to confirm it.",
    };
  }

  try {
    const result = await initiateMobileMoney({
      channel: draft.channel,
      payer: momo,
      amount: order.total,
      externalRef: order.externalRef,
    });
    return applyInit(order, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Moolre could not be reached.";
    await db.updateLatestPayment(order.id, { detail: message });
    return {
      ok: true,
      orderNumber: order.number,
      token: order.accessToken,
      paymentStatus: "pending",
      message: "The order is saved, but Moolre could not be reached. Retry the payment.",
    };
  }
}

async function orderForAction(orderNumber: string, token: string) {
  const order = await store().getOrderByNumber(orderNumber);
  if (!order || order.accessToken !== token) throw new CommerceError("This order could not be opened.");
  return order;
}

export async function submitPaymentOtp(orderNumber: string, token: string, otp: string) {
  const order = await orderForAction(orderNumber, token);
  if (!isMoolreConfigured()) throw new CommerceError("Moolre is not configured.");
  if (!otp.trim()) throw new CommerceError("Enter the OTP.");
  const result = await initiateMobileMoney({
    channel: order.paymentChannel,
    payer: order.momoNumber,
    amount: order.total,
    externalRef: order.externalRef,
    otpCode: otp.trim(),
  });
  return applyInit(order, result);
}

async function rehold(order: Order) {
  if (order.status !== "payment_failed") return order;
  const db = store();
  const items = await db.listOrderItems(order.id);
  const need = groups(items);
  for (const group of need) {
    const product = await db.getProductById(group.productId);
    if (!product || product.stock < group.qty) {
      throw new CommerceError(`${product?.name ?? "A piece"} does not have enough stock to try again.`);
    }
  }
  for (const group of need) {
    await db.adjustStock(group.productId, -group.qty);
    await db.addMovement({
      id: crypto.randomUUID(),
      productId: group.productId,
      delta: -group.qty,
      reason: "reserve",
      orderId: order.id,
      note: `Reserved again for ${order.number}`,
      createdAt: new Date().toISOString(),
    });
  }
  await db.updateOrder(order.id, { status: "pending_payment", paymentStatus: "pending" });
  return (await db.getOrderByNumber(order.number)) ?? order;
}

export async function retryPayment(orderNumber: string, token: string) {
  const current = await orderForAction(orderNumber, token);
  const order = await rehold(current);
  if (order.paymentStatus === "paid") {
    return {
      ok: true as const,
      orderNumber: order.number,
      token: order.accessToken,
      paymentStatus: order.paymentStatus,
      message: "This order is already paid.",
    };
  }
  if (!isMoolreConfigured()) {
    await store().updateOrder(order.id, { paymentStatus: "prompt_sent", status: "pending_payment" });
    return {
      ok: true as const,
      orderNumber: order.number,
      token: order.accessToken,
      paymentStatus: "prompt_sent" as const,
      message: "Approve the demo payment to confirm the order.",
    };
  }
  const result = await initiateMobileMoney({
    channel: order.paymentChannel,
    payer: order.momoNumber,
    amount: order.total,
    externalRef: order.externalRef,
  });
  return applyInit(order, result);
}

export async function captureDemoPayment(orderNumber: string, token: string) {
  if (isMoolreConfigured()) {
    throw new CommerceError("Live Moolre payments are confirmed by the webhook, not by this button.");
  }
  const current = await orderForAction(orderNumber, token);
  const order = await rehold(current);
  await markPaid(order, null, "Captured in demo mode because Moolre keys are not set.");
}

export async function applyMoolreWebhook(body: MoolreWebhook) {
  const secret = process.env.MOOLRE_WEBHOOK_SECRET;
  const given = body.data?.secret;
  if (!secret || !given || !safeEqual(given, secret)) return { ok: false as const, status: 401 };
  const ref = body.data?.externalref;
  if (!ref) return { ok: false as const, status: 400 };
  const db = store();
  const first = await db.rememberWebhook(
    "moolre",
    `${ref}:${body.code ?? ""}:${body.data?.transactionid ?? ""}:${body.data?.txstatus ?? ""}`,
  );
  if (!first) return { ok: true as const };
  const order = await db.getOrderByExternalRef(ref);
  if (!order) return { ok: true as const };
  const success = Number(body.status) === 1 && body.code === "P01" && Number(body.data?.txstatus) === 1;
  const failed = body.code === "P02" || Number(body.data?.txstatus) === 2;
  if (success) {
    const amount = Number(body.data?.amount);
    if (Number.isFinite(amount) && Math.abs(amount - order.total) > 0.5) {
      await db.updateLatestPayment(order.id, { detail: `Moolre amount ${amount} did not match ${order.total}.` });
      return { ok: true as const };
    }
    await markPaid(order, body.data?.transactionid ?? null, "Moolre confirmed the payment.");
  } else if (failed) {
    await markFailed(order, body.data?.reason || body.message || "Moolre reported a failed payment.");
  }
  return { ok: true as const };
}

export async function cancelOrder(orderId: string) {
  const db = store();
  const orders = await db.listOrders();
  const order = orders.find((item) => item.id === orderId);
  if (!order) throw new CommerceError("Order not found.");
  if (order.status === "cancelled") return;
  if (order.status === "shipped" || order.status === "delivered") {
    throw new CommerceError("This order has already left the studio.");
  }
  if (order.status === "pending_payment" || order.status === "paid" || order.status === "processing") {
    await releaseReservation(order);
  }
  await db.updateOrder(order.id, { status: "cancelled" });
}

export async function advanceOrder(orderId: string, status: Extract<OrderStatus, "processing" | "shipped" | "delivered">) {
  const db = store();
  const order = (await db.listOrders()).find((item) => item.id === orderId);
  if (!order) throw new CommerceError("Order not found.");
  const allowed: Record<typeof status, OrderStatus[]> = {
    processing: ["paid"],
    shipped: ["paid", "processing"],
    delivered: ["shipped"],
  };
  if (!allowed[status].includes(order.status)) {
    throw new CommerceError("That status cannot be applied to this order yet.");
  }
  await db.updateOrder(order.id, { status });
  if (status === "shipped") {
    const fresh = await db.getOrderByNumber(order.number);
    if (fresh) await notify(fresh, "order_shipped");
  }
}

export function canViewOrder(order: Order, token: string | undefined, user: UserPublic | null) {
  if (token && token === order.accessToken) return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.id === order.userId) return true;
  return user.email.toLowerCase() === order.email.toLowerCase();
}
