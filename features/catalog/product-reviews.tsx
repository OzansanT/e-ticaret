"use client";

import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductReviewSummary } from "@/db/reviews";

export function ProductReviews({ productSlug, summary, signedIn, signInUrl }: { productSlug: string; summary: ProductReviewSummary; signedIn: boolean; signInUrl: string }) {
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Lorem ipsum…");
    const response = await fetch(`/api/products/${productSlug}/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating, title: form.get("title"), body: form.get("body") }),
    });
    const result = await response.json() as { error?: string };
    setStatus(response.ok ? "Lorem ipsum dolor sit amet." : result.error ?? "Consectetur adipiscing elit.");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <section className="product-reviews" aria-labelledby="reviews-title">
      <header>
        <div><span className="eyebrow">Lorem ipsum</span><h2 id="reviews-title">Dolor sit amet.</h2></div>
        <div className="review-score"><Star aria-hidden="true" /><strong>{summary.average || "—"}</strong><span>{summary.count} lorem</span></div>
      </header>
      <div className="review-layout">
        <div className="review-list">
          {summary.reviews.length === 0 ? <p className="review-empty">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p> : summary.reviews.map((review) => <article key={review.id}><div><span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span><small>{review.createdAt.slice(0, 10)}</small></div><h3>{review.title}</h3><p>{review.body}</p><strong>{review.displayName}</strong></article>)}
        </div>
        <div className="review-form-card">
          <h3>Lorem ipsum dolor.</h3>
          <p>Sit amet consectetur adipiscing elit.</p>
          {signedIn ? <form onSubmit={submit}><fieldset><legend>Lorem ipsum</legend><div className="rating-picker">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} aria-label={`${value} lorem`} aria-pressed={rating === value} onClick={() => setRating(value)}><Star aria-hidden="true" /></button>)}</div></fieldset><label><span>Dolor sit</span><Input name="title" minLength={2} maxLength={100} required /></label><label><span>Amet consectetur</span><textarea name="body" minLength={10} maxLength={1200} required /></label><Button type="submit">Lorem ipsum</Button><output aria-live="polite">{status}</output></form> : <a className="primary-link" href={signInUrl} target="_top">Lorem ipsum</a>}
        </div>
      </div>
    </section>
  );
}
