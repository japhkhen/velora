import { brand } from "@/lib/brand";

export const metadata = { title: "The house" };

export default function AboutPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6">
      <img src="/products/story.jpg" alt="Inside the Velora studio" className="aspect-[4/5] w-full object-cover" />
      <div>
        <p className="text-[11px] tracking-[0.18em] text-wine uppercase">Accra</p>
        <h1 className="mt-3 font-display text-6xl leading-none">A house for dresses, outfits, and sneakers.</h1>
        <div className="mt-6 space-y-4 leading-7 text-muted">
          <p>
            Velora sells dresses and shoes for women and men, plus men’s outfits and T-shirts, ladies’ tops and sets, and Nike sneakers. The dress edit includes evening gowns, day dresses, and men’s dress suits. The shoe edit runs from heels and oxfords to Nike Free, Air Force 1, and SuperRep.
          </p>
          <p>
            The studio is in {brand.location}. Orders are paid in Ghana cedis through Moolre on MTN MoMo, Telecel Cash, or AT Money. When a payment clears, the desk sends an email through Resend and a text through Taysend.
          </p>
          <p>
            Call {brand.phones[0].display} or {brand.phones[1].display}. The desk is open {brand.hours}.
          </p>
        </div>
      </div>
    </div>
  );
}
