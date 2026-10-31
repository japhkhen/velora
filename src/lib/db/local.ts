import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { catalog } from "@/lib/catalog";
import { demoAdmin } from "@/lib/brand";
import { hashPassword } from "@/lib/password";
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

type Database = {
  users: LocalUser[];
  products: Product[];
  orders: Order[];
  items: OrderItem[];
  payments: Payment[];
  movements: StockMovement[];
  notifications: Notice[];
  messages: ContactMessage[];
  webhooks: { provider: string; key: string }[];
};

const bundledPath = path.join(process.cwd(), "data", "store.json");
const filePath = process.env.VERCEL ? path.join("/tmp", "velora-store.json") : bundledPath;

let memory: Database | null = null;
let loading: Promise<Database> | null = null;

function queue() {
  const g = globalThis as typeof globalThis & { __veloraQueue?: Promise<unknown> };
  return g;
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const g = queue();
  const prev = g.__veloraQueue ?? Promise.resolve();
  const run = prev.then(fn, fn);
  g.__veloraQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ensureSeed(db: Database | null): Promise<Database> {
  if (db) return db;
  const passwordHash = await hashPassword(demoAdmin.password);
  const createdAt = new Date().toISOString();
  const products = catalog.map((product) => ({ ...product }));
  const movements: StockMovement[] = products.map((product) => ({
    id: crypto.randomUUID(),
    productId: product.id,
    delta: product.stock,
    reason: "opening",
    orderId: null,
    note: "Opening studio stock",
    createdAt: product.createdAt,
  }));
  return {
    users: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        email: demoAdmin.email,
        fullName: demoAdmin.fullName,
        phone: demoAdmin.phone,
        role: "admin",
        passwordHash,
        createdAt,
      },
    ],
    products,
    orders: [],
    items: [],
    payments: [],
    movements,
    notifications: [],
    messages: [],
    webhooks: [],
  };
}

function mergeCatalog(db: Database) {
  let changed = false;
  for (const product of catalog) {
    if (db.products.some((item) => item.id === product.id)) continue;
    db.products.push({ ...product });
    db.movements.unshift({
      id: crypto.randomUUID(),
      productId: product.id,
      delta: product.stock,
      reason: "opening",
      orderId: null,
      note: "Opening studio stock",
      createdAt: product.createdAt,
    });
    changed = true;
  }
  return changed;
}

async function readFileIfPresent(target: string) {
  try {
    return JSON.parse(await readFile(target, "utf8")) as Database;
  } catch {
    return null;
  }
}

async function load(): Promise<Database> {
  const runtime = await readFileIfPresent(filePath);
  const saved = runtime ?? (filePath === bundledPath ? null : await readFileIfPresent(bundledPath));
  if (saved) {
    const changed = mergeCatalog(saved);
    memory = saved;
    if (changed || !runtime) await write(saved);
    return saved;
  }
  const seeded = await ensureSeed(null);
  memory = seeded;
  await write(seeded);
  return seeded;
}

async function read(): Promise<Database> {
  if (memory) return memory;
  loading ??= load().finally(() => {
    loading = null;
  });
  return loading;
}

async function write(db: Database) {
  memory = db;
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(db, null, 2), "utf8");
  } catch {
    // Vercel’s project disk is read-only. This instance still serves the in-memory catalog.
  }
}

function publicUser(user: LocalUser): UserPublic {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export const localStore = {
  mode: "local" as const,

  async listProducts() {
    const db = await read();
    return db.products;
  },

  async getProductById(id: string) {
    const db = await read();
    return db.products.find((product) => product.id === id) ?? null;
  },

  async getProductBySlug(slug: string) {
    const db = await read();
    return db.products.find((product) => product.slug === slug) ?? null;
  },

  async saveProduct(product: Product) {
    await withLock(async () => {
      const db = await read();
      const index = db.products.findIndex((item) => item.id === product.id);
      if (index >= 0) db.products[index] = product;
      else db.products.unshift(product);
      await write(db);
    });
  },

  async adjustStock(productId: string, delta: number) {
    return withLock(async () => {
      const db = await read();
      const product = db.products.find((item) => item.id === productId);
      if (!product) throw new Error("That piece is no longer in the studio.");
      const next = product.stock + delta;
      if (next < 0) throw new Error(`${product.name} does not have enough stock.`);
      product.stock = next;
      await write(db);
      return product;
    });
  },

  async listUsers() {
    const db = await read();
    return db.users.map(publicUser);
  },

  async getUser(id: string) {
    const db = await read();
    const user = db.users.find((item) => item.id === id);
    return user ? publicUser(user) : null;
  },

  async findLocalUserByEmail(email: string) {
    const db = await read();
    return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  },

  async insertLocalUser(user: LocalUser) {
    await withLock(async () => {
      const db = await read();
      if (db.users.some((item) => item.email.toLowerCase() === user.email.toLowerCase())) {
        throw new Error("An account with that email already exists.");
      }
      db.users.push(user);
      await write(db);
    });
  },

  async listOrders() {
    const db = await read();
    return [...db.orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async getOrderByNumber(orderNumber: string) {
    const db = await read();
    return db.orders.find((order) => order.number === orderNumber) ?? null;
  },

  async getOrderByExternalRef(ref: string) {
    const db = await read();
    return db.orders.find((order) => order.externalRef === ref) ?? null;
  },

  async createCheckout(input: {
    order: Order;
    items: OrderItem[];
    reservations: { productId: string; qty: number }[];
  }) {
    await withLock(async () => {
      const db = await read();
      for (const reservation of input.reservations) {
        const product = db.products.find((item) => item.id === reservation.productId);
        if (!product || product.stock < reservation.qty) {
          throw new Error(`${product?.name ?? "A piece"} does not have enough stock.`);
        }
      }
      for (const reservation of input.reservations) {
        const product = db.products.find((item) => item.id === reservation.productId)!;
        product.stock -= reservation.qty;
        db.movements.unshift({
          id: crypto.randomUUID(),
          productId: product.id,
          delta: -reservation.qty,
          reason: "reserve",
          orderId: input.order.id,
          note: `Reserved for ${input.order.number}`,
          createdAt: input.order.createdAt,
        });
      }
      db.orders.unshift(input.order);
      db.items.push(...input.items);
      db.payments.unshift({
        id: crypto.randomUUID(),
        orderId: input.order.id,
        provider: "moolre",
        externalRef: input.order.externalRef,
        amount: input.order.total,
        status: "pending",
        channel: input.order.paymentChannel,
        detail: "Awaiting Mobile Money approval",
        transactionId: null,
        createdAt: input.order.createdAt,
      });
      await write(db);
    });
  },

  async updateOrder(id: string, patch: Partial<Order>) {
    await withLock(async () => {
      const db = await read();
      const order = db.orders.find((item) => item.id === id);
      if (!order) throw new Error("Order not found.");
      Object.assign(order, patch, { updatedAt: new Date().toISOString() });
      await write(db);
    });
  },

  async listOrderItems(orderId: string) {
    const db = await read();
    return db.items.filter((item) => item.orderId === orderId);
  },

  async listAllItems() {
    const db = await read();
    return db.items;
  },

  async listMovements() {
    const db = await read();
    return [...db.movements].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async addMovement(movement: StockMovement) {
    await withLock(async () => {
      const db = await read();
      db.movements.unshift(movement);
      await write(db);
    });
  },

  async listPayments(orderId: string) {
    const db = await read();
    return db.payments.filter((payment) => payment.orderId === orderId);
  },

  async updateLatestPayment(orderId: string, patch: Partial<Payment>) {
    await withLock(async () => {
      const db = await read();
      const payment = db.payments.find((item) => item.orderId === orderId);
      if (!payment) return;
      Object.assign(payment, patch);
      await write(db);
    });
  },

  async listNotifications(orderId?: string) {
    const db = await read();
    const rows = orderId
      ? db.notifications.filter((notice) => notice.orderId === orderId)
      : db.notifications;
    return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async addNotification(notice: Notice) {
    await withLock(async () => {
      const db = await read();
      db.notifications.unshift(notice);
      await write(db);
    });
  },

  async findNotificationByProvider(providerId: string) {
    const db = await read();
    return db.notifications.find((notice) => notice.providerId === providerId) ?? null;
  },

  async updateNotification(id: string, patch: Partial<Notice>) {
    await withLock(async () => {
      const db = await read();
      const notice = db.notifications.find((item) => item.id === id);
      if (!notice) return;
      Object.assign(notice, patch);
      await write(db);
    });
  },

  async listMessages() {
    const db = await read();
    return [...db.messages].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async addMessage(message: ContactMessage) {
    await withLock(async () => {
      const db = await read();
      db.messages.unshift(message);
      await write(db);
    });
  },

  async rememberWebhook(provider: string, key: string) {
    return withLock(async () => {
      const db = await read();
      if (db.webhooks.some((event) => event.provider === provider && event.key === key)) return false;
      db.webhooks.push({ provider, key });
      await write(db);
      return true;
    });
  },
};
