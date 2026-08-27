export type ProductCategory =
  | "Lorem Ipsum"
  | "Dolor Sit"
  | "Amet Elit"
  | "Tempor Incididunt";

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortName: string;
  size: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: ProductCategory;
  eyebrow: string;
  description: string;
  longDescription: string;
  features: [string, string, string];
  accent: string;
  badge?: string;
};

export const categories = [
  "Lorem",
  "Lorem Ipsum",
  "Dolor Sit",
  "Amet Elit",
  "Tempor Incididunt",
] as const;

export type Category = (typeof categories)[number];

export const products: Product[] = [
  {
    id: "lorem-01",
    slug: "lorem-ipsum-dolor-sit-amet",
    sku: "LRM-001",
    name: "Lorem Ipsum Dolor Sit Amet",
    shortName: "Lorem 01",
    size: "Lorem 01",
    price: 134,
    stock: 18,
    imageUrl: "/product-placeholder.svg",
    category: "Lorem Ipsum",
    eyebrow: "Lorem Ipsum",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    longDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    features: ["Lorem ipsum dolor", "Sit amet consectetur", "Adipiscing elit sed"],
    accent: "#ff7b00",
  },
  {
    id: "lorem-02",
    slug: "consectetur-adipiscing-elit",
    sku: "LRM-002",
    name: "Consectetur Adipiscing Elit",
    shortName: "Lorem 02",
    size: "Lorem 02",
    price: 170,
    stock: 7,
    imageUrl: "/product-placeholder.svg",
    category: "Dolor Sit",
    eyebrow: "Dolor Sit Amet",
    description: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    longDescription: "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    features: ["Consectetur elit", "Tempor incididunt", "Labore et dolore"],
    accent: "#0d5c45",
    badge: "Lorem",
  },
  {
    id: "lorem-03",
    slug: "sed-do-eiusmod-tempor",
    sku: "LRM-003",
    name: "Sed Do Eiusmod Tempor",
    shortName: "Lorem 03",
    size: "Lorem 03",
    price: 231,
    stock: 12,
    imageUrl: "/product-placeholder.svg",
    category: "Amet Elit",
    eyebrow: "Amet Consectetur",
    description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
    longDescription: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis nostrud exercitation ullamco laboris nisi ut aliquip.",
    features: ["Sed do eiusmod", "Minim veniam quis", "Nostrud exercitation"],
    accent: "#2f7f91",
  },
  {
    id: "lorem-04",
    slug: "incididunt-ut-labore-dolore",
    sku: "LRM-004",
    name: "Incididunt Ut Labore Dolore",
    shortName: "Lorem 04",
    size: "Lorem 04",
    price: 325,
    stock: 4,
    imageUrl: "/product-placeholder.svg",
    category: "Tempor Incididunt",
    eyebrow: "Tempor Incididunt",
    description: "Duis aute irure dolor in reprehenderit in voluptate velit esse.",
    longDescription: "Incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
    features: ["Incididunt labore", "Duis aute irure", "Voluptate velit"],
    accent: "#7851a9",
    badge: "Ipsum",
  },
  {
    id: "lorem-05",
    slug: "excepteur-sint-occaecat",
    sku: "LRM-005",
    name: "Excepteur Sint Occaecat",
    shortName: "Lorem 05",
    size: "Lorem 05",
    price: 501,
    stock: 0,
    imageUrl: "/product-placeholder.svg",
    category: "Lorem Ipsum",
    eyebrow: "Excepteur Sint",
    description: "Sunt in culpa qui officia deserunt mollit anim id est laborum.",
    longDescription: "Excepteur sint occaecat cupidatat non proident. Sunt in culpa qui officia deserunt mollit anim id est laborum.",
    features: ["Excepteur sint", "Occaecat cupidatat", "Mollit anim laborum"],
    accent: "#292929",
  },
];

export function findProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
