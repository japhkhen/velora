import { catalog } from "@/lib/catalog";
import { getServiceClient } from "@/lib/supabase";
import type {
  ContactMessage,
  LocalUser,
  Notice,
  Order,
  OrderItem,
  Payment,
  Product,
  StockMovement,
  UserPublic,
} from "@/lib/types";

type Row = Record<string, unknown>;

function num(value: unknown) {
  return Number(value ?? 0);
}

function productFrom(row: Row): Product {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    details: String(row.details ?? ""),
    category: row.category as Product["category"],
    gender: row.gender as Product["gender"],
    price: num(row.price),
    compareAt: row.compare_at == null ? null : num(row.compare_at),
    images: (row.images as string[]) ?? [],
    sizes: (row.sizes as string[]) ?? [],
    colors: (row.colors as string[]) ?? [],
    stock: num(row.stock),
    sku: String(row.sku),
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    createdAt: String(row.created_at),
  };
}

function productTo(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    details: product.details,
    category: product.category,
    gender: product.gender,
    price: product.price,
    compare_at: product.compareAt,
    images: product.images,
    sizes: product.sizes,
    colors: product.colors,
    stock: product.stock,
    sku: product.sku,
    featured: product.featured,
    active: product.active,
    created_at: product.createdAt,
  };
}

function userFrom(row: Row): UserPublic {
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    fullName: String(row.full_name ?? ""),
    phone: String(row.phone ?? ""),
    role: row.role === "admin" ? "admin" : "customer",
    createdAt: String(row.created_at),
  };
}

function orderFrom(row: Row): Order {
  return {
    id: String(row.id),
    number: String(row.number),
    accessToken: String(row.access_token),
    userId: row.user_id ? String(row.user_id) : null,
    email: String(row.email),
    phone: String(row.phone),
    fullName: String(row.full_name),
    address: String(row.address),
    city: String(row.city),
    region: String(row.region),
    note: String(row.note ?? ""),
    subtotal: num(row.subtotal),
    shipping: num(row.shipping),
    total: num(row.total),
    status: row.status as Order["status"],
    paymentStatus: row.payment_status as Order["paymentStatus"],
    paymentChannel: row.payment_channel as Order["paymentChannel"],
    momoNumber: String(row.momo_number),
    externalRef: String(row.external_ref),
    moolreTransactionId: row.moolre_transaction_id ? String(row.moolre_transaction_id) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function orderTo(order: Order) {
  return {
    id: order.id,
    number: order.number,
    access_token: order.accessToken,
    user_id: order.userId,
    email: order.email,
    phone: order.phone,
    full_name: order.fullName,
    address: order.address,
    city: order.city,
    region: order.region,
    note: order.note,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    status: order.status,
    payment_status: order.paymentStatus,
    payment_channel: order.paymentChannel,
    momo_number: order.momoNumber,
    external_ref: order.externalRef,
    moolre_transaction_id: order.moolreTransactionId,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

function itemFrom(row: Row): OrderItem {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    productId: String(row.product_id),
    name: String(row.name),
    slug: String(row.slug),
    image: String(row.image ?? ""),
    size: String(row.size),
    color: String(row.color),
    qty: num(row.qty),
    unitPrice: num(row.unit_price),
  };
}

function movementFrom(row: Row): StockMovement {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    delta: num(row.delta),
    reason: row.reason as StockMovement["reason"],
    orderId: row.order_id ? String(row.order_id) : null,
    note: String(row.note ?? ""),
    createdAt: String(row.created_at),
  };
}

function paymentFrom(row: Row): Payment {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    provider: "moolre",
    externalRef: String(row.external_ref),
    amount: num(row.amount),
    status: row.status as Payment["status"],
    channel: row.channel as Payment["channel"],
    detail: String(row.detail ?? ""),
    transactionId: row.transaction_id ? String(row.transaction_id) : null,
    createdAt: String(row.created_at),
  };
}

function noticeFrom(row: Row): Notice {
  return {
    id: String(row.id),
    orderId: row.order_id ? String(row.order_id) : null,
    channel: row.channel as Notice["channel"],
    kind: row.kind as Notice["kind"],
    to: String(row.to_address),
    status: row.status as Notice["status"],
    providerId: row.provider_id ? String(row.provider_id) : null,
    detail: String(row.detail ?? ""),
    createdAt: String(row.created_at),
  };
}

function messageFrom(row: Row): ContactMessage {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone ?? ""),
    message: String(row.message),
    createdAt: String(row.created_at),
  };
}

let ready: Promise<void> | null = null;

async function client() {
  const supabase = getServiceClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!ready) {
    ready = (async () => {
      const { error } = await supabase.from("products").select("id", { head: true, count: "exact" });
      if (error) {
        throw new Error(
          `Supabase is not ready. Run supabase/schema.sql in the SQL editor. ${error.message}`,
        );
      }
      const { data: existing, error: existingError } = await supabase.from("products").select("id");
      if (existingError) throw new Error(existingError.message);
      const have = new Set((existing ?? []).map((row) => String(row.id)));
      const missing = catalog.filter((product) => !have.has(product.id));
      if (missing.length) {
        const { error: insertError } = await supabase.from("products").insert(missing.map(productTo));
        if (insertError) throw new Error(insertError.message);
        const { error: moveError } = await supabase.from("inventory_movements").insert(
          missing.map((product) => ({
            id: crypto.randomUUID(),
            product_id: product.id,
            delta: product.stock,
            reason: "opening",
            note: "Opening studio stock",
            created_at: product.createdAt,
          })),
        );
        if (moveError) throw new Error(moveError.message);
      }
    })().catch((error: unknown) => {
      ready = null;
      throw error;
    });
  }
  await ready;
  return supabase;
}

function orderPatch(patch: Partial<Order>) {
  const row: Row = { updated_at: new Date().toISOString() };
  if (patch.status) row.status = patch.status;
  if (patch.paymentStatus) row.payment_status = patch.paymentStatus;
  if (patch.moolreTransactionId !== undefined) row.moolre_transaction_id = patch.moolreTransactionId;
  if (patch.note !== undefined) row.note = patch.note;
  return row;
}

export const supabaseStore = {
  mode: "supabase" as const,

  async listProducts() {
    const supabase = await client();
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => productFrom(row as Row));
  },

  async getProductById(id: string) {
    const supabase = await client();
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? productFrom(data as Row) : null;
  },

  async getProductBySlug(slug: string) {
    const supabase = await client();
    const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? productFrom(data as Row) : null;
  },

  async saveProduct(product: Product) {
    const supabase = await client();
    const { error } = await supabase.from("products").upsert(productTo(product));
    if (error) throw new Error(error.message);
  },

  async adjustStock(productId: string, delta: number) {
    const supabase = await client();
    const current = await this.getProductById(productId);
    if (!current) throw new Error("That piece is no longer in the studio.");
    const next = current.stock + delta;
    if (next < 0) throw new Error(`${current.name} does not have enough stock.`);
    const { data, error } = await supabase
      .from("products")
      .update({ stock: next })
      .eq("id", productId)
      .eq("stock", current.stock)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Stock changed while the order was being saved. Try again.");
    return productFrom(data as Row);
  },

  async listUsers() {
    const supabase = await client();
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => userFrom(row as Row));
  },

  async getUser(id: string) {
    const supabase = await client();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? userFrom(data as Row) : null;
  },

  async findLocalUserByEmail(_email: string): Promise<LocalUser | null> {
    return null;
  },

  async insertLocalUser(): Promise<void> {
    throw new Error("Accounts are created through Supabase Auth.");
  },

  async listOrders() {
    const supabase = await client();
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => orderFrom(row as Row));
  },

  async getOrderByNumber(orderNumber: string) {
    const supabase = await client();
    const { data, error } = await supabase.from("orders").select("*").eq("number", orderNumber).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? orderFrom(data as Row) : null;
  },

  async getOrderByExternalRef(ref: string) {
    const supabase = await client();
    const { data, error } = await supabase.from("orders").select("*").eq("external_ref", ref).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? orderFrom(data as Row) : null;
  },

  async createCheckout(input: {
    order: Order;
    items: OrderItem[];
    reservations: { productId: string; qty: number }[];
  }) {
    const reserved: { productId: string; qty: number }[] = [];
    try {
      for (const reservation of input.reservations) {
        await this.adjustStock(reservation.productId, -reservation.qty);
        reserved.push(reservation);
        await this.addMovement({
          id: crypto.randomUUID(),
          productId: reservation.productId,
          delta: -reservation.qty,
          reason: "reserve",
          orderId: input.order.id,
          note: `Reserved for ${input.order.number}`,
          createdAt: input.order.createdAt,
        });
      }
      const supabase = await client();
      const { error } = await supabase.from("orders").insert(orderTo(input.order));
      if (error) throw new Error(error.message);
      const { error: itemError } = await supabase.from("order_items").insert(
        input.items.map((item) => ({
          id: item.id,
          order_id: item.orderId,
          product_id: item.productId,
          name: item.name,
          slug: item.slug,
          image: item.image,
          size: item.size,
          color: item.color,
          qty: item.qty,
          unit_price: item.unitPrice,
        })),
      );
      if (itemError) throw new Error(itemError.message);
      const { error: payError } = await supabase.from("payments").insert({
        id: crypto.randomUUID(),
        order_id: input.order.id,
        provider: "moolre",
        external_ref: input.order.externalRef,
        amount: input.order.total,
        status: "pending",
        channel: input.order.paymentChannel,
        detail: "Awaiting Mobile Money approval",
        created_at: input.order.createdAt,
      });
      if (payError) throw new Error(payError.message);
    } catch (error) {
      const supabase = await client();
      await supabase.from("order_items").delete().eq("order_id", input.order.id);
      await supabase.from("payments").delete().eq("order_id", input.order.id);
      await supabase.from("orders").delete().eq("id", input.order.id);
      for (const reservation of reserved) {
        await this.adjustStock(reservation.productId, reservation.qty).catch(() => undefined);
      }
      throw error;
    }
  },

  async updateOrder(id: string, patch: Partial<Order>) {
    const supabase = await client();
    const { error } = await supabase.from("orders").update(orderPatch(patch)).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listOrderItems(orderId: string) {
    const supabase = await client();
    const { data, error } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => itemFrom(row as Row));
  },

  async listAllItems() {
    const supabase = await client();
    const { data, error } = await supabase.from("order_items").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => itemFrom(row as Row));
  },

  async listMovements() {
    const supabase = await client();
    const { data, error } = await supabase
      .from("inventory_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => movementFrom(row as Row));
  },

  async addMovement(movement: StockMovement) {
    const supabase = await client();
    const { error } = await supabase.from("inventory_movements").insert({
      id: movement.id,
      product_id: movement.productId,
      delta: movement.delta,
      reason: movement.reason,
      order_id: movement.orderId,
      note: movement.note,
      created_at: movement.createdAt,
    });
    if (error) throw new Error(error.message);
  },

  async listPayments(orderId: string) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => paymentFrom(row as Row));
  },

  async updateLatestPayment(orderId: string, patch: Partial<Payment>) {
    const payments = await this.listPayments(orderId);
    const latest = payments[0];
    if (!latest) return;
    const supabase = await client();
    const { error } = await supabase
      .from("payments")
      .update({
        status: patch.status ?? latest.status,
        detail: patch.detail ?? latest.detail,
        transaction_id: patch.transactionId === undefined ? latest.transactionId : patch.transactionId,
      })
      .eq("id", latest.id);
    if (error) throw new Error(error.message);
  },

  async listNotifications(orderId?: string) {
    const supabase = await client();
    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (orderId) query = query.eq("order_id", orderId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => noticeFrom(row as Row));
  },

  async addNotification(notice: Notice) {
    const supabase = await client();
    const { error } = await supabase.from("notifications").insert({
      id: notice.id,
      order_id: notice.orderId,
      channel: notice.channel,
      kind: notice.kind,
      to_address: notice.to,
      status: notice.status,
      provider_id: notice.providerId,
      detail: notice.detail,
      created_at: notice.createdAt,
    });
    if (error) throw new Error(error.message);
  },

  async findNotificationByProvider(providerId: string) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("provider_id", providerId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? noticeFrom(data as Row) : null;
  },

  async updateNotification(id: string, patch: Partial<Notice>) {
    const supabase = await client();
    const row: Row = {};
    if (patch.status) row.status = patch.status;
    if (patch.detail !== undefined) row.detail = patch.detail;
    if (patch.providerId !== undefined) row.provider_id = patch.providerId;
    const { error } = await supabase.from("notifications").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listMessages() {
    const supabase = await client();
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => messageFrom(row as Row));
  },

  async addMessage(message: ContactMessage) {
    const supabase = await client();
    const { error } = await supabase.from("contact_messages").insert({
      id: message.id,
      name: message.name,
      email: message.email,
      phone: message.phone,
      message: message.message,
      created_at: message.createdAt,
    });
    if (error) throw new Error(error.message);
  },

  async rememberWebhook(provider: string, key: string) {
    const supabase = await client();
    const { data } = await supabase
      .from("webhook_events")
      .select("id")
      .eq("provider", provider)
      .eq("event_key", key)
      .maybeSingle();
    if (data) return false;
    const { error } = await supabase.from("webhook_events").insert({
      id: crypto.randomUUID(),
      provider,
      event_key: key,
    });
    if (error) {
      if (error.code === "23505") return false;
      throw new Error(error.message);
    }
    return true;
  },
};
