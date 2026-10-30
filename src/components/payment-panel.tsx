"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { demoPayAction, otpAction, retryPayAction } from "@/actions/storefront";
import { btn, fieldClass, labelClass } from "@/components/ui";
import type { PaymentStatus } from "@/lib/types";

export function PaymentPanel({
  orderNumber,
  token,
  paymentStatus,
  orderStatus,
  demo,
}: {
  orderNumber: string;
  token: string;
  paymentStatus: PaymentStatus;
  orderStatus: string;
  demo: boolean;
}) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (paymentStatus === "paid" || paymentStatus === "failed" || orderStatus === "cancelled") return;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/orders/${orderNumber}/status?t=${encodeURIComponent(token)}`);
      if (!response.ok) return;
      const data = (await response.json()) as { paymentStatus?: PaymentStatus };
      if (data.paymentStatus && data.paymentStatus !== paymentStatus) router.refresh();
    }, 4000);
    return () => clearInterval(timer);
  }, [orderNumber, orderStatus, paymentStatus, router, token]);

  async function approve() {
    setPending(true);
    const result = await demoPayAction(orderNumber, token);
    setPending(false);
    if (!result.ok) setMessage(result.error);
    else router.refresh();
  }

  async function sendOtp(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await otpAction(orderNumber, token, otp);
    setPending(false);
    if (!result.ok) setMessage(result.error);
    else {
      setMessage(result.message);
      router.refresh();
    }
  }

  async function retry() {
    setPending(true);
    const result = await retryPayAction(orderNumber, token);
    setPending(false);
    if (!result.ok) setMessage(result.error);
    else {
      setMessage(result.message);
      router.refresh();
    }
  }

  if (paymentStatus === "paid") {
    return <p className="mt-6 border border-moss/30 bg-moss/10 px-4 py-3 text-sm text-moss">Payment is confirmed. The studio has the order.</p>;
  }

  if (orderStatus === "cancelled") {
    return <p className="mt-6 text-sm text-muted">This order was cancelled.</p>;
  }

  return (
    <div className="mt-6 border border-line bg-paper p-5">
      <h2 className="font-display text-3xl">Payment</h2>
      {paymentStatus === "otp_required" && (
        <form onSubmit={sendOtp} className="mt-4 space-y-3">
          <label>
            <span className={labelClass}>OTP from Mobile Money</span>
            <input value={otp} onChange={(event) => setOtp(event.target.value)} className={fieldClass} inputMode="numeric" />
          </label>
          <button className={btn()} disabled={pending} type="submit">
            {pending ? "Sending…" : "Submit OTP"}
          </button>
        </form>
      )}
      {demo && paymentStatus !== "failed" && paymentStatus !== "otp_required" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-6 text-muted">
            Moolre keys are not in this environment, so the prompt stays inside the studio. Approving here records the payment, sends the email and SMS steps, and keeps the stock reservation.
          </p>
          <button className={btn("wine")} type="button" disabled={pending} onClick={approve}>
            {pending ? "Approving…" : "Approve demo Mobile Money payment"}
          </button>
        </div>
      )}
      {!demo && paymentStatus === "prompt_sent" && (
        <p className="mt-4 text-sm leading-6">Approve the prompt on the Mobile Money phone. This page updates when Moolre confirms it.</p>
      )}
      {(paymentStatus === "failed" || paymentStatus === "pending") && (
        <button className={`${btn("line")} mt-4`} type="button" disabled={pending} onClick={retry}>
          {pending ? "Retrying…" : "Try the payment again"}
        </button>
      )}
      {message && <p className="mt-3 text-sm text-wine">{message}</p>}
    </div>
  );
}
