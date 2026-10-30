import { CheckoutForm } from "@/components/checkout-form";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="font-display text-6xl">Checkout</h1>
      <p className="mt-3 max-w-xl text-muted">
        Pay with MTN MoMo, Telecel Cash, or AT Money through Moolre. You approve the amount on your phone.
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
