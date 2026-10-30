"use client";

import { useActionState } from "react";
import { saveProductAction } from "@/actions/admin";
import { btn, fieldClass, labelClass } from "@/components/ui";
import type { Product } from "@/lib/types";

export function ProductForm({ product }: { product?: Product }) {
  const [state, action] = useActionState(saveProductAction, { error: "" });
  return (
    <form action={action} encType="multipart/form-data" className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <label className="md:col-span-2">
        <span className={labelClass}>Name</span>
        <input name="name" required defaultValue={product?.name} className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>For</span>
        <select name="gender" defaultValue={product?.gender ?? "women"} className={fieldClass}>
          <option value="women">Women</option>
          <option value="men">Men</option>
        </select>
      </label>
      <label>
        <span className={labelClass}>Kind</span>
        <select name="category" defaultValue={product?.category ?? "dresses"} className={fieldClass}>
          <option value="dresses">Dresses</option>
          <option value="tops">Tops</option>
          <option value="outfits">Outfits</option>
          <option value="shoes">Shoes</option>
        </select>
      </label>
      <label>
        <span className={labelClass}>Price (GHS)</span>
        <input name="price" type="number" min="1" step="0.01" required defaultValue={product?.price} className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Compare at</span>
        <input name="compareAt" type="number" min="0" step="0.01" defaultValue={product?.compareAt ?? ""} className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Stock</span>
        <input name="stock" type="number" min="0" step="1" required defaultValue={product?.stock ?? 0} className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>SKU</span>
        <input name="sku" defaultValue={product?.sku} className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Sizes, comma separated</span>
        <input name="sizes" required defaultValue={product?.sizes.join(", ")} className={fieldClass} />
      </label>
      <label>
        <span className={labelClass}>Colours, comma separated</span>
        <input name="colors" required defaultValue={product?.colors.join(", ")} className={fieldClass} />
      </label>
      <label className="md:col-span-2">
        <span className={labelClass}>Description</span>
        <textarea name="description" required rows={3} defaultValue={product?.description} className={fieldClass} />
      </label>
      <label className="md:col-span-2">
        <span className={labelClass}>Details and care</span>
        <textarea name="details" required rows={3} defaultValue={product?.details} className={fieldClass} />
      </label>
      <label className="md:col-span-2">
        <span className={labelClass}>Image URL</span>
        <input name="image" defaultValue={product?.images[0]} placeholder="/products/osu-silk.jpg or https://" className={fieldClass} />
      </label>
      <label className="md:col-span-2">
        <span className={labelClass}>Or upload a photograph</span>
        <input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="featured" type="checkbox" defaultChecked={product?.featured} />
        Feature on the home page
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="active" type="checkbox" defaultChecked={product?.active ?? true} />
        Visible in the shop
      </label>
      {state.error && <p className="text-sm text-wine md:col-span-2">{state.error}</p>}
      <div>
        <button className={btn()} type="submit">
          Save piece
        </button>
      </div>
    </form>
  );
}
