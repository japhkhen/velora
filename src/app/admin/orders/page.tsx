import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { live } from "@/lib/catalog-service";
import { store } from "@/lib/db";
import { formatGhs, formatWhen } from "@/lib/format";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  await live();
  const orders = await store().listOrders();
  return (
    <div>
      <h1 className="font-display text-5xl">Orders</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-[11px] tracking-[0.14em] text-muted uppercase">
            <tr>
              <th className="py-2">Order</th>
              <th>Customer</th>
              <th>When</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td className="py-4 text-muted" colSpan={5}>
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-line">
                <td className="py-3">
                  <Link href={`/admin/orders/${order.id}`} className="underline">
                    {order.number}
                  </Link>
                </td>
                <td>
                  {order.fullName}
                  <p className="text-xs text-muted">{order.phone}</p>
                </td>
                <td>{formatWhen(order.createdAt)}</td>
                <td>
                  <StatusPill value={order.status} />
                </td>
                <td>{formatGhs(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
