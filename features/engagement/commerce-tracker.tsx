"use client";

import { useEffect } from "react";
import { useCart } from "@/features/cart/cart-context";
import { CONSENT_EVENT, readConsent } from "./consent-manager";

const SESSION_KEY = "e-commerce-session-v1";
const CART_ID_KEY = "e-commerce-cart-id-v1";
const REFERRAL_KEY = "e-commerce-referral-v1";

function readOrCreate(key: string) {
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const value = createBrowserId();
  window.localStorage.setItem(key, value);
  return value;
}

export function createBrowserId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const encoded = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${encoded.slice(0, 8)}-${encoded.slice(8, 12)}-${encoded.slice(12, 16)}-${encoded.slice(16, 20)}-${encoded.slice(20)}`;
}

export function readCartId() {
  return typeof window === "undefined" ? "" : readOrCreate(CART_ID_KEY);
}

export function rotateCartId() {
  if (typeof window === "undefined") return "";
  const value = createBrowserId();
  window.localStorage.setItem(CART_ID_KEY, value);
  return value;
}

export function readReferralCode() {
  return typeof window === "undefined" ? "" : window.localStorage.getItem(REFERRAL_KEY) ?? "";
}

export function trackCommerceEvent(
  name: "page_view" | "product_view" | "add_to_cart" | "begin_checkout" | "order_created",
  properties: Record<string, string | number | boolean | null> = {},
) {
  if (typeof window === "undefined" || !readConsent()?.analytics) return;
  void fetch("/api/analytics", {
    method: "POST",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionId: readOrCreate(SESSION_KEY),
      name,
      path: `${window.location.pathname}${window.location.search}`,
      properties,
    }),
  });
}

export function CommerceTracker({ productId }: { productId?: string }) {
  const cart = useCart();

  useEffect(() => {
    const referral = new URLSearchParams(window.location.search).get("ref");
    if (referral && /^[A-Za-z0-9-]{3,60}$/.test(referral)) {
      window.localStorage.setItem(REFERRAL_KEY, referral.toUpperCase());
    }
    trackCommerceEvent(productId ? "product_view" : "page_view", productId ? { productId } : {});
  }, [productId]);

  useEffect(() => {
    if (cart.lines.length === 0) return;
    const persist = () => {
      if (!readConsent()?.marketing) return;
      void fetch("/api/abandoned-cart", {
        method: "POST",
        keepalive: true,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cartId: readCartId(),
          subtotal: cart.subtotal,
          lines: cart.lines.map(({ product, variant, quantity }) => ({ productId: product.id, variantId: variant?.id, quantity })),
        }),
      });
    };
    const timer = window.setTimeout(persist, 1200);
    window.addEventListener(CONSENT_EVENT, persist);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CONSENT_EVENT, persist);
    };
  }, [cart.lines, cart.subtotal]);

  return null;
}
