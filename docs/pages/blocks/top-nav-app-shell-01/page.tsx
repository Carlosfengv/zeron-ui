"use client";

import { useTranslations } from "next-intl";
import { TopNavAppShell } from "@zeron/blocks/top-nav-app-shell-01";
import { Button } from "@zeron/ui/button";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";

const code = `<TopNavAppShell
  brand="Zentrix"
  context="Capability center"
  activeHref="#mcp"
  navigation={[...]}
  actions={<Button variant="neutral">Sign in</Button>}
>
  <section>...</section>
</TopNavAppShell>`;

export default function TopNavAppShellBlockDoc() {
  const t = useTranslations("topNavAppShellBlock");
  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="top-nav-app-shell-01"
      title={t("title")}
      preview={
        <TopNavAppShell
          className="border-0"
          brand="Zentrix"
          context="Capability center"
          activeHref="#mcp"
          actions={<Button type="button" size="md" variant="neutral" className="whitespace-nowrap px-2">Sign in</Button>}
          navigation={[
            { label: "Home", href: "#home" },
            { label: "Models", href: "#models" },
            { label: "MCP", href: "#mcp" },
          ]}
        >
          <section className="p-5 sm:p-6">
            <p className="text-caption text-fg-muted">MCP marketplace</p>
            <h2 className="mt-1 text-title text-fg-default">Extend your agents with reusable capabilities.</h2>
            <p className="mt-2 max-w-lg text-body text-fg-muted">A calm, top-led application frame for products where navigation should not compete with the working surface.</p>
          </section>
        </TopNavAppShell>
      }
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
