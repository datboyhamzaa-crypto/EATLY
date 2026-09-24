import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef, ReactNode } from "react";

import { CartItem, DineInInfo, Order, OrderStatus, PaymentMethodId } from "@/src/types";
import { storage } from "@/src/utils/storage";

const ORDERS_KEY = "eatly_orders";

type CreateInput = {
  items: CartItem[];
  restaurantId: string;
  restaurantName: string;
  restaurantAvatar: string;
  dineIn: DineInInfo;
  paymentMethod: PaymentMethodId;
  promoCode: string | null;
  subtotal: number;
  discount: number;
  total: number;
};

type OrdersState = {
  orders: Order[];
  createOrder: (input: CreateInput) => Order;
  getOrder: (id: string) => Order | undefined;
  updateStatus: (id: string, status: OrderStatus) => void;
};

const OrdersContext = createContext<OrdersState | undefined>(undefined);

// Auto-advance flow for demo: paid -> preparing -> ready.
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: "preparing",
  preparing: "ready",
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function makeCode() {
  return `ETL-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const ordersRef = useRef<Order[]>([]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(ORDERS_KEY, "[]");
      try {
        const parsed = JSON.parse(raw ?? "[]");
        if (Array.isArray(parsed)) setOrders(parsed);
      } catch {
        // ignore
      }
    })();
  }, []);

  const persist = useCallback((next: Order[]) => {
    setOrders(next);
    storage.setItem(ORDERS_KEY, JSON.stringify(next));
  }, []);

  const updateStatus = useCallback(
    (id: string, status: OrderStatus) => {
      const next = ordersRef.current.map((o) => (o.id === id ? { ...o, status } : o));
      persist(next);
    },
    [persist],
  );

  // Simulate kitchen progression every 7s for active orders.
  useEffect(() => {
    const timer = setInterval(() => {
      const active = ordersRef.current.filter((o) => o.status === "paid" || o.status === "preparing");
      if (active.length === 0) return;
      const next = ordersRef.current.map((o) => {
        const n = NEXT[o.status];
        return n ? { ...o, status: n } : o;
      });
      persist(next);
    }, 7000);
    return () => clearInterval(timer);
  }, [persist]);

  const createOrder = useCallback(
    (input: CreateInput) => {
      const order: Order = {
        id: makeId(),
        code: makeCode(),
        ...input,
        status: "paid",
        qrToken: `EATLY|${makeCode()}|${Date.now()}`,
        createdAt: Date.now(),
      };
      persist([order, ...ordersRef.current]);
      return order;
    },
    [persist],
  );

  const getOrder = useCallback((id: string) => ordersRef.current.find((o) => o.id === id), []);

  const value = useMemo<OrdersState>(
    () => ({ orders, createOrder, getOrder, updateStatus }),
    [orders, createOrder, getOrder, updateStatus],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
