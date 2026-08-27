"use client";

import { useState } from "react";
import { ArrowLeft, Check, PackageCheck, Plus, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartProvider, useCart } from "@/features/cart/cart-context";
import { CartSheet } from "@/features/cart/cart-sheet";
import { formatPrice, type Product } from "./products";
import { CommerceTracker } from "@/features/engagement/commerce-tracker";
import type { CampaignRule } from "@/db/catalog";
import type { ProductReviewSummary } from "@/db/reviews";
import { ProductReviews } from "./product-reviews";

function ProductDetailContent({ product, reviews, signedIn, signInUrl }: { product: Product; reviews: ProductReviewSummary; signedIn: boolean; signInUrl: string }) {
  const cart = useCart();
  const [variantId, setVariantId] = useState(product.variants?.find((variant) => variant.stock > 0)?.id ?? product.variants?.[0]?.id ?? "");
  const selectedVariant = product.variants?.find((variant) => variant.id === variantId);
  const availableStock = selectedVariant?.stock ?? product.stock;
  const displayPrice = selectedVariant?.price ?? product.price;

  return (
    <div className="commerce-page">
      <header className="commerce-header">
        <Link className="brand" href="/" aria-label="Lorem ipsum">
          <span className="brand__mark">◐</span>
          <span><strong>Lorem Ipsum</strong><small>Dolor sit amet.</small></span>
        </Link>
        <CartSheet />
      </header>
      <main className="product-detail">
        <nav className="commerce-breadcrumb" aria-label="Lorem ipsum">
          <Link href="/"><ArrowLeft aria-hidden="true" /> Lorem ipsum</Link>
          <span>/</span>
          <span>{product.shortName}</span>
        </nav>
        <section className="product-detail__grid">
          <div className="product-detail__visual" style={{ "--product-accent": product.accent } as React.CSSProperties}>
            {/* Merchant-managed R2 images are already optimized before upload. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt={product.name} />
            <span>{product.sku}</span>
          </div>
          <div className="product-detail__copy">
            <span className="eyebrow">{product.eyebrow}</span>
            <h1>{product.name}</h1>
            <p className="product-detail__lead">{product.longDescription}</p>
            {product.variants?.length ? <fieldset className="product-variants"><legend>Lorem ipsum</legend><div>{product.variants.map((variant) => <button type="button" key={variant.id} aria-pressed={variant.id === variantId} disabled={variant.stock === 0} onClick={() => setVariantId(variant.id)}>{variant.label}</button>)}</div></fieldset> : null}
            <div className="product-detail__stock">
              <PackageCheck aria-hidden="true" />
              <span>{availableStock > 0 ? `${availableStock} lorem ipsum` : "Dolor sit amet"}</span>
            </div>
            <ul>
              {product.features.map((feature) => <li key={feature}><Check aria-hidden="true" /> {feature}</li>)}
            </ul>
            <div className="product-detail__buy">
              <div><small>Lorem ipsum</small><strong>{formatPrice(displayPrice)}</strong></div>
              <Button onClick={() => cart.add(product, selectedVariant)} disabled={availableStock === 0 || Boolean(product.variants?.length && !selectedVariant)}>
                <Plus aria-hidden="true" /> {availableStock === 0 ? "Dolor sit" : "Lorem ipsum"}
              </Button>
            </div>
            <div className="product-detail__trust">
              <span><Truck aria-hidden="true" /><strong>Lorem ipsum</strong><small>Dolor sit amet</small></span>
              <span><ShieldCheck aria-hidden="true" /><strong>Consectetur elit</strong><small>Sed do eiusmod</small></span>
            </div>
          </div>
        </section>
        <ProductReviews productSlug={product.slug} summary={reviews} signedIn={signedIn} signInUrl={signInUrl} />
      </main>
      <CommerceTracker productId={product.id} />
    </div>
  );
}

export function ProductDetail({ product, campaigns, reviews, signedIn, signInUrl }: { product: Product; campaigns: CampaignRule[]; reviews: ProductReviewSummary; signedIn: boolean; signInUrl: string }) {
  return <CartProvider catalog={[product]} campaigns={campaigns}><ProductDetailContent product={product} reviews={reviews} signedIn={signedIn} signInUrl={signInUrl} /></CartProvider>;
}
