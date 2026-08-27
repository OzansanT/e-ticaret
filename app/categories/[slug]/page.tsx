import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listCampaignRules, listProducts } from "@/db/catalog";
import { CategoryCollection } from "@/features/catalog/category-collection";

export const dynamic = "force-dynamic";
type CategoryPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Lorem Ipsum" };
  return {
    title: `${category.name} | Lorem Ipsum`,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: { title: category.name, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", type: "website", images: [] },
    twitter: { card: "summary", title: category.name, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", images: [] },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const [catalog, campaigns] = await Promise.all([listProducts(), listCampaignRules()]);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: category.products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://e-ticaret.talasresul.chatgpt.site/products/${product.slug}`,
        name: product.name,
      })),
    },
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><CategoryCollection name={category.name} products={category.products} catalog={catalog} campaigns={campaigns} /></>;
}
