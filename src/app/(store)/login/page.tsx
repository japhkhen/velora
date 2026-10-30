import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-12 md:px-6">
      <h1 className="font-display text-6xl">Sign in</h1>
      <div className="mt-8">
        <LoginForm next={next} showDemo={!isSupabaseConfigured()} />
      </div>
      <p className="mt-6 text-sm">
        New to Velora? <Link href="/register" className="underline">Create an account</Link>
      </p>
    </div>
  );
}
