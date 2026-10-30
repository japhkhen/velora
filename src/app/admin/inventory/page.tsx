import { adjustStockAction } from "@/actions/admin";
import { live } from "@/lib/catalog-service";
import { store } from "@/lib/db";
import { formatWhen } from "@/lib/format";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await live();
  const { error } = await searchParams;
  const [products, movements] = await Promise.all([store().listProducts(), store().listMovements()]);

  return (
    <div>
      <h1 className="font-display text-5xl">Inventory</h1>
      {error && <p className="mt-4 text-sm text-wine">{error}</p>}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[11px] tracking-[0.14em] text-muted uppercase">
            <tr>
              <th className="py-2">Piece</th>
              <th>Stock</th>
              <th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-line">
                <td className="py-3">
                  {product.name}
                  <p className="text-xs text-muted">{product.sku}</p>
                </td>
                <td className={product.stock <= 5 ? "text-wine" : ""}>{product.stock}</td>
                <td>
                  <form action={adjustStockAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={product.id} />
                    <input name="delta" type="number" step="1" placeholder="+/-" className="w-20 border border-line bg-paper px-2 py-2" required />
                    <input name="note" placeholder="Note" className="w-40 border border-line bg-paper px-2 py-2" />
                    <button className="border border-ink px-3 py-2" type="submit">
                      Update
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-12 font-display text-3xl">Movement</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
        {movements.slice(0, 30).map((movement) => {
          const product = products.find((item) => item.id === movement.productId);
          return (
            <li key={movement.id} className="flex justify-between gap-4 py-3">
              <span>
                {product?.name ?? "Piece"} · {movement.reason} · {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                <span className="block text-xs text-muted">{movement.note}</span>
              </span>
              <span className="text-muted">{formatWhen(movement.createdAt)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
