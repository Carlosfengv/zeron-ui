"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { FileUploadDemo } from "@docs/components/blocks/FileUploadDemo";

export function FileUploadBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("fileUploadBlock");
  return <BlockDetailPage code={code} slug="file-upload-01" title={t("title")} description={t("description")} preview={<FileUploadDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
