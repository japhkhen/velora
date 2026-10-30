import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "Velora · Dresses, outfits, and sneakers in Accra",
    template: "%s · Velora",
  },
  description:
    "Velora is an Accra fashion house for dresses, men's outfits and T-shirts, ladies' wear, and Nike sneakers. Pay with Mobile Money, or call 025 620 6383 or 055 314 0985.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
