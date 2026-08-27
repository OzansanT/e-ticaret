import type { Metadata } from "next";
import Link from "next/link";
import { Gift, MapPin, PackageCheck, UserRound } from "lucide-react";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { getAccountData } from "@/db/commerce";
import { formatPrice } from "@/features/catalog/products";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lorem Ipsum | Dolor Sit Amet" };

export default async function AccountPage() {
  const user = await requireChatGPTUser("/account");
  const account = await getAccountData(user.email);

  return (
    <div className="commerce-page">
      <header className="commerce-header"><Link className="brand" href="/"><span className="brand__mark">◐</span><span><strong>Lorem Ipsum</strong><small>Dolor sit amet.</small></span></Link><a href={chatGPTSignOutPath("/")}>Lorem ipsum</a></header>
      <main className="account-page">
        <header><UserRound aria-hidden="true" /><span className="eyebrow">Lorem ipsum</span><h1>{user.displayName}</h1><p>{user.email}</p></header>
        <section className="account-stats">
          <article><Gift aria-hidden="true" /><span>Lorem ipsum</span><strong>{account.points}</strong></article>
          <article><PackageCheck aria-hidden="true" /><span>Dolor sit</span><strong>{account.orders.length}</strong></article>
          <article><MapPin aria-hidden="true" /><span>Amet elit</span><strong>{account.addresses.length}</strong></article>
        </section>
        <section className="account-panel"><div className="section-heading"><div><span className="eyebrow">Lorem ipsum</span><h2>Dolor sit amet.</h2></div></div>{account.orders.length === 0 ? <p className="account-empty">Lorem ipsum dolor sit amet.</p> : <div className="account-order-list">{account.orders.map((order) => <a href={`/orders/${order.public_token}`} key={order.order_number}><span><strong>{order.order_number}</strong><small>{order.created_at}</small></span><span>{order.status}</span><strong>{formatPrice(order.total)}</strong></a>)}</div>}</section>
        <section className="account-panel"><div className="section-heading"><div><span className="eyebrow">Consectetur elit</span><h2>Sed do eiusmod.</h2></div></div>{account.addresses.length === 0 ? <p className="account-empty">Lorem ipsum dolor sit amet.</p> : <div className="address-grid">{account.addresses.map((address) => <article key={address.id}><strong>{address.label}</strong><p>{address.recipient_name}</p><p>{address.line_1}</p><p>{address.city} {address.postal_code}</p></article>)}</div>}</section>
        <section className="referral-card"><span>Lorem ipsum</span><h2>Dolor sit amet.</h2><code>{account.referralCode ?? "LOREM-IPSUM"}</code><p>Consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p></section>
      </main>
    </div>
  );
}
