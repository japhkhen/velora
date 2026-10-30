"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { placeOrderAction } from "@/actions/storefront";
import { useCart } from "@/components/cart-provider";
import { btn, fieldClass, labelClass } from "@/components/ui";
import { channelLabel, formatGhs } from "@/lib/format";
import { FREE_ACCRA_OVER, REGIONS, shippingFee } from "@/lib/shipping";
import type { MomoChannel } from "@/lib/types";

const channels: MomoChannel[] = ["13", "6", "7"];

export function CheckoutForm() {
  const { lines, subtotal, clear } = useCart();
  const [region, setRegion] = useState("Greater Accra");
  const [channel, setChannel] = useState<MomoChannel>("13");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const shipping = shippingFee(region, subtotal);
  const total = subtotal + shipping;

  if (!lines.length) {
    return <p className="text-muted">Your bag is empty. Add a dress or a pair of shoes before checkout.</p>;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    const result = await placeOrderAction({
      fullName: form.get("fullName"),
      email: form.get("email"),
      phone: form.get("phone"),
      address: form.get("address"),
      city: form.get("city"),
      region,
      note: form.get("note"),
      channel,
      momoNumber: form.get("momoNumber"),
      items: lines.map((line) => ({
        productId: line.productId,
        size: line.size,
        color: line.color,
        qty: line.qty,
      })),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    clear();
    router.push(`/orders/${result.orderNumber}?t=${result.token}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className={labelClass}>Full name</span>
            <input name="fullName" required className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Email</span>
            <input name="email" type="email" required className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Phone</span>
            <input name="phone" required placeholder="055 314 0985" className={fieldClass} />
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>Delivery address</span>
            <input name="address" required className={fieldClass} placeholder="Street and landmark" />
          </label>
          <label>
            <span className={labelClass}>City</span>
            <input name="city" required defaultValue="Accra" className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Region</span>
            <select name="region" className={fieldClass} value={region} onChange={(event) => setRegion(event.target.value)}>
              {REGIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>Note for the studio</span>
            <textarea name="note" rows={3} className={fieldClass} placeholder="Optional. A gate code, or a hem request." />
          </label>
        </div>
        <fieldset>
          <legend className={labelClass}>Mobile Money</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {channels.map((item) => (
              <label key={item} className={`cursor-pointer border px-3 py-3 text-sm ${channel === item ? "border-ink bg-ink text-ivory" : "border-line bg-paper"}`}>
                <input className="sr-only" type="radio" name="channel" checked={channel === item} onChange={() => setChannel(item)} />
                {channelLabel[item]}
              </label>
            ))}
          </div>
          <label className="mt-4 block">
            <span className={labelClass}>MoMo number</span>
            <input name="momoNumber" required placeholder="024 000 0000" className={fieldClass} />
          </label>
        </fieldset>
        {error && <p className="text-sm text-wine">{error}</p>}
        <button className={btn("wine")} disabled={pending} type="submit">
          {pending ? "Placing the order…" : `Pay ${formatGhs(total)} with Moolre`}
        </button>
      </div>
      <aside className="h-fit border border-line bg-paper p-5">
        <h2 className="font-display text-3xl">Your order</h2>
        <ul className="mt-4 space-y-4">
          {lines.map((line) => (
            <li key={`${line.productId}-${line.size}-${line.color}`} className="flex gap-3 text-sm">
              <img src={line.image} alt="" className="h-20 w-16 object-cover" />
              <div className="flex-1">
                <p>{line.name}</p>
                <p className="text-muted">
                  {line.color} · {line.size} · {line.qty}
                </p>
              </div>
              <p>{formatGhs(line.price * line.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatGhs(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{shipping === 0 ? "Complimentary" : formatGhs(shipping)}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt>Total</dt>
            <dd>{formatGhs(total)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-muted">
          Greater Accra is GH₵25, and complimentary over GH₵{FREE_ACCRA_OVER}. Other regions are GH₵45. You will approve the amount on your phone.
        </p>
      </aside>
    </form>
  );
}
