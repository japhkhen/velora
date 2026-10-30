"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { advanceOrder, cancelOrder, CommerceError } from "@/lib/commerce";
import { store } from "@/lib/db";
import { slugify } from "@/lib/format";
import { storeProductImage } from "@/lib/uploads";
import type { Category, Gender, Product } from "@/lib/types";

function refreshShop() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/orders");
}

export async function saveProductAction(_prev: { error: string }, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return { error: "The studio desk is for staff." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const category = String(formData.get("category") ?? "") as Category;
  const gender = String(formData.get("gender") ?? "") as Gender;
  const price = Number(formData.get("price"));
  const compareRaw = String(formData.get("compareAt") ?? "").trim();
  const compareAt = compareRaw ? Number(compareRaw) : null;
  const stock = Number(formData.get("stock"));
  const sizes = String(formData.get("sizes") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const colors = String(formData.get("colors") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  let image = String(formData.get("image") ?? "").trim();
  const skuInput = String(formData.get("sku") ?? "").trim();

  if (name.length < 2) return { error: "Enter a product name." };
  if (description.length < 10) return { error: "Write a short description." };
  if (details.length < 10) return { error: "Add care or fit details." };
  if (category !== "dresses" && category !== "tops" && category !== "outfits" && category !== "shoes") {
    return { error: "Choose dresses, tops, outfits, or shoes." };
  }
  if (gender !== "women" && gender !== "men") return { error: "Choose women or men." };
  if (!Number.isFinite(price) || price <= 0) return { error: "Enter a price in Ghana cedis." };
  if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt < price)) {
    return { error: "The compare price should be higher than the selling price, or left blank." };
  }
  if (!Number.isInteger(stock) || stock < 0) return { error: "Stock must be a whole number." };
  if (!sizes.length || !colors.length) return { error: "Add at least one size and one colour." };

  try {
    const file = formData.get("imageFile");
    if (file instanceof File && file.size > 0) {
      image = (await storeProductImage(file)) ?? image;
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not store the image." };
  }
  if (!image) return { error: "Add an image URL or upload a photograph." };

  const db = store();
  const id = String(formData.get("id") ?? "");
  const existing = id ? await db.getProductById(id) : null;
  const products = await db.listProducts();
  let slug = existing?.slug || slugify(name);
  if (!slug) slug = `piece-${products.length + 1}`;
  if (products.some((product) => product.slug === slug && product.id !== existing?.id)) {
    slug = `${slug}-${products.length + 1}`;
  }
  const skuPrefix = category === "dresses" ? "DRS" : category === "tops" ? "TOP" : category === "outfits" ? "OUT" : "SHO";
  let sku = skuInput || existing?.sku || `VL-${skuPrefix}-${String(products.length + 1).padStart(3, "0")}`;
  if (products.some((product) => product.sku.toLowerCase() === sku.toLowerCase() && product.id !== existing?.id)) {
    sku = `${sku}-${products.length + 1}`;
  }

  const product: Product = {
    id: existing?.id ?? crypto.randomUUID(),
    slug,
    name,
    description,
    details,
    category,
    gender,
    price,
    compareAt,
    images: [image],
    sizes,
    colors,
    stock,
    sku,
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  await db.saveProduct(product);
  if (!existing) {
    await db.addMovement({
      id: crypto.randomUUID(),
      productId: product.id,
      delta: product.stock,
      reason: "opening",
      orderId: null,
      note: "Added to the studio",
      createdAt: new Date().toISOString(),
    });
  } else if (existing.stock !== product.stock) {
    await db.addMovement({
      id: crypto.randomUUID(),
      productId: product.id,
      delta: product.stock - existing.stock,
      reason: "adjustment",
      orderId: null,
      note: "Stock edited with the product",
      createdAt: new Date().toISOString(),
    });
  }

  refreshShop();
  redirect(`/admin/products/${product.id}?saved=1`);
}

export async function archiveProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const db = store();
  const product = await db.getProductById(id);
  if (!product) redirect("/admin/products");
  await db.saveProduct({ ...product, active: false });
  refreshShop();
  redirect("/admin/products");
}

export async function adjustStockAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("delta"));
  const note = String(formData.get("note") ?? "").trim() || "Studio adjustment";
  if (!Number.isInteger(delta) || delta === 0) {
    redirect(`/admin/inventory?error=${encodeURIComponent("Enter a whole number other than zero.")}`);
  }
  try {
    await store().adjustStock(id, delta);
    await store().addMovement({
      id: crypto.randomUUID(),
      productId: id,
      delta,
      reason: "adjustment",
      orderId: null,
      note,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    redirect(`/admin/inventory?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not adjust stock.")}`);
  }
  refreshShop();
  redirect("/admin/inventory");
}

export async function orderDeskAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "");
  try {
    if (intent === "cancel") await cancelOrder(id);
    else if (intent === "processing" || intent === "shipped" || intent === "delivered") {
      await advanceOrder(id, intent);
    } else throw new CommerceError("Choose a status.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the order.";
    redirect(`/admin/orders/${id}?error=${encodeURIComponent(message)}`);
  }
  refreshShop();
  redirect(`/admin/orders/${id}`);
}
