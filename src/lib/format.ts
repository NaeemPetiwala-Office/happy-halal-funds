import { currencySymbol } from "./currencies";
import { currentLocale } from "./i18n";

const loc = () => (currentLocale() === "ar" ? "ar-u-nu-latn" : undefined);

export function formatMoney(n: number, currency: string): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n * 100) / 100).toLocaleString(loc(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${currencySymbol(currency)}${abs}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 24 months starting at planStart ("YYYY-MM-01"), as "YYYY-MM". */
export function planMonths(planStart: string): string[] {
  const [y, m] = planStart.split("-").map(Number) as [number, number, number];
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(y, m - 1 + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, 1).toLocaleDateString(loc(), { month: "long", year: "numeric" });
}

export function dateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(loc(), { day: "numeric", month: "short", year: "numeric" });
}
