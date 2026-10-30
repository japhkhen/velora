"use client";

import Link from "next/link";
import { lineKey, useCart } from "@/components/cart-provider";
import { btn } from "@/components/ui";
import { formatGhs } from "@/lib/format";

export default function CartPage() {
  const { lines, subtotal, setQty, remove } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <h1 className="font-display text-6xl">Bag</h1>
      {lines.length === 0 ? (
        <div className="mt-8">
          <p className="text-muted">The bag is empty.</p>
          <Link href="/shop" className={`${btn()} mt-6`}>
            Shop the edit
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((line) => {
              const key = lineKey(line);
              return (
                <li key={key} className="flex gap-4 py-5">
                  <img src={line.image} alt="" className="h-28 w-24 object-cover" />
                  <div className="flex-1">
                    <Link href={`/shop/${line.slug}`} className="font-display text-3xl leading-none">
                      {line.name}
                    </Link>
                    <p className="mt-2 text-sm text-muted">
                      {line.color} · {line.size}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <button type="button" className="border border-line px-2 py-1" onClick={() => setQty(key, line.qty - 1)} aria-label="Decrease quantity">
                        −
                      </button>
                      <span>{line.qty}</span>
                      <button type="button" className="border border-line px-2 py-1" onClick={() => setQty(key, line.qty + 1)} aria-label="Increase quantity">
                        +
                      </button>
                      <button type="button" className="text-muted underline" onClick={() => remove(key)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-sm">{formatGhs(line.price * line.qty)}</p>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted">Delivery is calculated at checkout.</p>
            <p className="text-lg">{formatGhs(subtotal)}</p>
          </div>
          <Link href="/checkout" className={`${btn("wine")} mt-6`}>
            Checkout
          </Link>
        </div>
      )}
    </div>
  );
}
