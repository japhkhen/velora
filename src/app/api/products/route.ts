import { NextResponse } from "next/server";
import { queryProducts } from "@/lib/catalog-service";
import { isCategory } from "@/lib/format";
import type { Gender } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gender = searchParams.get("gender") as Gender | null;
  const category = searchParams.get("category");
  const products = await queryProducts({
    q: searchParams.get("q") ?? "",
    gender: gender === "women" || gender === "men" ? gender : "",
    category: isCategory(category) ? category : "",
    sort: (searchParams.get("sort") as "featured" | "newest" | "price-asc" | "price-desc" | null) ?? "featured",
  });
  return NextResponse.json({
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      gender: product.gender,
      price: product.price,
      compareAt: product.compareAt,
      image: product.images[0] ?? null,
      sizes: product.sizes,
      colors: product.colors,
      stock: product.stock,
      sku: product.sku,
    })),
  });
}
