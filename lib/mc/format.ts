import { L, lang } from "./i18n";

export const fmtN = (n: unknown): string =>
  new Intl.NumberFormat("en-US").format(Math.round(Number(n) || 0));

export const ils = (n: unknown): string => `₪${fmtN(n)}`;

export const parseDate = (s?: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(`${String(s).slice(0, 10)}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
};

export const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
export const todayIso = () => isoDate(today());
export const shiftIso = (n: number) => {
  const d = today();
  d.setDate(d.getDate() + n);
  return isoDate(d);
};

/** Whole days between two dates (b - a). */
export const daysBetween = (a: Date | null, b: Date | null): number | null =>
  a && b ? Math.round((b.getTime() - a.getTime()) / 86400000) : null;

/** Days since an ISO date (positive = in the past). */
export const daysAgo = (s?: string | null) => daysBetween(parseDate(s), today());
/** Days until an ISO date (positive = in the future). */
export const daysTo = (s?: string | null) => daysBetween(today(), parseDate(s));

export const fmtDate = (s?: string | null): string => {
  const d = parseDate(s);
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

export const dayWord = (n: number) => `${n} ${L({ he: "ימים", en: "d" })}`;

export const dir = () => (lang() === "he" ? "rtl" : "ltr");
