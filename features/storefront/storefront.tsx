"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  BadgeCheck,
  HeartPulse,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider, useCart } from "@/features/cart/cart-context";
import { CartSheet } from "@/features/cart/cart-sheet";
import { ProductGrid } from "@/features/catalog/product-grid";
import { categories, products, type Category } from "@/features/catalog/products";
import { PwaRegister } from "@/features/pwa/pwa-register";

function Header({ search, setSearch }: { search: string; setSearch: (value: string) => void }) {
  return (
    <header className="site-header">
      <div className="campaign-bar">
        <span>Bugüne özel bakım rutini</span>
        <strong>2. üründe %25 indirim</strong>
        <a href="#urunler">Ürünleri gör <ArrowDown aria-hidden="true" /></a>
      </div>
      <div className="nav-shell">
        <a className="brand" href="#top" aria-label="Dr. Animal ana sayfa">
          <span className="brand__mark">DA</span>
          <span><strong>Dr. Animal</strong><small>Pet care, made clear.</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Ana menü">
          <a href="#urunler">Ürünler</a>
          <a href="#kampanyalar">Kampanyalar</a>
          <a href="#bakim-rehberi">Bakım Rehberi</a>
        </nav>
        <label className="site-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Ürün ara</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Bakım ürünü ara"
            type="search"
          />
        </label>
        <CartSheet />
        <button className="mobile-menu" aria-label="Menüyü aç"><Menu aria-hidden="true" /></button>
      </div>
    </header>
  );
}

function CategoryRail({ active, setActive }: { active: Category; setActive: (value: Category) => void }) {
  return (
    <aside className="category-rail" aria-label="Ürün kategorileri">
      <span className="rail-label">Bakım alanları</span>
      <div className="category-list">
        {categories.map((category) => (
          <button
            key={category}
            className={active === category ? "is-active" : ""}
            onClick={() => setActive(category)}
            aria-pressed={active === category}
          >
            <span>{category}</span>
            <small>{category === "Tümü" ? products.length : products.filter((product) => product.category === category).length}</small>
          </button>
        ))}
      </div>
      <div className="rail-help">
        <HeartPulse aria-hidden="true" />
        <strong>Nereden başlamalı?</strong>
        <p>İhtiyaca göre bakım alanını seçin, uygun boyu karşılaştırın.</p>
      </div>
    </aside>
  );
}

function CampaignAside() {
  const cart = useCart();
  const progress = Math.min(100, (cart.itemCount / 4) * 100);

  return (
    <aside className="campaign-aside" id="kampanyalar" aria-label="Sepet ve kampanya özeti">
      <span className="rail-label">Akıllı sepet</span>
      <div className="campaign-card campaign-card--dark">
        <span>En iyi fırsat</span>
        <strong>{cart.itemCount >= 4 ? "4 al 2 öde aktif" : `${4 - cart.itemCount} ürün sonra 4 al 2 öde`}</strong>
        <div className="progress"><span style={{ width: `${progress}%` }} /></div>
        <p>Sepetiniz için uygun kampanyaları karşılaştırıyoruz.</p>
      </div>
      <div className="campaign-card">
        <span>Her siparişte</span>
        <strong>Sepette %10</strong>
        <p>Daha güçlü bir kampanya oluşursa otomatik olarak ona geçilir.</p>
      </div>
      <div className="trust-list">
        <p><Truck aria-hidden="true" /><span><strong>Hızlı gönderim</strong><small>Özenli paketleme</small></span></p>
        <p><ShieldCheck aria-hidden="true" /><span><strong>Güvenli alışveriş</strong><small>Ödeme altyapısı hazırlıkta</small></span></p>
        <p><BadgeCheck aria-hidden="true" /><span><strong>Veteriner yaklaşımı</strong><small>Günlük bakım odağı</small></span></p>
      </div>
    </aside>
  );
}

function StorefrontContent() {
  const [category, setCategory] = useState<Category>("Tümü");
  const [search, setSearch] = useState("");
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return products.filter((product) => {
      const matchesCategory = category === "Tümü" || product.category === category;
      const matchesSearch =
        !query ||
        `${product.name} ${product.size} ${product.category}`
          .toLocaleLowerCase("tr-TR")
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <div id="top">
      <Header search={search} setSearch={setSearch} />
      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles aria-hidden="true" /> Günlük bakım, net seçim</span>
            <h1 id="hero-title">Onların iyi hali,<br /><em>sizin rutininiz.</em></h1>
            <p>Kedi ve köpeklerin günlük bakım ihtiyaçları için doğru ürünü, doğru boyda ve en avantajlı kampanyayla bulun.</p>
            <div className="hero-actions">
              <a className="primary-link" href="#urunler">Ürünleri keşfet <ArrowDown aria-hidden="true" /></a>
              <a className="secondary-link" href="#bakim-rehberi">Bakım rehberini incele</a>
            </div>
            <div className="hero-proof">
              <span><strong>5.000+</strong> veteriner tercihi</span>
              <span><strong>100.000+</strong> sağlıklı kedi</span>
            </div>
          </div>
          <div className="hero-visual" role="img" aria-label="Kedi, köpek ve pet bakım ürünleri">
            <Image
              src="/dr-animal-storefront-hero.webp"
              alt="Dr. Animal bakım ürünleri yanında kedi ve köpek"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 55vw"
            />
            <div className="hero-stamp"><span>Günlük</span><strong>BAKIM</strong><small>kolaylaştı</small></div>
          </div>
        </section>

        <div className="mobile-categories" aria-label="Mobil ürün kategorileri">
          {categories.map((item) => (
            <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>
          ))}
        </div>

        <div className="shop-layout">
          <CategoryRail active={category} setActive={setCategory} />
          <section className="catalog-section" id="urunler" aria-labelledby="catalog-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Bakım dolabı</span>
                <h2 id="catalog-title">Rutininize uygun boyu seçin.</h2>
              </div>
              <p><strong>{filteredProducts.length}</strong> ürün gösteriliyor</p>
            </div>
            <ProductGrid products={filteredProducts} />
          </section>
          <CampaignAside />
        </div>

        <section className="guide-section" id="bakim-rehberi" aria-labelledby="guide-title">
          <div>
            <span className="eyebrow">Basit bakım sistemi</span>
            <h2 id="guide-title">Üç adımda doğru rutini kurun.</h2>
          </div>
          <ol>
            <li><span>01</span><div><strong>Alanı seçin</strong><p>Ağız, göz, kulak veya deri bakım ihtiyacını belirleyin.</p></div></li>
            <li><span>02</span><div><strong>Boyu karşılaştırın</strong><p>Kullanım sıklığına ve evcil hayvan sayısına göre karar verin.</p></div></li>
            <li><span>03</span><div><strong>Rutine ekleyin</strong><p>Ürünü günlük bakım düzeninizin kolay bir parçası yapın.</p></div></li>
          </ol>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-brand"><span className="brand__mark">DA</span><div><strong>Dr. Animal</strong><p>Evcil dostlar için anlaşılır günlük bakım.</p></div></div>
        <div><strong>Mağaza</strong><a href="#urunler">Tüm ürünler</a><a href="#kampanyalar">Kampanyalar</a></div>
        <div><strong>Destek</strong><a href="#bakim-rehberi">Bakım rehberi</a><a href="mailto:destek@dranimal.com.tr">Bize ulaşın</a></div>
        <p className="footer-note">© 2026 Dr. Animal. Ürün bilgileri bakım amaçlıdır.</p>
      </footer>
      <Toaster position="bottom-center" richColors />
      <PwaRegister />
    </div>
  );
}

export function Storefront() {
  return <CartProvider><StorefrontContent /></CartProvider>;
}
