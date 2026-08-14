"use client";

import {
  Accordion,
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@zeron/ui/accordion";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const standaloneCode = `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./components";

<Accordion type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger>What is this component?</AccordionTrigger>
    <AccordionContent>
      A collapsible accordion with animated expand/collapse and spring-animated chevron.
    </AccordionContent>
  </AccordionItem>
</Accordion>`;

const groupedCode = `import { AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent } from "./components";

<AccordionGroup type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1" index={0}>
    <AccordionTrigger>Getting Started</AccordionTrigger>
    <AccordionContent>
      Install the component and import it into your project. The accordion
      supports both single and multiple expand modes.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2" index={1}>
    <AccordionTrigger>Styling</AccordionTrigger>
    <AccordionContent>
      The component uses Tailwind's native rounded radius scale. All animations
      use spring physics.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-3" index={2}>
    <AccordionTrigger>Accessibility</AccordionTrigger>
    <AccordionContent>
      Built on Base UI Accordion with WAI-ARIA
      attributes, keyboard navigation, and focus management.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-4" index={3}>
    <AccordionTrigger>Animation</AccordionTrigger>
    <AccordionContent>
      Smooth height transitions and spring-animated chevron rotation.
      The proximity hover background tracks your cursor.
    </AccordionContent>
  </AccordionItem>
</AccordionGroup>`;

const multipleCode = `import { AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent } from "./components";

<AccordionGroup type="multiple" defaultValue={["item-1", "item-3"]}>
  <AccordionItem value="item-1" index={0}>
    <AccordionTrigger>First Section</AccordionTrigger>
    <AccordionContent>
      Multiple items can be expanded at the same time.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2" index={1}>
    <AccordionTrigger>Second Section</AccordionTrigger>
    <AccordionContent>
      Click any trigger to expand or collapse independently.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-3" index={2}>
    <AccordionTrigger>Third Section</AccordionTrigger>
    <AccordionContent>
      Each item operates independently in multiple mode.
    </AccordionContent>
  </AccordionItem>
</AccordionGroup>`;

export default function AccordionDoc() {
  const t = useTranslations("accordion");
  const rootProps: PropDef[] = [
    { name: "type", type: '"single" | "multiple"', default: '"single"', description: t("rootType") },
    { name: "collapsible", type: "boolean", default: "true", description: t("rootCollapsible") },
    { name: "defaultValue", type: "string | string[]", description: t("rootDefaultValue") },
    { name: "value", type: "string | string[]", description: t("rootValue") },
    { name: "onValueChange", type: "(value) => void", description: t("rootOnValueChange") },
  ];
  const itemProps: PropDef[] = [
    { name: "value", type: "string", description: t("itemValue") },
    { name: "index", type: "number", description: t("itemIndex") },
    { name: "disabled", type: "boolean", default: "false", description: t("itemDisabled") },
  ];
  const triggerProps: PropDef[] = [{ name: "children", type: "ReactNode", description: t("triggerChildren") }];
  const contentProps: PropDef[] = [{ name: "children", type: "ReactNode", description: t("contentChildren") }];
  return (
    <DocPage
      title="Accordion"
      slug="accordion"
      description="Collapsible sections with animated expand/collapse and proximity hover in grouped mode."
    >
      <DocSection title={t("standalone")}>
        <p className="text-body text-fg-muted">{t("standaloneDescription")}</p>
        <ComponentPreview code={standaloneCode}>
          <div className="min-h-[120px] flex items-center">
            <Accordion type="single" collapsible defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is this component?</AccordionTrigger>
                <AccordionContent>
                  A collapsible accordion with animated expand/collapse and spring-animated chevron.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("singleExpand")}>
        <p className="text-body text-fg-muted">{t("singleExpandDescription")}</p>
        <ComponentPreview code={groupedCode}>
          <AccordionGroup type="single" collapsible defaultValue="item-1">
            <AccordionItem value="item-1" index={0}>
              <AccordionTrigger>Getting Started</AccordionTrigger>
              <AccordionContent>
                Install the component and import it into your project. The
                accordion supports both single and multiple expand modes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" index={1}>
              <AccordionTrigger>Styling</AccordionTrigger>
              <AccordionContent>
                The component integrates with the shape system for pill or
                rounded border-radius variants. All animations use spring
                physics.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" index={2}>
              <AccordionTrigger>Accessibility</AccordionTrigger>
              <AccordionContent>
                Built on Base UI Accordion with
                WAI-ARIA attributes, keyboard navigation, and focus
                management.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" index={3}>
              <AccordionTrigger>Animation</AccordionTrigger>
              <AccordionContent>
                Smooth height transitions and spring-animated chevron rotation.
                The proximity hover background tracks your cursor.
              </AccordionContent>
            </AccordionItem>
          </AccordionGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("multiExpand")}>
        <p className="text-body text-fg-muted">{t("multiExpandDescription")}</p>
        <ComponentPreview code={multipleCode}>
          <AccordionGroup type="multiple" defaultValue={["item-1", "item-3"]}>
            <AccordionItem value="item-1" index={0}>
              <AccordionTrigger>First Section</AccordionTrigger>
              <AccordionContent>
                Multiple items can be expanded at the same time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" index={1}>
              <AccordionTrigger>Second Section</AccordionTrigger>
              <AccordionContent>
                Click any trigger to expand or collapse independently.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" index={2}>
              <AccordionTrigger>Third Section</AccordionTrigger>
              <AccordionContent>
                Each item operates independently in multiple mode.
              </AccordionContent>
            </AccordionItem>
          </AccordionGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — Accordion / AccordionGroup`}>
        <PropsTable props={rootProps} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — AccordionItem`}>
        <PropsTable props={itemProps} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — AccordionTrigger`}>
        <PropsTable props={triggerProps} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — AccordionContent`}>
        <PropsTable props={contentProps} />
      </DocSection>
    </DocPage>
  );
}
