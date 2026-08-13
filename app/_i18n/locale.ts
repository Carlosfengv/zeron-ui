import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "./routing";

export function assertLocale(locale: string): asserts locale is AppLocale {
  if (!hasLocale(routing.locales, locale)) notFound();
}
