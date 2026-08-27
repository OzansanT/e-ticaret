# Dr. Animal E‑Ticaret

Dr. Animal için geliştirilen, mobil uyumlu pet bakım ürünleri mağazası. İlk sürüm; ürün keşfi, kategori filtreleme, arama, kalıcı sepet ve en avantajlı kampanyayı otomatik seçme akışına odaklanır.

## Şu anda neler var?

- Türkçe, erişilebilir ve responsive mağaza arayüzü
- Üst kampanya bandı ve ana navigasyon
- Sol kategori alanı, ana ürün kataloğu ve sağ kampanya özeti
- 75 ml–500 ml HOCl ürün boyları ve fiyat merdiveni
- Anlık ürün arama ve kategori filtreleme
- Tarayıcıda saklanan sepet; adet artırma, azaltma ve silme
- Sepette `%10`, `2. üründe %25`, `600 TL üzeri 50 TL`, `3 ürün al %20` ve `4 al 2 öde` kampanyalarını karşılaştıran seçim motoru
- Mobil kategori şeritleri ve sağdan açılan sepet paneli
- Dr. Animal marka renkleriyle optimize edilmiş hero görseli
- Türkçe SEO başlık ve açıklama verileri

Ödeme düğmesi bu aşamada bilinçli olarak pasiftir. Gerçek ödeme, sipariş, stok ve müşteri hesabı akışları bir servis seçilmeden taklit edilmemiştir.

## Mimari

```text
e-ticaret/
├── app/
│   ├── layout.tsx              # SEO ve sayfa kabuğu
│   ├── page.tsx                # Ana giriş
│   └── globals.css             # Tek CSS giriş noktası
├── features/                   # Özellik becerileri
│   ├── index.ts                # Tek özellik giriş noktası
│   ├── storefront/
│   │   └── storefront.tsx      # Navbar, aside'lar, ana bölümler, footer
│   ├── catalog/
│   │   ├── products.ts         # Ürün verisi
│   │   └── product-grid.tsx    # Katalog bileşeni
│   └── cart/
│       ├── campaigns.js        # Saf kampanya motoru
│       ├── cart-context.tsx    # Sepet durumu ve kalıcılık
│       └── cart-sheet.tsx      # Sepet paneli
├── styles/
│   ├── main.css                # Tek CSS dağıtım noktası
│   ├── tokens.css              # Renkler ve ölçüler
│   ├── base.css                # Temel kurallar
│   ├── layout.css              # Sayfa yerleşimi
│   ├── components.css          # Ortak parçalar
│   ├── responsive.css          # Responsive davranış
│   └── features/               # Özellik bazlı stiller
├── public/                     # Optimize edilmiş görseller
└── tests/                      # Arayüz ve kampanya testleri
```

`app/globals.css`, `styles/main.css` dosyasını yükler; `main.css` de tüm temel, düzen ve özellik stillerini dağıtır. `app/page.tsx`, `features/index.ts` üzerinden mağazayı yükler. Böylece CSS ve özellik kodu tek merkezden yönetilir.

## Çalıştırma

Gereksinimler: Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

Kalite kontrolleri:

```bash
npm run lint
npm test
```

## Sıradaki mantıklı geliştirmeler

1. Gerçek ürün fotoğrafları, SKU ve stok verisi
2. Ödeme sağlayıcısı ve güvenli sipariş oluşturma
3. Müşteri hesabı, adresler ve sipariş geçmişi
4. PWA kurulumu, çevrimdışı katalog ve sepet kurtarma
5. Kupon, sadakat, paylaşım/referral ve kampanya derin bağlantıları
6. Analitik, dönüşüm olayları ve izin/tercih yönetimi
7. Ürün detay sayfaları, bakım rehberleri ve yapılandırılmış SEO verisi
