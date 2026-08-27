export type ProductCategory =
  | "Lorem Ipsum"
  | "Dolor Sit"
  | "Amet Elit"
  | "Tempor Incididunt";

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
    name: "Lorem Ipsum Dolor Sit Amet",
    shortName: "Lorem 01",
    size: "Lorem 01",
    price: 134,
    category: "Lorem Ipsum",
    eyebrow: "Lorem Ipsum",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    accent: "#ff7b00",
  },
  {
    id: "lorem-02",
    name: "Consectetur Adipiscing Elit",
    shortName: "Lorem 02",
    size: "Lorem 02",
    price: 170,
    category: "Dolor Sit",
    eyebrow: "Dolor Sit Amet",
    description: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    accent: "#0d5c45",
    badge: "Lorem",
  },
  {
    id: "lorem-03",
    name: "Sed Do Eiusmod Tempor",
    shortName: "Lorem 03",
    size: "Lorem 03",
    price: 231,
    category: "Amet Elit",
    eyebrow: "Amet Consectetur",
    description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
    accent: "#2f7f91",
  },
  {
    id: "lorem-04",
    name: "Incididunt Ut Labore Dolore",
    shortName: "Lorem 04",
    size: "Lorem 04",
    price: 325,
    category: "Tempor Incididunt",
    eyebrow: "Tempor Incididunt",
    description: "Duis aute irure dolor in reprehenderit in voluptate velit esse.",
    accent: "#7851a9",
    badge: "Ipsum",
  },
  {
    id: "lorem-05",
    name: "Excepteur Sint Occaecat",
    shortName: "Lorem 05",
    size: "Lorem 05",
    price: 501,
    category: "Lorem Ipsum",
    eyebrow: "Excepteur Sint",
    description: "Sunt in culpa qui officia deserunt mollit anim id est laborum.",
    accent: "#292929",
  },
];

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
