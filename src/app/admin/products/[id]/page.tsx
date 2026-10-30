import { notFound } from "next/navigation";
import { archiveProductAction } from "@/actions/admin";
import { ProductForm } from "@/components/product-form";
import { live } from "@/lib/catalog-service";
import { store } from "@/lib/db";

export const metadata = { title: "Edit piece" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await live();
  const { id } = await params;
  const { saved } = await searchParams;
  const product = await store().getProductById(id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-5xl">{product.name}</h1>
      {saved && <p className="mt-3 text-sm text-moss">Saved.</p>}
      <div className="mt-8 max-w-3xl">
        <ProductForm product={product} />
        {product.active && (
          <form action={archiveProductAction} className="mt-6">
            <input type="hidden" name="id" value={product.id} />
            <button type="submit" className="text-sm text-wine underline">
              Hide this piece from the shop
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
