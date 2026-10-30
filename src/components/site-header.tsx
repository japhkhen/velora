"use client";

import Link from "next/link";
import { useState } from "react";
import { brand } from "@/lib/brand";
import { useCart } from "@/components/cart-provider";

const links = [
  { href: "/shop?gender=women", label: "Women" },
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop?gender=men&category=tops", label: "T-shirts" },
  { href: "/shop?q=sneaker", label: "Sneakers" },
  { href: "/about", label: "The house" },
];

const ticker = [
  "Nike sneakers just in",
  "Men’s outfits",
  "Men’s T-shirts",
  "Ladies’ wear",
  "Accra delivery complimentary over GH₵500",
];

export function SiteHeader() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ivory/95 backdrop-blur">
      <div className="overflow-hidden bg-ink text-ivory">
        <div className="marquee-track py-2 text-[11px] tracking-[0.16em] uppercase">
          {[0, 1].map((copy) => (
            <p key={copy} className="flex shrink-0 gap-8 px-4 whitespace-nowrap">
              {ticker.map((item) => (
                <span key={`${copy}-${item}`}>{item}</span>
              ))}
              <a className="underline decoration-gold underline-offset-2" href={`tel:${brand.phones[0].tel}`}>
                {brand.phones[0].display}
              </a>
            </p>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 md:px-6">
        <button
          className="text-sm tracking-wide lg:hidden"
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav className="hidden items-center gap-6 text-sm lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-wine">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="mx-auto font-display text-4xl leading-none tracking-wide md:text-5xl">
          Velora
        </Link>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <form action="/shop" className="hidden md:block">
            <label className="sr-only" htmlFor="shop-search">
              Search
            </label>
            <input
              id="shop-search"
              name="q"
              placeholder="Search"
              className="w-36 border-b border-line bg-transparent py-1 outline-none focus:border-ink"
            />
          </form>
          <Link href="/account" className="hover:text-wine">
            Account
          </Link>
          <Link href="/cart" className="hover:text-wine">
            Bag{count > 0 ? ` (${count})` : ""}
          </Link>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-3 border-t border-line px-4 py-4 text-sm lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <form action="/shop">
            <input name="q" placeholder="Search dresses and shoes" className="w-full border-b border-line bg-transparent py-2 outline-none" />
          </form>
        </nav>
      )}
    </header>
  );
}
