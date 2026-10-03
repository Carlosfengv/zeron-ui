import "server-only";

import type { AppLocale } from "@/app/_i18n/routing";
import { BlockDetailPageView, type BlockDetailPageProps } from "./BlockDetailPageView";

export { BlockDetailSection } from "./BlockDetailPageView";

/** Locale comes from the generated route, not request-global translation state. */
export function BlockDetailPageServer({ locale, ...props }: BlockDetailPageProps & { locale: AppLocale; installationLabel: string; previewLabel: string }) {
  return <BlockDetailPageView {...props} localePrefix={locale === "en" ? "/en" : ""} />;
}
