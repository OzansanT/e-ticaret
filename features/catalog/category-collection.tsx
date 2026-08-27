"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CartProvider } from "@/features/cart/cart-context";
import { CartSheet } from "@/features/cart/cart-sheet";
import { ProductGrid } from "./product-grid";
import type { Product } from "./products";
import type { CampaignRule } from "@/db/catalog";

export function CategoryCollection({ name, products, catalog, campaigns }: { name: string; products: Product[]; catalog: Product[]; campaigns: CampaignRule[] }) {
  return (
    <CartProvider catalog={catalog} campaigns={campaigns}>
      <div className="commerce-page">
        <header className="commerce-header"><Link className="brand" href="/"><span className="brand__mark">◐</span><span><strong>Lorem Ipsum</strong><small>Dolor sit amet.</small></span></Link><CartSheet /></header>
        <main className="category-page">
          <nav className="commerce-breadcrumb" aria-label="Lorem ipsum"><Link href="/"><ArrowLeft aria-hidden="true" /> Lorem ipsum</Link><span>/</span><span>{name}</span></nav>
          <header><span className="eyebrow">Lorem ipsum dolor</span><h1>{name}</h1><p>Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p></header>
          <ProductGrid products={products} />
        </main>
      </div>
    </CartProvider>
  );
}
