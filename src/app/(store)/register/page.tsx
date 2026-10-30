import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 md:px-6">
      <h1 className="font-display text-6xl">Create an account</h1>
      <p className="mt-3 text-sm text-muted">Use it to see orders placed with the same email.</p>
      <div className="mt-8">
        <RegisterForm />
      </div>
      <p className="mt-6 text-sm">
        Already registered? <Link href="/login" className="underline">Sign in</Link>
      </p>
    </div>
  );
}
