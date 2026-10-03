"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { localePrefixFromPathname } from "@docs/components/shell/site/locale-path";
import { BlockDetailPageView, type BlockDetailPageProps } from "./BlockDetailPageView";

export { BlockDetailSection } from "./BlockDetailPageView";

export function BlockDetailPage(props: BlockDetailPageProps) {
  const pathname = usePathname();
  const common = useTranslations("common");
  const preview = useTranslations("preview");
  return <BlockDetailPageView {...props} localePrefix={localePrefixFromPathname(pathname)} installationLabel={common("installation")} previewLabel={preview("preview")} />;
}
