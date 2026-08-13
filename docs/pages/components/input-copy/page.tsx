"use client";

import { useState } from "react";
import { InputCopy } from "@zeron/ui/input-copy";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import { InputCopy } from "./components";

<InputCopy value="npx zeron-ui add input-copy" />`;

const labelCode = `import { InputCopy } from "./components";

<InputCopy
  label="Install command"
  value="npx zeron-ui add input-copy"
/>`;

const buttonVariantCode = `import { InputCopy } from "./components";

<InputCopy
  variant="button"
  value="npx zeron-ui add input-copy"
/>`;

const alignLeftCode = `import { InputCopy } from "./components";

<InputCopy
  align="left"
  value="npx zeron-ui add input-copy"
/>
<InputCopy
  variant="button"
  align="left"
  value="npx zeron-ui add input-copy"
/>`;

const disabledCode = `import { InputCopy } from "./components";

<InputCopy
  label="Invite code"
  value="ABCD-1234-EFGH"
  disabled
/>`;

const callbackCode = `import { useState } from "react";
import { InputCopy } from "./components";

const [copyCount, setCopyCount] = useState(0);

<InputCopy
  label="Share link"
  value="https://zeron-ui.vercel.app/r/input-copy"
  onCopy={() => setCopyCount((count) => count + 1)}
/>

<p>Copied {copyCount} times</p>`;

export default function InputCopyDoc() {
  const t = useTranslations("inputCopy");
  const [copyCount, setCopyCount] = useState(0);
  const inputCopyProps: PropDef[] = [
    { name: "value", type: "string", description: t("value") },
    { name: "label", type: "string", description: t("label") },
    { name: "variant", type: '"icon" | "button"', default: '"icon"', description: t("variant") },
    { name: "align", type: '"right" | "left"', default: '"right"', description: t("align") },
    { name: "onCopy", type: "() => void", description: t("onCopy") },
    { name: "disabled", type: "boolean", default: "false", description: t("disabledProp") },
  ];

  return (
    <DocPage
      title="InputCopy"
      slug="input-copy"
      description="Read-only input with a copy-to-clipboard button and animated check feedback."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <div className="w-72">
            <InputCopy value="npx zeron-ui add input-copy" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("withLabel")}>
        <ComponentPreview code={labelCode}>
          <div className="w-72">
            <InputCopy
              label="Install command"
              value="npx zeron-ui add input-copy"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("buttonVariant")}>
        <ComponentPreview code={buttonVariantCode}>
          <div className="w-72">
            <InputCopy
              variant="button"
              value="npx zeron-ui add input-copy"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("leftAligned")}>
        <ComponentPreview code={alignLeftCode}>
          <div className="flex flex-col gap-4 w-72">
            <InputCopy
              align="left"
              value="npx zeron-ui add input-copy"
            />
            <InputCopy
              variant="button"
              align="left"
              value="npx zeron-ui add input-copy"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("disabled")}>
        <ComponentPreview code={disabledCode}>
          <div className="w-72">
            <InputCopy
              label="Invite code"
              value="ABCD-1234-EFGH"
              disabled
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("copyCallback")}>
        <ComponentPreview code={callbackCode}>
          <div className="w-72 flex flex-col gap-2">
            <InputCopy
              label="Share link"
              value="https://zeron-ui.vercel.app/r/input-copy"
              onCopy={() => setCopyCount((count) => count + 1)}
            />
            <p className="text-label text-fg-muted px-1">
              Copied {copyCount} {copyCount === 1 ? "time" : "times"}
            </p>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={inputCopyProps} />
      </DocSection>
    </DocPage>
  );
}
