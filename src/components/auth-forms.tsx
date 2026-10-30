"use client";

import { useActionState } from "react";
import { loginAction, registerAction } from "@/actions/storefront";
import { btn, fieldClass, labelClass } from "@/components/ui";

export function LoginForm({ next, showDemo }: { next: string; showDemo: boolean }) {
  const [state, action] = useActionState(loginAction, { error: "" });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label>
        <span className={labelClass}>Email</span>
        <input name="email" type="email" required className={fieldClass} autoComplete="email" />
      </label>
      <label>
        <span className={labelClass}>Password</span>
        <input name="password" type="password" required className={fieldClass} autoComplete="current-password" />
      </label>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button className={btn()} type="submit">
        Sign in
      </button>
      {showDemo && (
        <p className="text-sm leading-6 text-muted">
          Studio desk demo: admin@velora.gh / VeloraAdmin#25
        </p>
      )}
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, { error: "" });
  return (
    <form action={action} className="space-y-4">
      <label>
        <span className={labelClass}>Full name</span>
        <input name="fullName" required className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Email</span>
        <input name="email" type="email" required className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Phone</span>
        <input name="phone" required placeholder="055 314 0985" className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Password</span>
        <input name="password" type="password" required minLength={8} className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Confirm password</span>
        <input name="confirm" type="password" required minLength={8} className={fieldClass} />
      </label>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button className={btn()} type="submit">
        Create account
      </button>
    </form>
  );
}
