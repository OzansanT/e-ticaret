"use client";

import { ArrowRight, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, type Product } from "./products";
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
            <div className="product-card__label">
              <small>LOREM IPSUM</small>
              <strong>Dolor</strong>
              <span>{product.size}</span>
            </div>
          </div>
          <div className="product-card__body">
            <span className="product-card__category">{product.category}</span>
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
            <Button onClick={() => cart.add(product)} aria-label={`Add ${product.shortName}`}>
              <Plus aria-hidden="true" /> Lorem ipsum
            </Button>
          </div>
          <a className="product-card__details" href="#bakim-rehberi">
            Dolor sit amet <ArrowRight aria-hidden="true" />
          </a>
        </article>
      ))}
    </div>
  );
}
