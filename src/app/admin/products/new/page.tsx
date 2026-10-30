import { ProductForm } from "@/components/product-form";

export const metadata = { title: "New piece" };

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-display text-5xl">New piece</h1>
      <div className="mt-8 max-w-3xl">
        <ProductForm />
      </div>
    </div>
  );
}
