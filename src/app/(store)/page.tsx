import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { queryProducts } from "@/lib/catalog-service";
import { brand } from "@/lib/brand";

const tiles = [
  ["Men's outfits", "/shop?gender=men&category=outfits", "/products/men-street.jpg"],
  ["Men's T-shirts", "/shop?gender=men&category=tops", "/products/men-white-tee.jpg"],
  ["Nike sneakers", "/shop?q=sneaker", "/products/nike-red.jpg"],
  ["Ladies' wear", "/shop?gender=women", "/products/women-set.jpg"],
];

export default async function HomePage() {
  const products = await queryProducts({ sort: "featured" });
  const nike = products.filter((product) => product.name.toLowerCase().includes("nike"));
  const ladies = products.filter((product) => product.gender === "women").slice(0, 4);
  const menLooks = products.filter((product) => product.gender === "men" && (product.category === "tops" || product.category === "outfits"));
  const menShoes = products.filter((product) => product.gender === "men" && product.category === "shoes");
  const men = [...menLooks, ...menShoes].slice(0, 4);

  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:px-6 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-5">
          <p className="rise-in text-[11px] tracking-[0.22em] text-wine uppercase">Accra fashion house</p>
          <h1 className="rise-in delay-1 mt-4 font-display text-6xl leading-[0.9] md:text-7xl">
            Dresses, outfits, and Nike sneakers.
          </h1>
          <p className="rise-in delay-2 mt-6 max-w-md text-base leading-7 text-muted">
            Velora dresses women and men, then adds the T-shirt, the jacket, and the sneaker. The studio is in Accra. Orders are paid by Mobile Money.
          </p>
          <div className="rise-in delay-3 mt-8 flex flex-wrap gap-3">
            <Link href="/shop?q=sneaker" className="bg-ink px-5 py-3 text-sm text-ivory transition hover:-translate-y-0.5 hover:bg-wine">
              Shop Nike
            </Link>
            <Link href="/shop?gender=women" className="border border-ink px-5 py-3 text-sm transition hover:-translate-y-0.5 hover:bg-ink hover:text-ivory">
              Shop women
            </Link>
            <Link href="/shop?gender=men" className="border border-ink px-5 py-3 text-sm transition hover:-translate-y-0.5 hover:bg-ink hover:text-ivory">
              Shop men
            </Link>
          </div>
        </div>
        <div className="hero-photo relative lg:col-span-7">
          <img src="/products/women-set.jpg" alt="Pink off-shoulder dotted gown" className="aspect-[4/5] w-full object-cover md:aspect-[5/4]" />
          <p className="absolute bottom-4 left-4 bg-ivory/90 px-4 py-3 font-display text-3xl leading-none">Labadi Dot Gown</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-3 px-4 md:grid-cols-4 md:px-6">
        {tiles.map(([label, href, image], index) => (
          <Link key={href} href={href} className={`tile rise-in delay-${index + 1} group relative aspect-[3/4] overflow-hidden bg-sand`}>
            <img src={image} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 font-display text-3xl text-ivory transition duration-500 group-hover:pb-6">
              {label}
            </span>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-wine uppercase">Just landed</p>
            <h2 className="mt-2 font-display text-5xl">Nike sneakers</h2>
          </div>
          <Link href="/shop?q=sneaker" className="text-sm underline underline-offset-4">
            All sneakers
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {nike.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden bg-ink text-ivory">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:px-6">
          <img src="/products/nike-volt.jpg" alt="Nike SuperRep sneaker in volt" className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-[1.03]" />
          <div>
            <p className="text-[11px] tracking-[0.18em] text-gold uppercase">Men’s floor</p>
            <h2 className="mt-3 font-display text-5xl leading-none">T-shirts, jackets, and a loud sneaker.</h2>
            <p className="mt-5 leading-7 text-sand">
              The new men’s edit is a white crew neck, a brown leather jacket, and Nike Free, Air Force 1, and SuperRep. Dress suits are still on the rail.
            </p>
            <Link href="/shop?gender=men" className="mt-6 inline-block border border-ivory px-5 py-3 text-sm transition hover:bg-ivory hover:text-ink">
              Shop men
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-5xl">Ladies’ wear</h2>
          <Link href="/shop?gender=women" className="text-sm underline underline-offset-4">
            Shop women
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ladies.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-5xl">For him</h2>
          <Link href="/shop?gender=men" className="text-sm underline underline-offset-4">
            All men’s pieces
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {men.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:px-6">
          <img src="/products/story.jpg" alt="Clothing rail in the Velora studio" className="aspect-[4/3] w-full object-cover" />
          <div>
            <p className="text-[11px] tracking-[0.18em] text-gold uppercase">The house</p>
            <h2 className="mt-3 font-display text-5xl leading-none">Prepared in Accra, sent across Ghana.</h2>
            <p className="mt-5 leading-7 text-muted">
              Orders placed before 14:00 for Greater Accra are prepared the same day. Other regions leave the studio within two working days.
            </p>
            <p className="mt-4 text-sm">
              {brand.location}
              <br />
              {brand.phones.map((phone) => phone.display).join(" · ")}
              <br />
              {brand.hours}
            </p>
            <Link href="/about" className="mt-6 inline-block text-sm underline underline-offset-4">
              Read about the house
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
