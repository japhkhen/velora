"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { btn } from "@/components/ui";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const soldOut = product.stock < 1;

  return (
    <div className="mt-8 space-y-6">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Size</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.sizes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSize(option)}
              className={`min-w-12 border px-3 py-2 text-sm ${size === option ? "border-ink bg-ink text-ivory" : "border-line bg-paper"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Colour</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.colors.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColor(option)}
              className={`border px-3 py-2 text-sm ${color === option ? "border-ink bg-ink text-ivory" : "border-line bg-paper"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-[11px] tracking-[0.16em] text-muted uppercase" htmlFor="qty">
          Quantity
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          max={Math.min(5, product.stock)}
          value={qty}
          onChange={(event) => setQty(Number(event.target.value))}
          className="w-20 border border-line bg-paper px-3 py-2"
          disabled={soldOut}
        />
        <span className="text-sm text-muted">{product.stock} in the studio</span>
      </div>
      <button
        type="button"
        className={btn("solid", "w-full md:w-auto")}
        disabled={soldOut}
        onClick={() => {
          add({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.images[0] ?? "",
            size,
            color,
            qty,
            stock: product.stock,
          });
          setNote("Added to the bag.");
        }}
      >
        {soldOut ? "Sold out" : "Add to bag"}
      </button>
      {note && <p className="text-sm text-moss">{note}</p>}
    </div>
  );
}
