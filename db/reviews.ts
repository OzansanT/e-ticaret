import { getD1 } from "./index";

export type ProductReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  displayName: string;
  createdAt: string;
};

export type ProductReviewSummary = {
  average: number;
  count: number;
  reviews: ProductReview[];
};

export async function getProductReviews(productId: string): Promise<ProductReviewSummary> {
  try {
    const db = await getD1();
    const [summary, rows] = await db.batch([
      db.prepare(`
        SELECT ROUND(COALESCE(AVG(rating), 0), 1) AS average, COUNT(*) AS count
        FROM product_reviews WHERE product_id = ? AND status = 'approved'
      `).bind(productId),
      db.prepare(`
        SELECT product_reviews.id, rating, title, body,
               'Lorem Ipsum' AS display_name,
               product_reviews.created_at
        FROM product_reviews
        WHERE product_reviews.product_id = ? AND product_reviews.status = 'approved'
        ORDER BY product_reviews.created_at DESC LIMIT 20
      `).bind(productId),
    ]);
    const aggregate = summary.results[0] as { average?: number; count?: number } | undefined;
    return {
      average: Number(aggregate?.average ?? 0),
      count: Number(aggregate?.count ?? 0),
      reviews: rows.results.map((row) => {
        const review = row as Record<string, unknown>;
        return {
          id: String(review.id),
          rating: Number(review.rating),
          title: String(review.title),
          body: String(review.body),
          displayName: String(review.display_name),
          createdAt: String(review.created_at),
        };
      }),
    };
  } catch {
    return { average: 0, count: 0, reviews: [] };
  }
}
