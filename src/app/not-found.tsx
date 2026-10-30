import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-6xl">This page is not in the house.</h1>
      <Link href="/shop" className="mt-6 inline-block text-sm underline">
        Return to the shop
      </Link>
    </div>
  );
}
