import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { queryProducts } from "@/lib/catalog-service";
import { isCategory } from "@/lib/format";
import type { Category, Gender } from "@/lib/types";

type Search = {
  q?: string;
  gender?: string;
  category?: string;
  sort?: string;
};

function shopHref(current: Search, patch: Partial<Record<keyof Search, string | null>>) {
  const params = new URLSearchParams();
  const next: Search = { ...current };
  for (const [key, value] of Object.entries(patch) as [keyof Search, string | null][]) {
    if (value === null) delete next[key];
    else next[key] = value;
  }
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

export const metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const gender = params.gender === "women" || params.gender === "men" ? (params.gender as Gender) : "";
  const category = isCategory(params.category) ? (params.category as Category) : "";
  const sort = params.sort === "newest" || params.sort === "price-asc" || params.sort === "price-desc" ? params.sort : "featured";
  const products = await queryProducts({ q: params.q, gender, category, sort });

  const filters = [
    ["All", "/shop", !gender && !category && !params.q],
    ["Women", shopHref(params, { gender: "women", category: null, q: null }), gender === "women" && !category && !params.q],
    ["Men", shopHref(params, { gender: "men", category: null, q: null }), gender === "men" && !category && !params.q],
    ["Dresses", shopHref(params, { category: "dresses", q: null }), category === "dresses"],
    ["Tops", shopHref(params, { category: "tops", q: null }), category === "tops"],
    ["Outfits", shopHref(params, { category: "outfits", q: null }), category === "outfits"],
    ["Shoes", shopHref(params, { category: "shoes", q: null }), category === "shoes" && !params.q],
    ["Sneakers", "/shop?q=sneaker", params.q?.toLowerCase() === "sneaker"],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <p className="text-[11px] tracking-[0.18em] text-wine uppercase">The edit</p>
      <h1 className="mt-2 font-display text-6xl">Shop</h1>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {filters.map(([label, href, active]) => (
          <Link
            key={label}
            href={href}
            className={active ? "border border-ink bg-ink px-3 py-2 text-ivory" : "border border-line bg-paper px-3 py-2 transition hover:-translate-y-0.5 hover:border-ink"}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
        <Link href={shopHref(params, { sort: "featured" })}>Featured</Link>
        <Link href={shopHref(params, { sort: "newest" })}>Newest</Link>
        <Link href={shopHref(params, { sort: "price-asc" })}>Price, low</Link>
        <Link href={shopHref(params, { sort: "price-desc" })}>Price, high</Link>
        <span className="ml-auto">{products.length} pieces</span>
      </div>
      {products.length === 0 ? (
        <p className="mt-12 text-muted">
          Nothing matches that search. <Link href="/shop" className="underline">Clear the filters</Link>.
        </p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
