"use client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
} from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";
import { Textarea } from "@zeron/ui/textarea";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { AnatomySection } from "@docs/components/content/AnatomyDiagram";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const basicCode = `import { Field, FieldDescription, FieldLabel } from "./components";
import { Input } from "./components";

<Field name="workspace">
  <FieldLabel>Workspace name</FieldLabel>
  <Input placeholder="Production" />
  <FieldDescription>Shown to every member of your team.</FieldDescription>
</Field>`;

const validationCode = `import { Field, FieldError, FieldLabel } from "./components";
import { Input } from "./components";

<Field name="endpoint" invalid>
  <FieldLabel>API endpoint</FieldLabel>
  <Input defaultValue="api.example.com" />
  <FieldError>Enter a complete HTTP or HTTPS URL.</FieldError>
</Field>`;

const groupCode = `import {
  Field,
  FieldGroup,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
} from "./components";

<Fieldset>
  <FieldsetLegend>Provider profile</FieldsetLegend>
  <FieldGroup>
    <Field name="name">
      <FieldLabel>Name</FieldLabel>
      <Input />
    </Field>
    <Field name="description">
      <FieldLabel>Description</FieldLabel>
      <Textarea />
    </Field>
  </FieldGroup>
</Fieldset>`;

export default function FieldDoc() {
  const t = useTranslations("field");
  const fieldProps: PropDef[] = [
    { name: "name", type: "string", description: t("nameProp") },
    { name: "invalid", type: "boolean", default: "false", description: t("invalidProp") },
    { name: "disabled", type: "boolean", default: "false", description: t("disabledProp") },
  ];

  return (
    <DocPage
      title="Field"
      slug="field"
      description="Accessible form composition for labels, descriptions, validation messages, groups, and fieldsets."
    >
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "description",
              label: "Description",
              code: basicCode,
              preview: <div className="w-96 max-w-full"><Field name="workspace"><FieldLabel>{t("workspaceName")}</FieldLabel><Input placeholder={t("workspacePlaceholder")} /><FieldDescription>{t("workspaceDescription")}</FieldDescription></Field></div>,
            },
            {
              value: "validation",
              label: "Validation",
              code: validationCode,
              preview: <div className="w-96 max-w-full"><Field name="endpoint" invalid><FieldLabel>{t("endpoint")}</FieldLabel><Input defaultValue="api.example.com" /><FieldError>{t("endpointError")}</FieldError></Field></div>,
            },
            {
              value: "disabled",
              label: "Disabled",
              code: `<Field name="workspace" disabled><FieldLabel>Workspace name</FieldLabel><Input defaultValue="Production" /></Field>`,
              preview: <div className="w-96 max-w-full"><Field name="workspace" disabled><FieldLabel>{t("workspaceName")}</FieldLabel><Input defaultValue="Production" /></Field></div>,
            },
          ]}
        />
      </DocSection>

      <AnatomySection
        boundaryTarget='[data-slot="input"]'
        code={basicCode}
        component="Field"
        items={[
          { label: { en: "Field label", zh: "字段标签" }, target: '[data-slot="field-label"]', side: "top" },
          { label: { en: "Input control", zh: "输入控件" }, target: '[data-slot="input"]', side: "top" },
          { label: { en: "Description", zh: "辅助说明" }, target: '[data-slot="field-description"]', side: "bottom" },
        ]}
      >
        <Field name="anatomy-workspace" className="w-72 max-w-[70vw]">
          <FieldLabel>Workspace name</FieldLabel>
          <Input placeholder="Production" />
          <FieldDescription>Shown to every team member.</FieldDescription>
        </Field>
      </AnatomySection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <div className="w-96 max-w-full">
            <Field name="workspace">
              <FieldLabel>{t("workspaceName")}</FieldLabel>
              <Input placeholder={t("workspacePlaceholder")} />
              <FieldDescription>{t("workspaceDescription")}</FieldDescription>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("validation")}>
        <ComponentPreview code={validationCode}>
          <div className="w-96 max-w-full">
            <Field name="endpoint" invalid>
              <FieldLabel>{t("endpoint")}</FieldLabel>
              <Input defaultValue="api.example.com" />
              <FieldError>{t("endpointError")}</FieldError>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("groups")}>
        <ComponentPreview code={groupCode}>
          <div className="w-96 max-w-full">
            <Fieldset>
              <FieldsetLegend>{t("profile")}</FieldsetLegend>
              <FieldGroup>
                <Field name="name">
                  <FieldLabel>{t("displayName")}</FieldLabel>
                  <Input placeholder="DeepSeek Production" />
                </Field>
                <Field name="description">
                  <FieldLabel>{t("descriptionLabel")}</FieldLabel>
                  <Textarea placeholder={t("descriptionPlaceholder")} />
                </Field>
              </FieldGroup>
            </Fieldset>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={fieldProps} />
      </DocSection>
    </DocPage>
  );
}
