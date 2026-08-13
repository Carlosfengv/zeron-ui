import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import type { AppLocale } from "@/app/_i18n/routing";
import { loadPageMessages } from "./content-loaders.generated";

export async function PageMessages({
  locale,
  namespace,
  children,
}: {
  locale: AppLocale;
  namespace: string;
  children: ReactNode;
}) {
  const messages = await loadPageMessages(locale, namespace);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
