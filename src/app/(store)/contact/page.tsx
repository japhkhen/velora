import { ContactForm } from "@/components/contact-form";
import { brand } from "@/lib/brand";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 md:grid-cols-2 md:px-6">
      <div>
        <h1 className="font-display text-6xl">Contact the studio</h1>
        <p className="mt-4 leading-7 text-muted">
          Ask about a size, a ceremony date, or an order already placed. The desk reads every message.
        </p>
        <div className="mt-8 space-y-2 text-lg">
          <p>{brand.location}</p>
          {brand.phones.map((phone) => (
            <p key={phone.tel}>
              <a href={`tel:${phone.tel}`}>{phone.display}</a>
            </p>
          ))}
          <p>{brand.hours}</p>
          <p>
            <a className="underline" href={`mailto:${brand.email}`}>
              {brand.email}
            </a>
          </p>
        </div>
      </div>
      <ContactForm />
    </div>
  );
}
