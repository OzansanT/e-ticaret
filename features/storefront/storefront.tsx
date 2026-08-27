"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  BadgeCheck,
  HeartPulse,
  Menu,
  UserRound,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { CartProvider, useCart } from "@/features/cart/cart-context";
import { CartSheet } from "@/features/cart/cart-sheet";
import { ProductGrid } from "@/features/catalog/product-grid";
import { categories, type Category, type Product } from "@/features/catalog/products";
import type { CampaignRule } from "@/db/catalog";
import { PwaRegister } from "@/features/pwa/pwa-register";
import { CommerceTracker } from "@/features/engagement/commerce-tracker";
import { NotificationOptIn } from "@/features/engagement/notification-opt-in";

function Header({ search, setSearch }: { search: string; setSearch: (value: string) => void }) {
  return (
    <header className="site-header">
      <div className="campaign-bar">
        <span>Lorem ipsum dolor</span>
        <strong>Sit amet consectetur</strong>
        <a href="#urunler">Adipiscing elit <ArrowDown aria-hidden="true" /></a>
      </div>
      <div className="nav-shell">
        <a className="brand" href="#top" aria-label="Home">
          <span className="brand__mark">◐</span>
          <span><strong>Lorem Ipsum</strong><small>Dolor sit amet.</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#urunler">Lorem</a>
          <a href="#kampanyalar">Ipsum</a>
          <a href="#bakim-rehberi">Dolor Sit</a>
        </nav>
        <label className="site-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Lorem ipsum dolor"
            type="search"
          />
        </label>
        <CartSheet />
        <a className="account-link" href="/account" aria-label="Lorem ipsum">
          <UserRound aria-hidden="true" />
        </a>
        <button className="mobile-menu" aria-label="Open menu"><Menu aria-hidden="true" /></button>
      </div>
    </header>
  );
}

function CategoryRail({ active, setActive, catalog }: { active: Category; setActive: (value: Category) => void; catalog: Product[] }) {
  return (
    <aside className="category-rail" aria-label="Categories">
      <span className="rail-label">Lorem ipsum</span>
      <div className="category-list">
        {categories.map((category) => (
          <button
            key={category}
            className={active === category ? "is-active" : ""}
            onClick={() => setActive(category)}
            aria-pressed={active === category}
          >
            <span>{category}</span>
            <small>{category === "Lorem" ? catalog.length : catalog.filter((product) => product.category === category).length}</small>
          </button>
        ))}
      </div>
      <div className="rail-help">
        <HeartPulse aria-hidden="true" />
        <strong>Lorem ipsum dolor?</strong>
        <p>Sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</p>
      </div>
    </aside>
  );
}

function CampaignAside() {
  const cart = useCart();
  const progress = Math.min(100, (cart.itemCount / 4) * 100);

  return (
    <aside className="campaign-aside" id="kampanyalar" aria-label="Summary">
      <span className="rail-label">Lorem ipsum</span>
      <div className="campaign-card campaign-card--dark">
        <span>Lorem ipsum</span>
        <strong>{cart.itemCount >= 4 ? "Dolor sit amet" : `${4 - cart.itemCount} lorem ipsum dolor`}</strong>
        <div className="progress"><span style={{ width: `${progress}%` }} /></div>
        <p>Consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>
      </div>
      <div className="campaign-card">
        <span>Dolor sit amet</span>
        <strong>Lorem ipsum %10</strong>
        <p>Ut labore et dolore magna aliqua, enim ad minim veniam.</p>
      </div>
      <div className="trust-list">
        <p><Truck aria-hidden="true" /><span><strong>Lorem ipsum</strong><small>Dolor sit amet</small></span></p>
        <p><ShieldCheck aria-hidden="true" /><span><strong>Consectetur elit</strong><small>Sed do eiusmod</small></span></p>
        <p><BadgeCheck aria-hidden="true" /><span><strong>Tempor incididunt</strong><small>Ut labore dolore</small></span></p>
      </div>
    </aside>
  );
}

function StorefrontContent({ catalog }: { catalog: Product[] }) {
  const [category, setCategory] = useState<Category>("Lorem");
  const [search, setSearch] = useState("");
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return catalog.filter((product) => {
      const matchesCategory = category === "Lorem" || product.category === category;
      const matchesSearch =
        !query ||
        `${product.name} ${product.size} ${product.category}`
          .toLocaleLowerCase("tr-TR")
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [catalog, category, search]);

  return (
    <div id="top">
      <Header search={search} setSearch={setSearch} />
      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles aria-hidden="true" /> Lorem ipsum dolor sit</span>
            <h1 id="hero-title">Lorem ipsum,<br /><em>dolor sit amet.</em></h1>
            <p>Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <div className="hero-actions">
              <a className="primary-link" href="#urunler">Lorem ipsum <ArrowDown aria-hidden="true" /></a>
              <a className="secondary-link" href="#bakim-rehberi">Dolor sit amet</a>
            </div>
            <div className="hero-proof">
              <span><strong>5.000+</strong> lorem ipsum</span>
              <span><strong>100.000+</strong> dolor sit amet</span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-composition">
              <span>01</span><span>02</span><span>03</span>
              <strong>LOREM</strong>
            </div>
            <div className="hero-stamp"><span>Lorem</span><strong>IPSUM</strong><small>dolor sit</small></div>
          </div>
        </section>

        <div className="mobile-categories" aria-label="Mobile categories">
          {categories.map((item) => (
            <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>
          ))}
        </div>

        <div className="shop-layout">
          <CategoryRail active={category} setActive={setCategory} catalog={catalog} />
          <section className="catalog-section" id="urunler" aria-labelledby="catalog-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Lorem ipsum</span>
                <h2 id="catalog-title">Dolor sit amet consectetur.</h2>
              </div>
              <p><strong>{filteredProducts.length}</strong> lorem ipsum</p>
            </div>
            <ProductGrid products={filteredProducts} />
          </section>
          <CampaignAside />
        </div>

        <section className="guide-section" id="bakim-rehberi" aria-labelledby="guide-title">
          <div>
            <span className="eyebrow">Lorem ipsum dolor</span>
            <h2 id="guide-title">Sit amet consectetur adipiscing.</h2>
          </div>
          <ol>
            <li><span>01</span><div><strong>Lorem ipsum</strong><p>Dolor sit amet, consectetur adipiscing elit.</p></div></li>
            <li><span>02</span><div><strong>Sed do eiusmod</strong><p>Tempor incididunt ut labore et dolore magna aliqua.</p></div></li>
            <li><span>03</span><div><strong>Ut enim minim</strong><p>Veniam quis nostrud exercitation ullamco laboris nisi.</p></div></li>
          </ol>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-brand"><span className="brand__mark">◐</span><div><strong>Lorem Ipsum</strong><p>Dolor sit amet, consectetur adipiscing elit.</p></div></div>
        <div><strong>Lorem</strong><a href="#urunler">Ipsum dolor</a><a href="#kampanyalar">Sit amet</a></div>
        <div><strong>Consectetur</strong><a href="#bakim-rehberi">Adipiscing elit</a><a href="mailto:lorem@example.com">Sed do eiusmod</a><button className="footer-consent" onClick={() => window.dispatchEvent(new Event("commerce-open-consent"))}>Lorem ipsum</button></div>
        <p className="footer-note">© 2026 Lorem Ipsum. Dolor sit amet consectetur.</p>
      </footer>
      <div className="notification-dock"><NotificationOptIn /></div>
      <CommerceTracker />
      <PwaRegister />
    </div>
  );
}

export function Storefront({ catalog, campaigns }: { catalog: Product[]; campaigns: CampaignRule[] }) {
  return <CartProvider catalog={catalog} campaigns={campaigns}><StorefrontContent catalog={catalog} /></CartProvider>;
}
