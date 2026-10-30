import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { integrationStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

const links = [
  ["/admin", "Desk"],
  ["/admin/products", "Pieces"],
  ["/admin/orders", "Orders"],
  ["/admin/inventory", "Inventory"],
  ["/admin/customers", "Customers"],
  ["/admin/messages", "Messages"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/account?notice=desk");
  const status = integrationStatus();

  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="bg-ink text-ivory">
        <div className="flex items-center gap-5 overflow-x-auto px-4 py-4 lg:flex-col lg:items-start lg:px-5 lg:py-8">
          <Link href="/" className="font-display text-4xl leading-none">
            Velora
          </Link>
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="text-sm text-sand hover:text-ivory">
              {label}
            </Link>
          ))}
          <Link href="/shop" className="text-sm text-gold">
            View shop
          </Link>
        </div>
      </aside>
      <div className="px-4 py-8 md:px-8">
        <p className="mb-6 text-[11px] tracking-[0.12em] text-muted uppercase">
          Supabase {status.supabase ? "connected" : "local file"} · Moolre {status.moolre ? "live" : "demo"} · Resend{" "}
          {status.resend ? "live" : "logged"} · Taysend {status.taysend ? "live" : "logged"}
        </p>
        {children}
      </div>
    </div>
  );
}
