# Velora

Accra fashion house for women's and men's dresses and shoes. Shoppers browse the edit, pay with Mobile Money, and the studio desk manages stock, orders, and messages.

The app is Next.js (App Router, TypeScript) with Tailwind. Supabase holds the database, accounts, and product photographs when it is configured. Moolre collects MTN MoMo, Telecel Cash, and AT Money. Resend sends the email. Taysend sends the SMS.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Until the keys in `.env.local` are set, the shop uses a local database file and a demo Mobile Money approval on the order page. That path still reserves stock and writes the email and SMS records.

Studio desk: `admin@velora.gh` / `VeloraAdmin#25`

## Connect the required services

1. Copy `.env.example` to `.env.local`.
2. In Supabase, run `supabase/schema.sql` in the SQL editor. Create a public Storage bucket named `products` if the script could not. Turn off email confirmation while you are testing accounts.
3. Put the Supabase URL, anon key, and service role key in `.env.local`. The first launch copies the dress and shoe catalogue into Postgres.
4. In Moolre, set the payment callback to `https://YOUR-DOMAIN/api/payments/moolre` and copy the username, public key, account number, and webhook secret.
5. In Resend, verify a sender and set `RESEND_API_KEY` and `RESEND_FROM`.
6. In Taysend, set `TAYSEND_API_KEY`, an approved `TAYSEND_SENDER_ID`, and `TAYSEND_WEBHOOK_SECRET`. Point webhooks at `https://YOUR-DOMAIN/api/sms/taysend`.

The studio is in Accra, Ghana. Telephone: 025 620 6383 and 055 314 0985.

## Backend routes

- `GET /api/products` — public catalogue
- `GET /api/orders/[orderNumber]/status?t=` — payment status for the person who placed the order
- `POST /api/payments/moolre` — Moolre webhook
- `POST /api/sms/taysend` — Taysend delivery webhook
