import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getOrderByToken } from "@/db/commerce";
import { formatPrice } from "@/features/catalog/products";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lorem Ipsum | Dolor Sit Amet" };

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getOrderByToken(token);
  if (!result) notFound();
  const order = result.order as {
    order_number: string;
    status: string;
    payment_status: string;
    subtotal: number;
    discount: number;
    total: number;
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
          <div><dt>Consectetur</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
        <a className="primary-link" href="/account">Lorem ipsum</a>
      </main>
    </div>
  );
}
