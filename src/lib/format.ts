import type { Category, Gender, MomoChannel, OrderStatus, PaymentStatus } from "@/lib/types";

export function formatGhs(amount: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatGhsPlain(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  }).format(new Date(iso));
}

export function genderLabel(gender: Gender) {
  return gender === "women" ? "Women" : "Men";
}

export function categoryLabel(category: Category) {
  switch (category) {
    case "dresses":
      return "Dresses";
    case "tops":
      return "Tops";
    case "outfits":
      return "Outfits";
    case "shoes":
      return "Shoes";
  }
}

export function isCategory(value: string | null | undefined): value is Category {
  return value === "dresses" || value === "tops" || value === "outfits" || value === "shoes";
}

export const channelLabel: Record<MomoChannel, string> = {
  "13": "MTN MoMo",
  "6": "Telecel Cash",
  "7": "AT Money",
};

export function orderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "pending_payment":
      return "Awaiting payment";
    case "paid":
      return "Paid";
    case "processing":
      return "Preparing";
    case "shipped":
      return "On the way";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "payment_failed":
      return "Payment failed";
  }
}

export function paymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "otp_required":
      return "OTP needed";
    case "prompt_sent":
      return "Approve on phone";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
  }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
