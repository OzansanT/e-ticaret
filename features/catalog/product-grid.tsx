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
        <h3>Bu aramada ürün bulunamadı.</h3>
        <p>Başka bir kategori veya daha kısa bir arama deneyin.</p>
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
              <small>DR. ANIMAL</small>
              <strong>HOCl</strong>
              <span>{product.size}</span>
            </div>
          </div>
          <div className="product-card__body">
            <span className="product-card__category">{product.category}</span>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <ul>
              <li><Check aria-hidden="true" /> Günlük kullanıma uygun</li>
              <li><Check aria-hidden="true" /> Pratik bakım rutini</li>
            </ul>
          </div>
          <div className="product-card__footer">
            <div>
              <small>Liste fiyatı</small>
              <strong>{formatPrice(product.price)}</strong>
            </div>
            <Button onClick={() => cart.add(product)} aria-label={`${product.shortName} sepete ekle`}>
              <Plus aria-hidden="true" /> Sepete ekle
            </Button>
          </div>
          <a className="product-card__details" href="#bakim-rehberi">
            Bakım alanını keşfet <ArrowRight aria-hidden="true" />
          </a>
        </article>
      ))}
    </div>
  );
}
