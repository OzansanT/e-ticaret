import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, listCampaignRules } from "@/db/catalog";
import { getProductReviews } from "@/db/reviews";
import { ProductDetail } from "@/features/catalog/product-detail";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Lorem Ipsum" };

  return {
    title: `${product.name} | Lorem Ipsum`,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
      images: [{ url: product.imageUrl, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [product.imageUrl],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [campaigns, reviews, user] = await Promise.all([
    listCampaignRules(),
    getProductReviews(product.id),
    getChatGPTUser(),
  ]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.imageUrl,
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: product.price,
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `https://e-ticaret.talasresul.chatgpt.site/products/${product.slug}`,
    },
    ...(reviews.count > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: reviews.average,
        reviewCount: reviews.count,
      },
      review: reviews.reviews.slice(0, 5).map((review) => ({
        "@type": "Review",
        author: { "@type": "Person", name: review.displayName },
        reviewRating: { "@type": "Rating", ratingValue: review.rating },
        name: review.title,
        reviewBody: review.body,
      })),
    } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <ProductDetail product={product} campaigns={campaigns} reviews={reviews} signedIn={Boolean(user)} signInUrl={chatGPTSignInPath(`/products/${product.slug}`)} />
    </>
  );
}
