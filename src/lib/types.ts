export type Gender = "women" | "men";
export type Category = "dresses" | "tops" | "outfits" | "shoes";
export type Role = "admin" | "customer";
export type MomoChannel = "13" | "6" | "7";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "payment_failed";

export type PaymentStatus =
  | "pending"
  | "otp_required"
  | "prompt_sent"
  | "paid"
  | "failed";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string;
  category: Category;
  gender: Gender;
  price: number;
  compareAt: number | null;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  sku: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
};

export type UserPublic = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  createdAt: string;
};

export type LocalUser = UserPublic & { passwordHash: string };

export type Order = {
  id: string;
  number: string;
  accessToken: string;
  userId: string | null;
  email: string;
  phone: string;
  fullName: string;
  address: string;
  city: string;
  region: string;
  note: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentChannel: MomoChannel;
  momoNumber: string;
  externalRef: string;
  moolreTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
};

export type StockReason = "opening" | "reserve" | "release" | "sale" | "adjustment";

export type StockMovement = {
  id: string;
  productId: string;
  delta: number;
  reason: StockReason;
  orderId: string | null;
  note: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  orderId: string;
  provider: "moolre";
  externalRef: string;
  amount: number;
  status: PaymentStatus;
  channel: MomoChannel;
  detail: string;
  transactionId: string | null;
  createdAt: string;
};

export type NoticeKind = "order_paid" | "order_shipped" | "payment_failed";

export type Notice = {
  id: string;
  orderId: string | null;
  channel: "email" | "sms";
  kind: NoticeKind;
  to: string;
  status: "sent" | "skipped" | "failed";
  providerId: string | null;
  detail: string;
  createdAt: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
};

export type CartLineInput = {
  productId: string;
  size: string;
  color: string;
  qty: number;
};

export type ProductQuery = {
  q?: string;
  gender?: Gender | "";
  category?: Category | "";
  sort?: "featured" | "newest" | "price-asc" | "price-desc";
  includeInactive?: boolean;
};
