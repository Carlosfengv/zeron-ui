"use client";

import { Input } from "@zeron/ui/input";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import { Input } from "./components";

<Input type="email" placeholder="you@example.com" />`;

const variantsCode = `import { Input } from "./components";

<Input variant="outline" placeholder="Outline" />
<Input variant="secondary" placeholder="Secondary" />
<Input variant="ghost" placeholder="Ghost" />`;

const sizesCode = `import { Input } from "./components";

<Input size="sm" placeholder="Small" />
<Input size="default" placeholder="Default" />
<Input size="lg" placeholder="Large" />
<Input size="xl" placeholder="Extra large" />`;

const statesCode = `import { Input } from "./components";

<Input value="Disabled value" disabled readOnly />
<Input
  defaultValue="not-an-email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error">Enter a valid email address.</p>`;

const fileCode = `import { Input } from "./components";

<Input type="file" accept="image/*" />`;

export default function InputDoc() {
  const t = useTranslations("input");
  const inputProps: PropDef[] = [
    { name: "variant", type: '"outline" | "secondary" | "ghost"', default: '"outline"', description: t("variant") },
    { name: "size", type: '"sm" | "default" | "lg" | "xl"', default: '"default"', description: t("size") },
    { name: "type", type: "React.HTMLInputTypeAttribute", default: '"text"', description: t("type") },
    { name: "disabled", type: "boolean", default: "false", description: t("disabled") },
    { name: "aria-invalid", type: "boolean | \"true\" | \"false\"", default: "false", description: t("ariaInvalid") },
  ];
  return (
    <DocPage
      title="Input"
      slug="input"
      description="Text input with outline, secondary, and ghost variants, four sizes, and accessible validation states."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <div className="w-72 max-w-full">
            <Input type="email" placeholder="you@example.com" aria-label="Email address" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("variants")}>
        <ComponentPreview code={variantsCode}>
          <div className="flex w-72 max-w-full flex-col gap-3">
            <Input variant="outline" placeholder="Outline" aria-label="Outline input" />
            <Input variant="secondary" placeholder="Secondary" aria-label="Secondary input" />
            <Input variant="ghost" placeholder="Ghost" aria-label="Ghost input" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("sizes")}>
        <ComponentPreview code={sizesCode}>
          <div className="flex w-72 max-w-full flex-col gap-3">
            <Input size="sm" placeholder="Small" aria-label="Small input" />
            <Input size="default" placeholder="Default" aria-label="Default input" />
            <Input size="lg" placeholder="Large" aria-label="Large input" />
            <Input size="xl" placeholder="Extra large" aria-label="Extra large input" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("states")}>
        <ComponentPreview code={statesCode}>
          <div className="flex w-72 max-w-full flex-col gap-3">
            <Input value="Disabled value" disabled readOnly aria-label="Disabled input" />
            <div className="flex flex-col gap-1.5">
              <Input
                defaultValue="not-an-email"
                aria-invalid="true"
                aria-describedby="input-email-error"
                aria-label="Invalid email"
              />
              <p id="input-email-error" className="px-1 text-label text-fg-danger">
                Enter a valid email address.
              </p>
            </div>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("fileInput")}>
        <ComponentPreview code={fileCode}>
          <div className="w-72 max-w-full">
            <Input type="file" accept="image/*" aria-label="Choose an image" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Focus behavior">
        <p className="max-w-3xl text-body leading-5 text-fg-muted">
          Text-editing controls may show their focus ring after either pointer or keyboard focus, according to the browser&apos;s <code>:focus-visible</code> behavior.
        </p>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={inputProps} />
      </DocSection>
    </DocPage>
  );
}
