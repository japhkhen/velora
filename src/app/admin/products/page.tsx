import Link from "next/link";
import { live } from "@/lib/catalog-service";
import { store } from "@/lib/db";
import { categoryLabel, formatGhs, genderLabel } from "@/lib/format";

export const metadata = { title: "Pieces" };

export default async function ProductsPage() {
  await live();
  const products = await store().listProducts();
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-display text-5xl">Pieces</h1>
        <Link href="/admin/products/new" className="bg-ink px-4 py-3 text-sm text-ivory">
          Add a piece
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[11px] tracking-[0.14em] text-muted uppercase">
            <tr>
              <th className="py-2">Piece</th>
              <th>Who</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Shop</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-line">
                <td className="py-3">
                  <Link href={`/admin/products/${product.id}`} className="underline">
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted">{product.sku}</p>
                </td>
                <td>
                  {genderLabel(product.gender)} · {categoryLabel(product.category)}
                </td>
                <td>{formatGhs(product.price)}</td>
                <td>{product.stock}</td>
                <td>{product.active ? "Visible" : "Hidden"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
