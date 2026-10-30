import { live } from "@/lib/catalog-service";
import { store } from "@/lib/db";
import { formatWhen } from "@/lib/format";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  await live();
  const messages = await store().listMessages();
  return (
    <div>
      <h1 className="font-display text-5xl">Messages</h1>
      <ul className="mt-6 space-y-4">
        {messages.length === 0 && <li className="text-sm text-muted">No messages yet.</li>}
        {messages.map((message) => (
          <li key={message.id} className="border border-line bg-paper p-4">
            <p className="text-sm">
              {message.name} · {message.email}
              {message.phone ? ` · ${message.phone}` : ""}
            </p>
            <p className="mt-2 text-sm leading-6">{message.message}</p>
            <p className="mt-2 text-xs text-muted">{formatWhen(message.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
