"use client";

import { ArrowRight, Check, PackageCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categorySlug, formatPrice, type Product } from "./products";
import { useCart } from "@/features/cart/cart-context";

export function ProductGrid({ products }: { products: Product[] }) {
  const cart = useCart();

  if (products.length === 0) {
    return (
      <div className="catalog-empty">
        <h3>Lorem ipsum dolor sit amet.</h3>
        <p>Consectetur adipiscing elit, sed do eiusmod tempor.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <article
          className="product-card"
          key={product.id}
          style={{ "--product-accent": product.accent } as React.CSSProperties}
        >
          <div className="product-card__topline">
            <span>{product.eyebrow}</span>
            {product.badge && <strong>{product.badge}</strong>}
          </div>
          <div className="product-card__visual">
            <span className="product-card__number">0{index + 1}</span>
            {/* Merchant-managed R2 images are already optimized before upload. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt="" loading="lazy" />
          </div>
          <div className="product-card__body">
            <div className="product-card__meta">
              <a className="product-card__category" href={`/categories/${categorySlug(product.category)}`}>{product.category}</a>
              <span><PackageCheck aria-hidden="true" /> {product.sku}</span>
            </div>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <ul>
              <li><Check aria-hidden="true" /> Lorem ipsum dolor sit</li>
              <li><Check aria-hidden="true" /> Amet consectetur elit</li>
            </ul>
          </div>
          <div className="product-card__footer">
            <div>
              <small>Lorem ipsum</small>
              <strong>{formatPrice(product.price)}</strong>
            </div>
            <Button
              onClick={() => product.variants?.length ? window.location.assign(`/products/${product.slug}`) : cart.add(product)}
              aria-label={`Add ${product.shortName}`}
              disabled={product.stock === 0}
            >
              <Plus aria-hidden="true" /> {product.stock === 0 ? "Dolor sit" : "Lorem ipsum"}
            </Button>
          </div>
          <a className="product-card__details" href={`/products/${product.slug}`}>
            Dolor sit amet <ArrowRight aria-hidden="true" />
          </a>
        </article>
      ))}
    </div>
  );
}
