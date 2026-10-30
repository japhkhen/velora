import Link from "next/link";
import { categoryLabel, formatGhs, genderLabel } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const onSale = product.compareAt !== null && product.compareAt > product.price;
  return (
    <Link href={`/shop/${product.slug}`} className="group block rise-in">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand shadow-[0_0_0_rgba(28,22,20,0)] transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_22px_40px_rgba(28,22,20,0.14)]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 bg-ivory/95 px-3 py-2 text-center text-[11px] tracking-[0.16em] uppercase opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          View the piece
        </span>
        {product.stock === 0 ? (
          <span className="absolute top-3 left-3 bg-ink px-2 py-1 text-[10px] tracking-[0.14em] text-ivory uppercase">
            Sold out
          </span>
        ) : onSale ? (
          <span className="absolute top-3 left-3 bg-wine px-2 py-1 text-[10px] tracking-[0.14em] text-ivory uppercase">
            Studio price
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-muted uppercase">
            {genderLabel(product.gender)} · {categoryLabel(product.category)}
          </p>
          <h3 className="mt-1 font-display text-3xl leading-none">{product.name}</h3>
        </div>
        <div className="pt-5 text-right text-sm">
          <p>{formatGhs(product.price)}</p>
          {onSale && <p className="text-muted line-through">{formatGhs(product.compareAt!)}</p>}
        </div>
      </div>
    </Link>
  );
}
