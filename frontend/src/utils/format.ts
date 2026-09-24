export function formatRupiah(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}Rp ${digits}`;
}

export function formatCount(n: number): string {
  if (n >= 1000) {
    const v = n / 1000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`;
  }
  return String(n);
}

export function priceDeltaLabel(delta: number): string {
  if (delta === 0) return "";
  return `${delta > 0 ? "+" : "-"}Rp ${Math.abs(delta).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
