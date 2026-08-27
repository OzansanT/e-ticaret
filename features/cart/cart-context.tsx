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

const STORAGE_KEY = "dr-animal-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

function calculateCampaign(lines: CartLine[], subtotal: number): Campaign {
  const units = lines.flatMap(({ product, quantity }) =>
    Array.from({ length: quantity }, () => product.price),
  );
  const candidates: Campaign[] = [
    {
      name: "Sepette %10",
      discount: subtotal * 0.1,
      message: "Tüm sepete %10 indirim uygulandı.",
    },
  ];

  if (subtotal >= 600) {
    candidates.push({
      name: "600 TL üzeri 50 TL",
      discount: 50,
      message: "600 TL üzeri alışveriş indirimi uygulandı.",
    });
  }
  if (units.length >= 3) {
    candidates.push({
      name: "3 ürün al %20",
      discount: subtotal * 0.2,
      message: "Üç veya daha fazla ürüne %20 indirim uygulandı.",
    });
  }
  if (units.length >= 4) {
    const sorted = [...units].sort((a, b) => a - b);
    candidates.push({
      name: "4 al 2 öde",
      discount: sorted[0] + sorted[1],
      message: "Sepetteki en uygun iki ürün hediye edildi.",
    });
  }

  return candidates.reduce((best, item) =>
    item.discount > best.discount ? item : best,
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
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
              products.some((product) => product.id === id) &&
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
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quantities));
    }
  }, [hydrated, quantities]);

  const add = useCallback((product: Product) => {
    setQuantities((current) => ({
      ...current,
      [product.id]: Math.min((current[product.id] ?? 0) + 1, 20),
    }));
    toast.success(`${product.shortName} sepete eklendi`);
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
    const lines = products
      .filter((product) => quantities[product.id])
      .map((product) => ({ product, quantity: quantities[product.id] }));
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce(
      (sum, line) => sum + line.product.price * line.quantity,
      0,
    );
    const campaign = calculateCampaign(lines, subtotal);

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
  }, [add, clear, decrease, quantities, remove]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
