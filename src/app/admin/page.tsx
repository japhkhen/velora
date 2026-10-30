import Link from "next/link";
import { live } from "@/lib/catalog-service";
import { store } from "@/lib/db";
import { formatGhs } from "@/lib/format";

export const metadata = { title: "Studio desk" };

const settled = new Set(["paid", "processing", "shipped", "delivered"]);

export default async function AdminHome() {
  await live();
  const [products, orders] = await Promise.all([store().listProducts(), store().listOrders()]);
  const revenue = orders.filter((order) => settled.has(order.status)).reduce((sum, order) => sum + order.total, 0);
  const low = products.filter((product) => product.active && product.stock <= 5);
  const recent = orders.slice(0, 6);

  return (
    <div>
      <h1 className="font-display text-5xl">Studio desk</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Paid revenue", formatGhs(revenue)],
          ["Orders", String(orders.length)],
          ["Pieces", String(products.filter((product) => product.active).length)],
        ].map(([label, value]) => (
          <div key={label} className="border border-line bg-paper p-5">
            <p className="text-[11px] tracking-[0.16em] text-muted uppercase">{label}</p>
            <p className="mt-2 font-display text-4xl">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-3xl">Recent orders</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
            {recent.length === 0 && <li className="py-4 text-muted">No orders yet.</li>}
            {recent.map((order) => (
              <li key={order.id} className="flex justify-between py-3">
                <Link href={`/admin/orders/${order.id}`} className="underline">
                  {order.number}
                </Link>
                <span>{formatGhs(order.total)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-3xl">Low stock</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
            {low.length === 0 && <li className="py-4 text-muted">Every piece has more than five in stock.</li>}
            {low.map((product) => (
              <li key={product.id} className="flex justify-between py-3">
                <Link href={`/admin/products/${product.id}`} className="underline">
                  {product.name}
                </Link>
                <span>{product.stock}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
