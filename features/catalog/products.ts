export type ProductCategory =
  | "Günlük Bakım"
  | "Ağız & Diş"
  | "Göz & Kulak"
  | "Deri & Tüy";

export type Product = {
  id: string;
  name: string;
  shortName: string;
  size: string;
  price: number;
  category: ProductCategory;
  eyebrow: string;
  description: string;
  accent: string;
  badge?: string;
};

export const categories = [
  "Tümü",
  "Günlük Bakım",
  "Ağız & Diş",
  "Göz & Kulak",
  "Deri & Tüy",
] as const;

export type Category = (typeof categories)[number];

export const products: Product[] = [
  {
    id: "hocl-75",
    name: "HOCl Günlük Bakım Solüsyonu",
    shortName: "HOCl Mini",
    size: "75 ml",
    price: 134,
    category: "Günlük Bakım",
    eyebrow: "Deneme Boyu",
    description: "Çantada taşımaya uygun, pratik günlük bakım boyu.",
    accent: "#ff7b00",
  },
  {
    id: "hocl-100",
    name: "HOCl Çok Amaçlı Bakım Solüsyonu",
    shortName: "HOCl Core",
    size: "100 ml",
    price: 170,
    category: "Ağız & Diş",
    eyebrow: "En Çok Tercih Edilen",
    description: "Düzenli bakım rutini için dengeli temel boy.",
    accent: "#0d5c45",
    badge: "Popüler",
  },
  {
    id: "hocl-150",
    name: "HOCl Göz & Kulak Bakım Solüsyonu",
    shortName: "HOCl Plus",
    size: "150 ml",
    price: 231,
    category: "Göz & Kulak",
    eyebrow: "Avantajlı Boy",
    description: "Evdeki düzenli göz ve kulak bakım rutinlerine uygun.",
    accent: "#2f7f91",
  },
  {
    id: "hocl-250",
    name: "HOCl Deri & Tüy Bakım Solüsyonu",
    shortName: "HOCl Family",
    size: "250 ml",
    price: 325,
    category: "Deri & Tüy",
    eyebrow: "Aile Boyu",
    description: "Birden fazla evcil hayvanı olan evler için yüksek hacim.",
    accent: "#7851a9",
    badge: "En Avantajlı",
  },
  {
    id: "hocl-500",
    name: "HOCl Profesyonel Bakım Solüsyonu",
    shortName: "HOCl Pro",
    size: "500 ml",
    price: 501,
    category: "Günlük Bakım",
    eyebrow: "Profesyonel Boy",
    description: "Yoğun kullanım ve uzun bakım döngüsü için büyük boy.",
    accent: "#292929",
  },
];

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
