const labels: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Preparing",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
  pending: "Pending",
  otp_required: "OTP needed",
  prompt_sent: "Approve on phone",
  failed: "Failed",
};

export function StatusPill({ value }: { value: string }) {
  const quiet = value === "paid" || value === "delivered";
  const alert = value === "payment_failed" || value === "failed" || value === "cancelled";
  const tone = quiet ? "bg-moss/10 text-moss" : alert ? "bg-wine/10 text-wine" : "bg-gold/15 text-[#6d5428]";
  return <span className={`inline-flex px-2 py-1 text-[11px] tracking-[0.12em] uppercase ${tone}`}>{labels[value] ?? value}</span>;
}
