import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentPanel } from "@/components/payment-panel";
import { StatusPill } from "@/components/status-pill";
import { getSessionUser } from "@/lib/auth";
import { canViewOrder } from "@/lib/commerce";
import { store } from "@/lib/db";
import { isMoolreConfigured } from "@/lib/env";
import { channelLabel, formatGhs, formatWhen, orderStatusLabel } from "@/lib/format";
import { live } from "@/lib/catalog-service";

export const metadata = { title: "Order" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  await live();
  const { orderNumber } = await params;
  const { t } = await searchParams;
  const order = await store().getOrderByNumber(orderNumber);
  const user = await getSessionUser();
  if (!order || !canViewOrder(order, t, user)) notFound();
  const items = await store().listOrderItems(order.id);
  const token = t && t === order.accessToken ? t : order.accessToken;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <p className="text-[11px] tracking-[0.18em] text-wine uppercase">{order.number}</p>
      <h1 className="mt-2 font-display text-6xl">{orderStatusLabel(order.status)}</h1>
      <p className="mt-3 text-sm text-muted">Placed {formatWhen(order.createdAt)}</p>
      <div className="mt-4 flex gap-2">
        <StatusPill value={order.status} />
        <StatusPill value={order.paymentStatus} />
      </div>
      <PaymentPanel
        orderNumber={order.number}
        token={token}
        paymentStatus={order.paymentStatus}
        orderStatus={order.status}
        demo={!isMoolreConfigured()}
      />
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 py-4">
            <img src={item.image} alt="" className="h-24 w-20 object-cover" />
            <div className="flex-1 text-sm">
              <p className="font-display text-2xl leading-none">{item.name}</p>
              <p className="mt-2 text-muted">
                {item.color} · {item.size} · {item.qty}
              </p>
            </div>
            <p className="text-sm">{formatGhs(item.unitPrice * item.qty)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatGhs(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd>{order.shipping === 0 ? "Complimentary" : formatGhs(order.shipping)}</dd>
        </div>
        <div className="flex justify-between text-base">
          <dt>Total</dt>
          <dd>{formatGhs(order.total)}</dd>
        </div>
      </dl>
      <div className="mt-8 text-sm leading-6">
        <p>{order.fullName}</p>
        <p>
          {order.address}, {order.city}, {order.region}
        </p>
        <p>{channelLabel[order.paymentChannel]} · {order.momoNumber}</p>
        <p>{order.email}</p>
      </div>
      <Link href="/shop" className="mt-8 inline-block text-sm underline underline-offset-4">
        Continue shopping
      </Link>
    </div>
  );
}
