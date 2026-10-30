import { live } from "@/lib/catalog-service";
import { store } from "@/lib/db";
import { formatGhs, formatWhen } from "@/lib/format";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  await live();
  const [users, orders] = await Promise.all([store().listUsers(), store().listOrders()]);
  const rows = users.map((user) => {
    const own = orders.filter((order) => order.userId === user.id || order.email.toLowerCase() === user.email.toLowerCase());
    const spent = own
      .filter((order) => ["paid", "processing", "shipped", "delivered"].includes(order.status))
      .reduce((sum, order) => sum + order.total, 0);
    return { user, orders: own.length, spent };
  });

  return (
    <div>
      <h1 className="font-display text-5xl">Customers</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-[11px] tracking-[0.14em] text-muted uppercase">
            <tr>
              <th className="py-2">Name</th>
              <th>Role</th>
              <th>Orders</th>
              <th>Paid</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ user, orders: count, spent }) => (
              <tr key={user.id} className="border-t border-line">
                <td className="py-3">
                  {user.fullName || "—"}
                  <p className="text-xs text-muted">{user.email}</p>
                </td>
                <td>{user.role}</td>
                <td>{count}</td>
                <td>{formatGhs(spent)}</td>
                <td>{formatWhen(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
