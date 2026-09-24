import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";

import { CartItem } from "@/src/types";
import { storage } from "@/src/utils/storage";

const CART_KEY = "eatly_cart";

type CartState = {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  incrementLine: (lineId: string) => void;
  decrementLine: (lineId: string) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | undefined>(undefined);

function makeLineId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(CART_KEY, "[]");
      try {
        const parsed = JSON.parse(raw ?? "[]");
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {
        // ignore
      }
    })();
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    storage.setItem(CART_KEY, JSON.stringify(next));
  }, []);

  const addItem = useCallback(
    (item: CartItem) => {
      setItems((prev) => {
        // Dine-in: cart is scoped to a single restaurant.
        const differentRestaurant =
          prev.length > 0 && prev[0].restaurantId !== item.restaurantId;
        const base = differentRestaurant ? [] : prev;

        // Merge identical line (same item + options + notes).
        const signature = (i: CartItem) =>
          `${i.menuItemId}|${i.notes}|${i.options
            .map((o) => `${o.group}:${o.choice}`)
            .sort()
            .join(",")}`;
        const sig = signature(item);
        const existingIdx = base.findIndex((i) => signature(i) === sig);

        let next: CartItem[];
        if (existingIdx >= 0) {
          next = base.map((i, idx) =>
            idx === existingIdx ? { ...i, quantity: i.quantity + item.quantity } : i,
          );
        } else {
          next = [...base, { ...item, lineId: makeLineId() }];
        }
        storage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const incrementLine = useCallback(
    (lineId: string) => {
      setItems((prev) => {
        const next = prev.map((i) =>
          i.lineId === lineId ? { ...i, quantity: i.quantity + 1 } : i,
        );
        storage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const decrementLine = useCallback(
    (lineId: string) => {
      setItems((prev) => {
        const next = prev
          .map((i) => (i.lineId === lineId ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0);
        storage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const removeLine = useCallback((lineId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.lineId !== lineId);
      storage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo<CartState>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return {
      items,
      restaurantId: items[0]?.restaurantId ?? null,
      restaurantName: items[0]?.restaurantName ?? null,
      count,
      subtotal,
      addItem,
      incrementLine,
      decrementLine,
      removeLine,
      clear,
    };
  }, [items, addItem, incrementLine, decrementLine, removeLine, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
