"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, LockKeyhole, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CartProvider, useCart } from "@/features/cart/cart-context";
import { formatPrice, type Product } from "@/features/catalog/products";
import type { CampaignRule } from "@/db/catalog";
import type { ShippingMethod, TaxRate } from "@/db/commerce-config";
import { CommerceTracker, createBrowserId, readCartId, readReferralCode, rotateCartId, trackCommerceEvent } from "@/features/engagement/commerce-tracker";

function CheckoutContent({ initialEmail, shippingMethods, taxRate }: { initialEmail: string; shippingMethods: ShippingMethod[]; taxRate: TaxRate }) {
  const cart = useCart();
  const [email, setEmail] = useState(initialEmail);
  const [couponCode, setCouponCode] = useState("");
  const [save, setSave] = useState(true);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");
  const [shippingMethodId, setShippingMethodId] = useState(shippingMethods[0]?.id ?? "lorem-standard");
  const checkoutKey = useRef("");
  const selectedShipping = shippingMethods.find((method) => method.id === shippingMethodId) ?? shippingMethods[0];
  const shippingTotal = selectedShipping?.freeAbove !== null && selectedShipping?.freeAbove !== undefined && cart.subtotal >= selectedShipping.freeAbove
    ? 0
    : selectedShipping?.price ?? 0;
  const taxTotal = Math.round((cart.total + shippingTotal) * (taxRate.rateBasisPoints / 10_000));
  const estimatedTotal = cart.total + shippingTotal + taxTotal;

  useEffect(() => {
    trackCommerceEvent("begin_checkout", { items: cart.itemCount, subtotal: cart.subtotal });
  }, [cart.itemCount, cart.subtotal]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cart.lines.length === 0) return;
    setStatus("submitting");
    setMessage("");
    if (!checkoutKey.current) checkoutKey.current = `${readCartId()}-${createBrowserId()}`;
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          checkoutKey: checkoutKey.current,
          shippingMethodId,
          couponCode,
          referralCode: readReferralCode(),
          cartId: readCartId(),
          lines: cart.lines.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          address: {
            label: String(form.get("label") ?? "Lorem"),
            recipientName: String(form.get("recipientName") ?? ""),
            line1: String(form.get("line1") ?? ""),
            line2: String(form.get("line2") ?? ""),
            city: String(form.get("city") ?? ""),
            postalCode: String(form.get("postalCode") ?? ""),
            countryCode: "TR",
            phone: String(form.get("phone") ?? ""),
            save,
          },
        }),
      });
      const result = await response.json() as { token?: string; total?: number; error?: string };
      if (!response.ok || !result.token) throw new Error(result.error ?? "Lorem ipsum dolor sit amet.");
      trackCommerceEvent("order_created", { items: cart.itemCount, total: result.total ?? estimatedTotal });
      cart.clear();
      rotateCartId();
      window.location.assign(`/orders/${result.token}`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lorem ipsum dolor sit amet.");
    }
  }

  return (
    <div className="commerce-page">
      <header className="commerce-header">
        <Link className="brand" href="/" aria-label="Lorem ipsum">
          <span className="brand__mark">◐</span>
          <span><strong>Lorem Ipsum</strong><small>Dolor sit amet.</small></span>
        </Link>
        <span className="checkout-secure"><LockKeyhole aria-hidden="true" /> Lorem ipsum</span>
      </header>
      <main className="checkout-layout">
        <section className="checkout-form-card">
          <Link className="commerce-back" href="/"><ArrowLeft aria-hidden="true" /> Lorem ipsum</Link>
          <span className="eyebrow">Lorem ipsum dolor</span>
          <h1>Sit amet consectetur.</h1>
          {cart.lines.length === 0 ? (
            <div className="checkout-empty"><ShoppingBag aria-hidden="true" /><p>Lorem ipsum dolor sit amet.</p><Link href="/">Consectetur elit</Link></div>
          ) : (
            <form onSubmit={submit}>
              <fieldset>
                <legend>Lorem ipsum</legend>
                <label><span>Lorem ipsum</span><Input name="recipientName" required placeholder="Lorem ipsum" autoComplete="name" /></label>
                <label><span>Dolor sit amet</span><Input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="lorem@example.com" autoComplete="email" /></label>
                <label><span>Consectetur elit</span><Input name="phone" required placeholder="000 000 00 00" autoComplete="tel" /></label>
              </fieldset>
              <fieldset>
                <legend>Dolor sit amet</legend>
                <label><span>Lorem ipsum</span><Input name="label" defaultValue="Lorem" required /></label>
                <label className="checkout-field--wide"><span>Consectetur adipiscing</span><Input name="line1" required placeholder="Lorem ipsum dolor sit amet" autoComplete="address-line1" /></label>
                <label className="checkout-field--wide"><span>Sed do eiusmod</span><Input name="line2" placeholder="Tempor incididunt" autoComplete="address-line2" /></label>
                <label><span>Ut labore</span><Input name="city" required placeholder="Lorem ipsum" autoComplete="address-level2" /></label>
                <label><span>Dolore magna</span><Input name="postalCode" required placeholder="00000" autoComplete="postal-code" /></label>
                <label className="checkout-save"><Checkbox checked={save} onCheckedChange={(value) => setSave(Boolean(value))} /> <span>Lorem ipsum dolor sit amet.</span></label>
              </fieldset>
              <fieldset>
                <legend>Consectetur elit</legend>
                <label className="checkout-field--wide"><span>Lorem ipsum</span><Input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="LOREM50" /></label>
              </fieldset>
              <fieldset>
                <legend>Lorem ipsum dolor</legend>
                <div className="shipping-options checkout-field--wide">
                  {shippingMethods.map((method) => {
                    const price = method.freeAbove !== null && cart.subtotal >= method.freeAbove ? 0 : method.price;
                    return <label key={method.id} className="shipping-option"><input type="radio" name="shippingMethod" value={method.id} checked={shippingMethodId === method.id} onChange={() => setShippingMethodId(method.id)} /><span><strong>{method.name}</strong><small>{method.estimatedDays}</small></span><b>{price === 0 ? "Lorem" : formatPrice(price)}</b></label>;
                  })}
                </div>
              </fieldset>
              {message && <p className="form-message" role="alert">{message}</p>}
              <Button className="checkout-submit" size="lg" disabled={status === "submitting"}>
                {status === "submitting" ? "Lorem ipsum…" : "Dolor sit amet"}
              </Button>
            </form>
          )}
        </section>
        <aside className="order-summary" aria-label="Lorem ipsum">
          <h2>Lorem ipsum</h2>
          <div className="order-summary__lines">
            {cart.lines.map(({ product, quantity }) => (
              <article key={product.id}>
                {/* Merchant-managed R2 images are already optimized before upload. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.imageUrl} alt="" />
                <div><strong>{product.shortName}</strong><small>{product.sku} · {quantity}</small></div>
                <span>{formatPrice(product.price * quantity)}</span>
              </article>
            ))}
          </div>
          <dl>
            <div><dt>Lorem ipsum</dt><dd>{formatPrice(cart.subtotal)}</dd></div>
            <div><dt>{cart.campaign.name}</dt><dd>−{formatPrice(cart.campaign.discount)}</dd></div>
            <div><dt>Dolor sit amet</dt><dd>{shippingTotal === 0 ? "Lorem" : formatPrice(shippingTotal)}</dd></div>
            <div><dt>{taxRate.name}</dt><dd>{formatPrice(taxTotal)}</dd></div>
            <div><dt>Consectetur elit</dt><dd>{formatPrice(estimatedTotal)}</dd></div>
          </dl>
          <p><Check aria-hidden="true" /> Lorem ipsum dolor sit amet consectetur.</p>
        </aside>
      </main>
      <CommerceTracker />
    </div>
  );
}

export function CheckoutFlow({ catalog, campaigns, initialEmail, shippingMethods, taxRate }: { catalog: Product[]; campaigns: CampaignRule[]; initialEmail: string; shippingMethods: ShippingMethod[]; taxRate: TaxRate }) {
  return <CartProvider catalog={catalog} campaigns={campaigns}><CheckoutContent initialEmail={initialEmail} shippingMethods={shippingMethods} taxRate={taxRate} /></CartProvider>;
}
