import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/actions/storefront";
import { StatusPill } from "@/components/status-pill";
import { getSessionUser } from "@/lib/auth";
import { live } from "@/lib/catalog-service";
import { store } from "@/lib/db";
import { formatGhs, formatWhen } from "@/lib/format";
import { formatLocalPhone } from "@/lib/phone";

export const metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  await live();
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");
  const { notice } = await searchParams;
  const orders = (await store().listOrders()).filter(
    (order) => order.userId === user.id || order.email.toLowerCase() === user.email.toLowerCase(),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="font-display text-6xl">Account</h1>
      <p className="mt-3 text-muted">
        {user.fullName} · {user.email}
        {user.phone ? ` · ${formatLocalPhone(user.phone)}` : ""}
      </p>
      {notice === "desk" && <p className="mt-4 text-sm text-wine">The studio desk is for staff.</p>}
      <div className="mt-4 flex gap-4 text-sm">
        {user.role === "admin" && (
          <Link href="/admin" className="underline">
            Open the studio desk
          </Link>
        )}
        <form action={signOutAction}>
          <button className="underline" type="submit">
            Sign out
          </button>
        </form>
      </div>
      <h2 className="mt-10 font-display text-4xl">Orders</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No orders yet. <Link href="/shop" className="underline">Shop the edit</Link>.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-4 py-4 text-sm">
              <div>
                <Link href={`/orders/${order.number}?t=${order.accessToken}`} className="font-display text-2xl">
                  {order.number}
                </Link>
                <p className="text-muted">{formatWhen(order.createdAt)}</p>
              </div>
              <StatusPill value={order.status} />
              <p>{formatGhs(order.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
