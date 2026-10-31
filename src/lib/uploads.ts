import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isSupabaseConfigured } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase";

export async function storeProductImage(file: File) {
  if (!file || file.size === 0) return null;
  if (file.size > 4 * 1024 * 1024) throw new Error("Use an image under 4 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Use a JPG, PNG, or WebP image.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "").slice(-48);
  const name = `${crypto.randomUUID()}-${safe || "image"}`;

  if (isSupabaseConfigured()) {
    const supabase = getServiceClient();
    if (!supabase) throw new Error("Supabase storage is not available.");
    const { error } = await supabase.storage.from("products").upload(name, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return supabase.storage.from("products").getPublicUrl(name).data.publicUrl;
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
  } catch {
    throw new Error("The live site cannot store new photos until Supabase storage is connected.");
  }
  return `/uploads/${name}`;
}
