"use client";

import { useActionState } from "react";
import { contactAction } from "@/actions/storefront";
import { btn, fieldClass, labelClass } from "@/components/ui";

export function ContactForm() {
  const [state, action] = useActionState(contactAction, { error: "", ok: false });
  if (state.ok) {
    return <p className="border border-moss/30 bg-moss/10 px-4 py-3 text-sm text-moss">The studio has your message. We read it in Accra.</p>;
  }
  return (
    <form action={action} className="space-y-4">
      <label>
        <span className={labelClass}>Name</span>
        <input name="name" required className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Email</span>
        <input name="email" type="email" required className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Phone</span>
        <input name="phone" className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Message</span>
        <textarea name="message" required minLength={10} rows={5} className={fieldClass} />
      </label>
      {state.error && <p className="text-sm text-wine">{state.error}</p>}
      <button className={btn()} type="submit">
        Send to the studio
      </button>
    </form>
  );
}
