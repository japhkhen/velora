import { notFound } from "next/navigation";
import { orderDeskAction } from "@/actions/admin";
import { StatusPill } from "@/components/status-pill";
import { live } from "@/lib/catalog-service";
import { store } from "@/lib/db";
import { channelLabel, formatGhs, formatWhen } from "@/lib/format";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await live();
  const { id } = await params;
  const { error } = await searchParams;
  const order = (await store().listOrders()).find((item) => item.id === id);
  if (!order) notFound();
  const [items, payments, notices] = await Promise.all([
    store().listOrderItems(order.id),
    store().listPayments(order.id),
    store().listNotifications(order.id),
  ]);

  return (
    <div className="max-w-3xl">
      <p className="text-[11px] tracking-[0.16em] text-wine uppercase">{order.number}</p>
      <h1 className="mt-2 font-display text-5xl">{order.fullName}</h1>
      <div className="mt-3 flex gap-2">
        <StatusPill value={order.status} />
        <StatusPill value={order.paymentStatus} />
      </div>
      {error && <p className="mt-4 text-sm text-wine">{error}</p>}
      <p className="mt-4 text-sm leading-6 text-muted">
        {formatWhen(order.createdAt)}
        <br />
        {order.email} · {order.phone}
        <br />
        {order.address}, {order.city}, {order.region}
        <br />
        {channelLabel[order.paymentChannel]} · {order.momoNumber}
        <br />
        Ref {order.externalRef}
        {order.moolreTransactionId ? ` · Moolre ${order.moolreTransactionId}` : ""}
      </p>
      <ul className="mt-6 divide-y divide-line border-y border-line text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between py-3">
            <span>
              {item.name} · {item.color} · {item.size} · {item.qty}
            </span>
            <span>{formatGhs(item.unitPrice * item.qty)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-right">{formatGhs(order.total)}</p>
      <form action={orderDeskAction} className="mt-6 flex flex-wrap gap-2">
        <input type="hidden" name="id" value={order.id} />
        <button name="intent" value="processing" className="border border-ink px-3 py-2 text-sm">
          Mark preparing
        </button>
        <button name="intent" value="shipped" className="border border-ink px-3 py-2 text-sm">
          Mark on the way
        </button>
        <button name="intent" value="delivered" className="border border-ink px-3 py-2 text-sm">
          Mark delivered
        </button>
        <button name="intent" value="cancel" className="px-3 py-2 text-sm text-wine">
          Cancel and restock
        </button>
      </form>
      <h2 className="mt-10 font-display text-3xl">Payment log</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {payments.map((payment) => (
          <li key={payment.id}>
            {payment.status}: {payment.detail}
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-display text-3xl">Messages sent</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {notices.length === 0 && <li>Nothing sent yet.</li>}
        {notices.map((notice) => (
          <li key={notice.id}>
            {notice.channel} · {notice.kind} · {notice.status} · {notice.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
