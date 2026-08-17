"use client";

import { ZlrWorkspace } from "@zeron/blocks/zlrlist";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";

export function ZlrListBlockDocClient({ code }: { code: string }) {
  return (
    <BlockDetailPage
      code={code}
      description="A ZS Live Recovery protection-group workspace with responsive navigation and Figma-aligned list and detail views."
      previewMinHeightClass="min-h-[36rem]"
      slug="zlrlist"
      title="ZLR Protection Groups"
      preview={<ZlrWorkspace />}
    >
      <BlockDetailSection title="Data integration">
        <p className="text-body text-fg-muted">
          Pass groups and sites to replace the sample data. The block owns local search,
          selection, and pagination state; use callbacks to connect navigation, site
          changes, creation, and row menus to your application.
        </p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
