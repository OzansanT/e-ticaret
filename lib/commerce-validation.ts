import { z } from "zod";

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(80),
  quantity: z.number().int().min(1).max(20),
});

export const checkoutSchema = z.object({
  email: z.string().email().max(200),
  checkoutKey: z.string().trim().min(8).max(100),
  shippingMethodId: z.string().trim().min(1).max(80).default("lorem-standard"),
  couponCode: z.string().trim().max(40).optional().default(""),
  referralCode: z.string().trim().max(60).optional().default(""),
  cartId: z.string().trim().max(100).optional().default(""),
  lines: z.array(cartLineSchema).min(1).max(30),
  address: z.object({
    label: z.string().trim().min(1).max(60),
    recipientName: z.string().trim().min(2).max(120),
    line1: z.string().trim().min(3).max(240),
    line2: z.string().trim().max(240).optional().default(""),
    city: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().min(3).max(20),
    countryCode: z.string().trim().length(2).default("TR"),
    phone: z.string().trim().min(7).max(30),
    save: z.boolean().default(true),
  }),
});

export const analyticsEventSchema = z.object({
  sessionId: z.string().min(8).max(100),
  name: z.enum(["page_view", "product_view", "add_to_cart", "begin_checkout", "order_created"]),
  path: z.string().min(1).max(500),
  properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().default({}),
});

export const abandonedCartSchema = z.object({
  cartId: z.string().min(8).max(100),
  email: z.string().email().max(200).optional().nullable(),
  subtotal: z.number().int().min(0).max(10_000_000),
  lines: z.array(cartLineSchema).min(1).max(30),
});

export const productAdminSchema = z.object({
  id: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  sku: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(160),
  shortName: z.string().trim().min(1).max(80),
  size: z.string().trim().min(1).max(80),
  price: z.number().int().min(0).max(10_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  imageUrl: z.string().trim().max(500),
  category: z.enum(["Lorem Ipsum", "Dolor Sit", "Amet Elit", "Tempor Incididunt"]),
  eyebrow: z.string().trim().min(1).max(100),
  description: z.string().trim().min(2).max(500),
  longDescription: z.string().trim().min(2).max(2000),
  features: z.tuple([z.string().min(1).max(120), z.string().min(1).max(120), z.string().min(1).max(120)]),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  badge: z.string().trim().max(40).optional().default(""),
  active: z.boolean().default(true),
});

export const campaignAdminSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(2).max(120),
  kind: z.enum(["percentage", "fixed", "threshold", "quantity"]),
  value: z.number().int().min(0).max(100_000),
  threshold: z.number().int().min(0).max(10_000_000),
  minimumItems: z.number().int().min(0).max(100),
  active: z.boolean().default(true),
});

export const couponAdminSchema = z.object({
  id: z.string().min(1).max(80),
  code: z.string().trim().toUpperCase().min(3).max(40),
  kind: z.enum(["percentage", "fixed"]),
  value: z.number().int().min(1).max(100_000),
  minimumSubtotal: z.number().int().min(0).max(10_000_000),
  usageLimit: z.number().int().min(1).max(10_000_000).nullable(),
  active: z.boolean().default(true),
});

export const shippingAdminSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  name: z.string().trim().min(2).max(120),
  price: z.number().int().min(0).max(1_000_000),
  freeAbove: z.number().int().min(0).max(10_000_000).nullable(),
  estimatedDays: z.string().trim().min(1).max(80),
  active: z.boolean().default(true),
});

export const taxAdminSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  rateBasisPoints: z.number().int().min(0).max(10_000),
  active: z.boolean().default(true),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(100),
  body: z.string().trim().min(10).max(1200),
});

export const orderCustomerActionSchema = z.object({
  action: z.literal("cancel"),
  reason: z.string().trim().min(3).max(500),
});

export const adminActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("product"), product: productAdminSchema }),
  z.object({ action: z.literal("campaign"), campaign: campaignAdminSchema }),
  z.object({ action: z.literal("coupon"), coupon: couponAdminSchema }),
  z.object({ action: z.literal("shipping"), shipping: shippingAdminSchema }),
  z.object({ action: z.literal("tax"), tax: taxAdminSchema }),
  z.object({
    action: z.literal("refund"),
    orderNumber: z.string().min(3).max(80),
    amount: z.number().int().min(1).max(10_000_000),
    reason: z.string().trim().min(3).max(500),
  }),
  z.object({
    action: z.literal("reviewStatus"),
    reviewId: z.string().min(1).max(100),
    status: z.enum(["pending", "approved", "rejected"]),
  }),
  z.object({ action: z.literal("seed") }),
  z.object({
    action: z.literal("orderStatus"),
    orderNumber: z.string().min(3).max(80),
    status: z.enum(["pending", "processing", "fulfilled", "cancelled"]),
  }),
]);
