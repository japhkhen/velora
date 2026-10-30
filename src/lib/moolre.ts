import { timingSafeEqual } from "crypto";
import type { MomoChannel } from "@/lib/types";

export type MoolreOutcome = {
  outcome: "otp" | "prompt" | "error";
  message: string;
};

type MoolreBody = {
  status?: number | string;
  code?: string;
  message?: string | null;
};

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function initiateMobileMoney(input: {
  channel: MomoChannel;
  payer: string;
  amount: number;
  externalRef: string;
  otpCode?: string;
}): Promise<MoolreOutcome> {
  const response = await fetch("https://api.moolre.com/open/transact/payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-USER": process.env.MOOLRE_USERNAME ?? "",
      "X-API-PUBKEY": process.env.MOOLRE_PUBLIC_KEY ?? "",
    },
    body: JSON.stringify({
      type: 1,
      channel: input.channel,
      currency: "GHS",
      payer: input.payer,
      amount: input.amount.toFixed(2),
      externalref: input.externalRef,
      accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
      ...(input.otpCode ? { otpcode: input.otpCode } : {}),
      ...(process.env.MOOLRE_SKIP_OTP === "true" ? { skipotp: true } : {}),
    }),
  });

  const body = (await response.json().catch(() => ({}))) as MoolreBody;
  if (body.code === "TP14") {
    return {
      outcome: "otp",
      message: body.message || "Enter the OTP sent to the Mobile Money number, then submit again.",
    };
  }
  if (body.code === "TP13") {
    return {
      outcome: "prompt",
      message: "This payment is already in progress. Approve the prompt on the phone.",
    };
  }
  if (Number(body.status) === 1) {
    return {
      outcome: "prompt",
      message: "A Mobile Money prompt has been sent. Approve it with your PIN.",
    };
  }
  return {
    outcome: "error",
    message: body.message || "Moolre could not start this payment.",
  };
}

export type MoolreWebhook = {
  status?: number;
  code?: string;
  message?: string;
  data?: {
    txstatus?: number;
    externalref?: string;
    transactionid?: string | null;
    amount?: string;
    secret?: string;
    reason?: string;
    payer?: string;
  };
};
