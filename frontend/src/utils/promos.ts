// Mock promo engine (Phase 1). Structured to be swapped for a backend promo API.
export type Promo = { code: string; label: string; discount: number; note: string };

const PROMOS: Record<string, Promo> = {
  NEWFAM: { code: "NEWFAM", label: "Diskon Rp 15.000", discount: 15000, note: "Berlaku untuk pesanan pertama" },
  EATLY25: { code: "EATLY25", label: "Diskon Rp 25.000", discount: 25000, note: "Min. pembelian Rp 100.000" },
  HEMAT10: { code: "HEMAT10", label: "Diskon Rp 10.000", discount: 10000, note: "Promo dine-in spesial" },
};

export function applyPromo(code: string, subtotal: number): { ok: boolean; promo?: Promo; error?: string } {
  const key = code.trim().toUpperCase();
  if (!key) return { ok: false, error: "Masukkan kode promo" };
  const promo = PROMOS[key];
  if (!promo) return { ok: false, error: "Kode promo tidak valid" };
  if (key === "EATLY25" && subtotal < 100000) return { ok: false, error: "Min. pembelian Rp 100.000" };
  return { ok: true, promo };
}
