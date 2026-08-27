"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { BarChart3, Boxes, Megaphone, PackageCheck, RefreshCw, RotateCcw, Star, TicketPercent, Truck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, type Product } from "@/features/catalog/products";

type Metrics = { orders?: number; revenue?: number; abandoned?: number; events?: number; pending_reviews?: number; refunds?: number };
type AdminOrder = { order_number: string; email: string; status: string; payment_status: string; total: number; created_at: string };
type AdminReview = { id: string; rating: number; title: string; body: string; status: string; product_name: string; email: string };
type AdminRefund = { id: string; order_number: string; amount: number; status: string; reason: string };
type DashboardData = { products: Product[]; campaigns: Array<Record<string, unknown>>; coupons: Array<Record<string, unknown>>; orders: AdminOrder[]; shipping: Array<Record<string, unknown>>; taxes: Array<Record<string, unknown>>; reviews: AdminReview[]; refunds: AdminRefund[]; metrics: Metrics };

const emptyProduct: Product = {
  id: "lorem-new",
  slug: "lorem-ipsum-novum",
  sku: "LRM-NEW",
  name: "Lorem Ipsum Novum",
  shortName: "Lorem New",
  size: "Lorem 01",
  price: 100,
  stock: 10,
  imageUrl: "/product-placeholder.svg",
  category: "Lorem Ipsum",
  eyebrow: "Lorem Ipsum",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  longDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
  features: ["Lorem ipsum dolor", "Sit amet consectetur", "Adipiscing elit sed"],
  accent: "#ff7b00",
  badge: "Lorem",
};

export function AdminDashboard({ initialProducts }: { initialProducts: Product[] }) {
  const [data, setData] = useState<DashboardData>({ products: initialProducts, campaigns: [], coupons: [], orders: [], shipping: [], taxes: [], reviews: [], refunds: [], metrics: {} });
  const [product, setProduct] = useState<Product>(initialProducts[0] ?? emptyProduct);
  const [status, setStatus] = useState("Lorem ipsum");

  async function refresh() {
    const response = await fetch("/api/admin", { cache: "no-store" });
    if (response.ok) setData(await response.json() as DashboardData);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<DashboardData> : null)
      .then((result) => { if (result) setData(result); })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function post(body: unknown) {
    setStatus("Lorem ipsum…");
    const response = await fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setStatus(response.ok ? "Dolor sit amet" : "Consectetur elit");
    if (response.ok) await refresh();
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
    const result = await response.json() as { url?: string };
    if (response.ok && result.url) setProduct((current) => ({ ...current, imageUrl: result.url! }));
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    await post({ action: "product", product: { ...product, active: true } });
  }

  async function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await post({ action: "campaign", campaign: {
      id: String(form.get("id")), name: String(form.get("name")), kind: String(form.get("kind")),
      value: Number(form.get("value")), threshold: Number(form.get("threshold")),
      minimumItems: Number(form.get("minimumItems")), active: true,
    } });
  }

  async function saveCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await post({ action: "coupon", coupon: {
      id: String(form.get("id")), code: String(form.get("code")), kind: String(form.get("kind")),
      value: Number(form.get("value")), minimumSubtotal: Number(form.get("minimumSubtotal")),
      usageLimit: Number(form.get("usageLimit")) || null, active: true,
    } });
  }

  async function saveShipping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await post({ action: "shipping", shipping: { id: String(form.get("id")), name: String(form.get("name")), price: Number(form.get("price")), freeAbove: Number(form.get("freeAbove")) || null, estimatedDays: String(form.get("estimatedDays")), active: true } });
  }

  async function saveTax(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await post({ action: "tax", tax: { id: String(form.get("id")), countryCode: String(form.get("countryCode")), name: String(form.get("name")), rateBasisPoints: Number(form.get("rateBasisPoints")), active: true } });
  }

  async function requestRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await post({ action: "refund", orderNumber: String(form.get("orderNumber")), amount: Number(form.get("amount")), reason: String(form.get("reason")) });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-nav"><Link className="brand" href="/"><span className="brand__mark">◐</span><span><strong>Lorem Ipsum</strong><small>Dolor sit amet.</small></span></Link><nav><a href="#overview"><BarChart3 aria-hidden="true" /> Lorem ipsum</a><a href="#products"><Boxes aria-hidden="true" /> Dolor sit</a><a href="#orders"><PackageCheck aria-hidden="true" /> Ipsum dolor</a><a href="#fulfillment"><Truck aria-hidden="true" /> Amet elit</a><a href="#reviews"><Star aria-hidden="true" /> Consectetur</a><a href="#campaigns"><Megaphone aria-hidden="true" /> Adipiscing</a><a href="#coupons"><TicketPercent aria-hidden="true" /> Incididunt</a></nav></aside>
      <main className="admin-main">
        <header><div><span className="eyebrow">Lorem ipsum</span><h1>Dolor sit amet.</h1></div><Button variant="outline" onClick={() => void refresh()}><RefreshCw aria-hidden="true" /> Lorem ipsum</Button></header>
        <section className="admin-metrics" id="overview"><article><span>Lorem ipsum</span><strong>{data.metrics.orders ?? 0}</strong></article><article><span>Dolor sit</span><strong>{formatPrice(Number(data.metrics.revenue ?? 0))}</strong></article><article><span>Amet elit</span><strong>{data.metrics.abandoned ?? 0}</strong></article><article><span>Consectetur</span><strong>{data.metrics.pending_reviews ?? 0}</strong></article><article><span>Adipiscing</span><strong>{formatPrice(Number(data.metrics.refunds ?? 0))}</strong></article></section>
        <section className="admin-panel" id="products"><div className="admin-panel__heading"><div><span className="eyebrow">Lorem ipsum</span><h2>Dolor sit amet.</h2></div><select value={product.id} onChange={(event) => setProduct(data.products.find((item) => item.id === event.target.value) ?? emptyProduct)}>{data.products.map((item) => <option key={item.id} value={item.id}>{item.sku} · {item.shortName}</option>)}<option value={emptyProduct.id}>Lorem ipsum</option></select></div><form className="admin-form" onSubmit={saveProduct}>{(["id", "slug", "sku", "name", "shortName", "size", "eyebrow", "description", "longDescription", "imageUrl", "accent"] as const).map((key) => <label className={key === "description" || key === "longDescription" ? "admin-field--wide" : ""} key={key}><span>{key}</span><Input value={String(product[key] ?? "")} onChange={(event) => setProduct((current) => ({ ...current, [key]: event.target.value }))} required /></label>)}<label><span>price</span><Input type="number" min="0" value={product.price} onChange={(event) => setProduct((current) => ({ ...current, price: Number(event.target.value) }))} /></label><label><span>stock</span><Input type="number" min="0" value={product.stock} onChange={(event) => setProduct((current) => ({ ...current, stock: Number(event.target.value) }))} /></label><label><span>category</span><select value={product.category} onChange={(event) => setProduct((current) => ({ ...current, category: event.target.value as Product["category"] }))}><option>Lorem Ipsum</option><option>Dolor Sit</option><option>Amet Elit</option><option>Tempor Incididunt</option></select></label><label className="admin-upload"><span>image</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void upload(event.target.files?.[0])} /><Upload aria-hidden="true" /></label><Button type="submit">Lorem ipsum</Button></form></section>
        <section className="admin-panel" id="orders"><div className="admin-panel__heading"><div><span className="eyebrow">Ipsum dolor</span><h2>Lorem sit amet.</h2></div><span>{data.orders.length} lorem</span></div><div className="admin-order-list">{data.orders.length === 0 ? <p>Lorem ipsum dolor sit amet.</p> : data.orders.map((order) => <article key={order.order_number}><span><strong>{order.order_number}</strong><small>{order.email}</small></span><span>{formatPrice(order.total)}</span><select value={order.status} onChange={(event) => void post({ action: "orderStatus", orderNumber: order.order_number, status: event.target.value })}><option value="pending">Lorem ipsum</option><option value="processing">Dolor sit</option><option value="fulfilled">Amet elit</option><option value="cancelled">Consectetur</option>{order.status === "refunded" ? <option value="refunded" disabled>Adipiscing</option> : null}</select></article>)}</div></section>
        <section className="admin-panel" id="fulfillment"><div className="admin-panel__heading"><div><span className="eyebrow">Lorem ipsum</span><h2>Dolor sit amet.</h2></div><span>{data.shipping.length + data.taxes.length} lorem</span></div><div className="admin-split"><form className="admin-form" onSubmit={saveShipping}><label><span>id</span><Input name="id" defaultValue="lorem-standard" required /></label><label><span>name</span><Input name="name" defaultValue="Lorem ipsum" required /></label><label><span>price</span><Input name="price" type="number" defaultValue="49" /></label><label><span>freeAbove</span><Input name="freeAbove" type="number" defaultValue="750" /></label><label><span>estimatedDays</span><Input name="estimatedDays" defaultValue="2–4 lorem" /></label><Button type="submit"><Truck aria-hidden="true" /> Lorem</Button></form><form className="admin-form" onSubmit={saveTax}><label><span>id</span><Input name="id" defaultValue="tax-tr" required /></label><label><span>countryCode</span><Input name="countryCode" defaultValue="TR" required /></label><label><span>name</span><Input name="name" defaultValue="Lorem ipsum" required /></label><label><span>rateBasisPoints</span><Input name="rateBasisPoints" type="number" defaultValue="2000" /></label><Button type="submit">Ipsum</Button></form></div></section>
        <section className="admin-panel" id="refunds"><div className="admin-panel__heading"><div><span className="eyebrow">Dolor sit</span><h2>Amet consectetur.</h2></div><span>{data.refunds.length} lorem</span></div><form className="admin-form" onSubmit={requestRefund}><label><span>orderNumber</span><Input name="orderNumber" required /></label><label><span>amount</span><Input name="amount" type="number" min="1" required /></label><label><span>reason</span><Input name="reason" defaultValue="Lorem ipsum dolor sit amet." required /></label><Button type="submit"><RotateCcw aria-hidden="true" /> Lorem</Button></form><div className="admin-order-list">{data.refunds.map((refund) => <article key={refund.id}><span><strong>{refund.order_number}</strong><small>{refund.reason}</small></span><span>{formatPrice(refund.amount)}</span><b>{refund.status}</b></article>)}</div></section>
        <section className="admin-panel" id="reviews"><div className="admin-panel__heading"><div><span className="eyebrow">Amet elit</span><h2>Consectetur adipiscing.</h2></div><span>{data.reviews.length} lorem</span></div><div className="admin-review-list">{data.reviews.length === 0 ? <p>Lorem ipsum dolor sit amet.</p> : data.reviews.map((review) => <article key={review.id}><div><span>{"★".repeat(review.rating)}</span><strong>{review.title}</strong><p>{review.body}</p><small>{review.product_name} · {review.email}</small></div><select value={review.status} onChange={(event) => void post({ action: "reviewStatus", reviewId: review.id, status: event.target.value })}><option value="pending">Lorem</option><option value="approved">Ipsum</option><option value="rejected">Dolor</option></select></article>)}</div></section>
        <section className="admin-panel" id="campaigns"><div className="admin-panel__heading"><div><span className="eyebrow">Dolor sit</span><h2>Amet consectetur.</h2></div><span>{data.campaigns.length} lorem</span></div><form className="admin-form" onSubmit={saveCampaign}><label><span>id</span><Input name="id" defaultValue="campaign-lorem-new" required /></label><label><span>name</span><Input name="name" defaultValue="Lorem ipsum %15" required /></label><label><span>kind</span><select name="kind"><option value="percentage">percentage</option><option value="fixed">fixed</option><option value="threshold">threshold</option><option value="quantity">quantity</option></select></label><label><span>value</span><Input name="value" type="number" defaultValue="15" /></label><label><span>threshold</span><Input name="threshold" type="number" defaultValue="0" /></label><label><span>minimumItems</span><Input name="minimumItems" type="number" defaultValue="0" /></label><Button type="submit">Lorem ipsum</Button></form></section>
        <section className="admin-panel" id="coupons"><div className="admin-panel__heading"><div><span className="eyebrow">Amet elit</span><h2>Consectetur adipiscing.</h2></div><span>{data.coupons.length} lorem</span></div><form className="admin-form" onSubmit={saveCoupon}><label><span>id</span><Input name="id" defaultValue="coupon-lorem-new" required /></label><label><span>code</span><Input name="code" defaultValue="IPSUM20" required /></label><label><span>kind</span><select name="kind"><option value="percentage">percentage</option><option value="fixed">fixed</option></select></label><label><span>value</span><Input name="value" type="number" defaultValue="20" /></label><label><span>minimumSubtotal</span><Input name="minimumSubtotal" type="number" defaultValue="200" /></label><label><span>usageLimit</span><Input name="usageLimit" type="number" defaultValue="1000" /></label><Button type="submit">Lorem ipsum</Button></form></section>
        <output className="admin-status" aria-live="polite">{status}</output>
      </main>
    </div>
  );
}
