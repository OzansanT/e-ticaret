"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { products, type Product, type ProductVariant } from "@/features/catalog/products";
import { selectBestCampaign } from "./campaigns";
import type { CampaignRule } from "@/db/catalog";

type CartLine = { lineId: string; product: Product; variant?: ProductVariant; quantity: number };
type Campaign = { name: string; discount: number; message: string };
type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  campaign: Campaign;
  total: number;
  add: (product: Product, variant?: ProductVariant) => void;
  decrease: (lineId: string) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "e-commerce-cart-v3";
const LEGACY_STORAGE_KEY = "e-commerce-cart-v2";
const CartContext = createContext<CartContextValue | null>(null);

function createLineId(productId: string, variantId?: string) {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function CartProvider({ children, catalog = products, campaigns = [] }: { children: ReactNode; catalog?: Product[]; campaigns?: CampaignRule[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let restored: Record<string, number> = {};
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        restored = Object.fromEntries(
          Object.entries(parsed).filter(
            ([lineId, quantity]) => {
              const [productId, variantId] = lineId.split("::");
              const product = catalog.find((item) => item.id === productId);
              const variant = variantId ? product?.variants?.find((item) => item.id === variantId) : undefined;
              const validSelection = product && (product.variants?.length ? Boolean(variant) : !variantId);
              return validSelection && Number.isInteger(quantity) && Number(quantity) > 0 && Number(quantity) <= 20;
            },
          ),
        ) as Record<string, number>;
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    const restoreFrame = window.requestAnimationFrame(() => {
      setQuantities(restored);
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(restoreFrame);
  }, [catalog]);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quantities));
    }
  }, [hydrated, quantities]);

  const add = useCallback((product: Product, variant?: ProductVariant) => {
    if (product.variants?.length && !variant) return;
    const lineId = createLineId(product.id, variant?.id);
    const availableStock = variant?.stock ?? product.stock;
    if (availableStock <= 0) return;
    setQuantities((current) => ({
      ...current,
      [lineId]: Math.min((current[lineId] ?? 0) + 1, availableStock, 20),
    }));
    toast.success(`${product.shortName} — lorem ipsum`);
  }, []);

  const decrease = useCallback((lineId: string) => {
    setQuantities((current) => {
      const next = { ...current };
      if ((next[lineId] ?? 0) <= 1) delete next[lineId];
      else next[lineId] -= 1;
      return next;
    });
  }, []);

  const remove = useCallback((lineId: string) => {
    setQuantities((current) => {
      const next = { ...current };
      delete next[lineId];
      return next;
    });
  }, []);

  const clear = useCallback(() => setQuantities({}), []);

  const value = useMemo(() => {
    const lines = Object.entries(quantities).flatMap(([lineId, quantity]) => {
      const [productId, variantId] = lineId.split("::");
      const product = catalog.find((item) => item.id === productId);
      if (!product) return [];
      const variant = variantId ? product.variants?.find((item) => item.id === variantId) : undefined;
      if (product.variants?.length && !variant) return [];
      const pricedProduct = variant?.price !== null && variant?.price !== undefined
        ? { ...product, price: variant.price }
        : product;
      return [{ lineId, product: pricedProduct, ...(variant ? { variant } : {}), quantity }];
    });
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce(
      (sum, line) => sum + line.product.price * line.quantity,
      0,
    );
    const unitPrices = lines.flatMap(({ product, quantity }) =>
      Array.from({ length: quantity }, () => product.price),
    );
    const campaign: Campaign = selectBestCampaign(unitPrices, subtotal, campaigns);

    return {
      lines,
      itemCount,
      subtotal,
      campaign,
      total: Math.max(0, subtotal - campaign.discount),
      add,
      decrease,
      remove,
      clear,
    };
  }, [add, campaigns, catalog, clear, decrease, quantities, remove]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
