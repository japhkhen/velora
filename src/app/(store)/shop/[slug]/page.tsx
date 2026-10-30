import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { getPublicProduct, queryProducts } from "@/lib/catalog-service";
import { ProductCard } from "@/components/product-card";
import { categoryLabel, formatGhs, genderLabel } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) return { title: "Piece" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();
  const related = (await queryProducts({ gender: product.gender, category: product.category }))
    .filter((item) => item.id !== product.id)
    .slice(0, 3);
  const onSale = product.compareAt !== null && product.compareAt > product.price;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <p className="text-sm text-muted">
        <Link href="/shop">Shop</Link> / {genderLabel(product.gender)} / {categoryLabel(product.category)}
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <img src={product.images[0]} alt={product.name} className="aspect-[4/5] w-full bg-sand object-cover" />
        <div>
          <p className="text-[11px] tracking-[0.18em] text-wine uppercase">{product.sku}</p>
          <h1 className="mt-2 font-display text-6xl leading-none">{product.name}</h1>
          <p className="mt-4 text-lg">
            {formatGhs(product.price)}
            {onSale && <span className="ml-3 text-base text-muted line-through">{formatGhs(product.compareAt!)}</span>}
          </p>
          <p className="mt-5 max-w-lg leading-7 text-muted">{product.description}</p>
          <AddToCart product={product} />
          <p className="mt-8 max-w-lg text-sm leading-6 text-muted">{product.details}</p>
          <p className="mt-4 text-sm text-muted">Delivery from Accra. Greater Accra is GH₵25, complimentary over GH₵500.</p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-4xl">Worn with</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
