import Link from "next/link";
import { brand } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-ink text-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <p className="font-display text-5xl">Velora</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-sand">
            Dresses, outfits, T-shirts, and shoes for women and men, including Nike sneakers. Prepared in Accra and paid with Mobile Money.
          </p>
        </div>
        <div className="text-sm leading-7">
          <p className="text-[11px] tracking-[0.16em] text-gold uppercase">Visit</p>
          <p className="mt-2">{brand.location}</p>
          {brand.phones.map((phone) => (
            <p key={phone.tel}>
              <a href={`tel:${phone.tel}`}>{phone.display}</a>
            </p>
          ))}
          <p>{brand.hours}</p>
        </div>
        <div className="text-sm leading-7">
          <p className="text-[11px] tracking-[0.16em] text-gold uppercase">Shop</p>
          <p className="mt-2">
            <Link href="/shop?gender=women">Women</Link>
          </p>
          <p>
            <Link href="/shop?gender=men">Men</Link>
          </p>
          <p>
            <Link href="/shop?q=sneaker">Sneakers</Link>
          </p>
          <p>
            <Link href="/shop?category=tops">Tops</Link>
          </p>
          <p>
            <Link href="/contact">Contact</Link>
          </p>
          <p>
            <Link href="/admin">Studio desk</Link>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-[11px] tracking-[0.14em] text-sand uppercase md:px-6">
        Payments by Moolre · Mail by Resend · SMS by Taysend · Records in Supabase
      </div>
    </footer>
  );
}
