import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByToken } from "@/db/commerce";
import { formatPrice } from "@/features/catalog/products";
import { PrintButton } from "@/features/checkout/print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lorem Ipsum | Dolor Sit Amet", robots: { index: false, follow: false } };

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getOrderByToken(token);
  if (!result) notFound();
  const order = result.order as { order_number: string; subtotal: number; discount: number; shipping_total: number; tax_total: number; total: number; email: string; shipping_address: string; created_at: string };
  let address: Record<string, unknown> = {};
  try { address = JSON.parse(order.shipping_address) as Record<string, unknown>; } catch { address = {}; }
  return (
    <main className="invoice-page">
      <header><Link className="brand" href="/"><span className="brand__mark">◐</span><span><strong>Lorem Ipsum</strong><small>Dolor sit amet.</small></span></Link><PrintButton /></header>
      <section className="invoice-heading"><div><span className="eyebrow">Lorem ipsum</span><h1>Dolor sit amet.</h1></div><dl><div><dt>Lorem</dt><dd>{order.order_number}</dd></div><div><dt>Ipsum</dt><dd>{order.created_at.slice(0, 10)}</dd></div></dl></section>
      <section className="invoice-parties"><article><span>Lorem ipsum</span><strong>{String(address.recipientName ?? "Lorem Ipsum")}</strong><p>{String(address.line1 ?? "Lorem ipsum")}</p><p>{String(address.city ?? "Lorem")} {String(address.postalCode ?? "")}</p></article><article><span>Dolor sit</span><strong>{order.email}</strong><p>Consectetur adipiscing elit.</p></article></section>
      <div className="invoice-lines"><div className="invoice-row invoice-row--head"><span>Lorem ipsum</span><span>Dolor</span><span>Amet</span><span>Consectetur</span></div>{result.items.map((item) => { const line = item as { sku: string; name: string; unit_price: number; quantity: number }; return <div className="invoice-row" key={`${line.sku}-${line.quantity}`}><span><strong>{line.name}</strong><small>{line.sku}</small></span><span>{line.quantity}</span><span>{formatPrice(line.unit_price)}</span><span>{formatPrice(line.unit_price * line.quantity)}</span></div>; })}</div>
      <dl className="invoice-totals"><div><dt>Lorem ipsum</dt><dd>{formatPrice(order.subtotal)}</dd></div><div><dt>Dolor sit</dt><dd>−{formatPrice(order.discount)}</dd></div><div><dt>Amet elit</dt><dd>{formatPrice(order.shipping_total)}</dd></div><div><dt>Consectetur</dt><dd>{formatPrice(order.tax_total)}</dd></div><div><dt>Adipiscing</dt><dd>{formatPrice(order.total)}</dd></div></dl>
      <footer>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</footer>
    </main>
  );
}
