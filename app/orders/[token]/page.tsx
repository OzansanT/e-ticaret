import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Printer } from "lucide-react";
import { notFound } from "next/navigation";
import { getOrderByToken } from "@/db/commerce";
import { formatPrice } from "@/features/catalog/products";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { OrderActions } from "@/features/checkout/order-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lorem Ipsum | Dolor Sit Amet" };

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [result, user] = await Promise.all([getOrderByToken(token), getChatGPTUser()]);
  if (!result) notFound();
  const order = result.order as {
    order_number: string;
    status: string;
    payment_status: string;
    subtotal: number;
    discount: number;
    shipping_total: number;
    tax_total: number;
    total: number;
    email: string;
    created_at: string;
  };

  return (
    <div className="commerce-page">
      <header className="commerce-header"><Link className="brand" href="/"><span className="brand__mark">◐</span><span><strong>Lorem Ipsum</strong><small>Dolor sit amet.</small></span></Link></header>
      <main className="order-confirmation">
        <CheckCircle2 aria-hidden="true" />
        <span className="eyebrow">Lorem ipsum dolor</span>
        <h1>Sit amet consectetur.</h1>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</p>
        <dl>
          <div><dt>Lorem ipsum</dt><dd>{order.order_number}</dd></div>
          <div><dt>Dolor sit</dt><dd>{order.status}</dd></div>
          <div><dt>Amet elit</dt><dd>{order.payment_status}</dd></div>
          <div><dt>Consectetur</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div><dt>Adipiscing</dt><dd>−{formatPrice(order.discount)}</dd></div>
          <div><dt>Sed do eiusmod</dt><dd>{formatPrice(order.shipping_total)}</dd></div>
          <div><dt>Tempor incididunt</dt><dd>{formatPrice(order.tax_total)}</dd></div>
          <div><dt>Ut labore</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
        <div className="order-line-items">{result.items.map((item) => { const line = item as { sku: string; name: string; unit_price: number; quantity: number }; return <article key={`${line.sku}-${line.quantity}`}><span><strong>{line.name}</strong><small>{line.sku} · {line.quantity}</small></span><b>{formatPrice(line.unit_price * line.quantity)}</b></article>; })}</div>
        <div className="order-links"><a className="primary-link" href="/account">Lorem ipsum</a><a className="secondary-link" href={`/orders/${token}/invoice`}><Printer aria-hidden="true" /> Dolor sit</a></div>
        {user?.email.toLowerCase() === order.email.toLowerCase() && order.status === "pending" && order.payment_status === "pending" ? <OrderActions token={token} /> : null}
      </main>
    </div>
  );
}
