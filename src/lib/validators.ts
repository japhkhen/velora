import { z } from "zod";
import { REGIONS } from "@/lib/shipping";

const regionSchema = z
  .string()
  .refine((value): value is (typeof REGIONS)[number] => (REGIONS as readonly string[]).includes(value), {
    message: "Choose a region in Ghana.",
  });

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the name for the order.").max(80),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().min(10, "Enter a Ghana phone number."),
  address: z.string().trim().min(4, "Enter a delivery address.").max(160),
  city: z.string().trim().min(2, "Enter a city.").max(60),
  region: regionSchema,
  note: z.string().trim().max(300).optional().or(z.literal("")),
  channel: z.enum(["13", "6", "7"]),
  momoNumber: z.string().trim().min(10, "Enter the Mobile Money number."),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        size: z.string().min(1),
        color: z.string().min(1),
        qty: z.number().int().positive().max(5),
      }),
    )
    .min(1, "Your bag is empty."),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().min(10, "Enter a Ghana phone number."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Write a short message.").max(1000),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
