import { connection } from "next/server";
import { store } from "@/lib/db";
import type { Product, ProductQuery } from "@/lib/types";

export async function live() {
  await connection();
}

export async function queryProducts(query: ProductQuery = {}) {
  await live();
  let products = await store().listProducts();
  if (!query.includeInactive) products = products.filter((product) => product.active);

  if (query.gender === "women" || query.gender === "men") {
    products = products.filter((product) => product.gender === query.gender);
  }
  if (query.category === "dresses" || query.category === "tops" || query.category === "outfits" || query.category === "shoes") {
    products = products.filter((product) => product.category === query.category);
  }

  const q = query.q?.trim().toLowerCase();
  if (q) {
    products = products.filter((product) =>
      [product.name, product.description, product.sku, product.colors.join(" "), product.category, product.gender]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  const sort = query.sort ?? "featured";
  products.sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "newest") return a.createdAt < b.createdAt ? 1 : -1;
    return Number(b.featured) - Number(a.featured) || (a.createdAt < b.createdAt ? 1 : -1);
  });
  return products;
}

export async function getPublicProduct(slug: string): Promise<Product | null> {
  await live();
  const product = await store().getProductBySlug(slug);
  if (!product || !product.active) return null;
  return product;
}
