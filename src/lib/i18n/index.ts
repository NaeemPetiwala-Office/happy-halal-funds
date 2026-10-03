import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { profileQuery } from "@/lib/profile";
import { AR } from "./ar";

export type Locale = "en" | "ar";
export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];
export const LOCALE_KEY = "hbp-locale";

let current: Locale = "en";
export function currentLocale(): Locale { return current; }

/** Translate an English UI string. Unknown strings stay in English. */
export function translate(s: string, locale: Locale = current): string {
  return locale === "ar" ? AR[s] ?? s : s;
}

export function applyLocale(l: Locale) {
  current = l;
  if (typeof document === "undefined") return;
  document.documentElement.lang = l;
  document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  try { localStorage.setItem(LOCALE_KEY, l); } catch { /* ignore */ }
}

/** Locale comes from the profile; also mirrors it onto <html> and localStorage. */
export function useLocale() {
  const { data: profile } = useQuery(profileQuery);
  const locale: Locale = profile?.locale === "ar" ? "ar" : "en";
  if (profile) current = locale;
  useEffect(() => { if (profile) applyLocale(locale); }, [locale, profile]);
  return { locale, t: (s: string) => translate(s, locale) };
}
