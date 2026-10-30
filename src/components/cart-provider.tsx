"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  qty: number;
  stock: number;
};

type CartValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: CartLine) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);
const STORAGE_KEY = "velora-bag";

export function lineKey(line: Pick<CartLine, "productId" | "size" | "color">) {
  return `${line.productId}|${line.size}|${line.color}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const value = useMemo<CartValue>(() => {
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      subtotal: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
      add(line) {
        setLines((current) => {
          const key = lineKey(line);
          const existing = current.find((item) => lineKey(item) === key);
          if (!existing) return [...current, { ...line, qty: Math.min(line.qty, line.stock, 5) }];
          const qty = Math.min(existing.qty + line.qty, existing.stock, 5);
          return current.map((item) => (lineKey(item) === key ? { ...item, qty } : item));
        });
      },
      setQty(key, qty) {
        setLines((current) =>
          current
            .map((item) => (lineKey(item) === key ? { ...item, qty: Math.max(1, Math.min(qty, item.stock, 5)) } : item))
            .filter((item) => item.qty > 0),
        );
      },
      remove(key) {
        setLines((current) => current.filter((item) => lineKey(item) !== key));
      },
      clear() {
        setLines([]);
      },
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("Cart is only available inside the shop.");
  return value;
}
