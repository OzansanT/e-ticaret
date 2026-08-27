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
import { products, type Product } from "@/features/catalog/products";
import { selectBestCampaign } from "./campaigns";
import type { CampaignRule } from "@/db/catalog";

type CartLine = { product: Product; quantity: number };
type Campaign = { name: string; discount: number; message: string };
type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  campaign: Campaign;
  total: number;
  add: (product: Product) => void;
  decrease: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "e-commerce-cart-v2";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, catalog = products, campaigns = [] }: { children: ReactNode; catalog?: Product[]; campaigns?: CampaignRule[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let restored: Record<string, number> = {};
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        restored = Object.fromEntries(
          Object.entries(parsed).filter(
            ([id, quantity]) =>
              catalog.some((product) => product.id === id) &&
              Number.isInteger(quantity) &&
              Number(quantity) > 0 &&
              Number(quantity) <= 20,
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

  const add = useCallback((product: Product) => {
    setQuantities((current) => ({
      ...current,
      [product.id]: Math.min((current[product.id] ?? 0) + 1, product.stock, 20),
    }));
    if (product.stock > 0) toast.success(`${product.shortName} — lorem ipsum`);
  }, []);

  const decrease = useCallback((productId: string) => {
    setQuantities((current) => {
      const next = { ...current };
      if ((next[productId] ?? 0) <= 1) delete next[productId];
      else next[productId] -= 1;
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setQuantities((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }, []);

  const clear = useCallback(() => setQuantities({}), []);

  const value = useMemo(() => {
    const lines = catalog
      .filter((product) => quantities[product.id])
      .map((product) => ({ product, quantity: quantities[product.id] }));
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
