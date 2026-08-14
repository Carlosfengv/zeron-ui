"use client";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  type AlertStatus,
} from "@zeron/ui/alert";
import { Button } from "@zeron/ui/button";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useIcon } from "@zeron/icons/context";
import { useTranslations } from "next-intl";

const basicCode = `import {
  Alert, AlertDescription, AlertIcon, AlertTitle,
} from "./components/alert";

<Alert status="info">
  <AlertIcon><InformationCircle /></AlertIcon>
  <AlertTitle>New workspace settings are available</AlertTitle>
  <AlertDescription>
    Review the updated defaults before publishing your next project.
  </AlertDescription>
</Alert>`;

const statusesCode = `<Alert status="default">...</Alert>
<Alert status="neutral">...</Alert>
<Alert status="info">...</Alert>
<Alert status="warning">...</Alert>
<Alert status="danger">...</Alert>`;

const actionCode = `import { Button } from "./components/button";

<Alert status="warning">
  <AlertIcon><Shield /></AlertIcon>
  <AlertTitle>Two-factor authentication is not enabled</AlertTitle>
  <AlertDescription>
    Enable it to help keep your workspace secure.
  </AlertDescription>
  <AlertAction>
    <Button size="sm" variant="tertiary">Enable</Button>
  </AlertAction>
</Alert>`;

const statuses: Array<{
  status: AlertStatus;
  title: string;
  description: string;
}> = [
  {
    status: "default",
    title: "Workspace settings need review",
    description: "Check the latest defaults before you publish.",
  },
  {
    status: "neutral",
    title: "Draft saved",
    description: "Your latest changes are available on this device.",
  },
  {
    status: "info",
    title: "A new version is available",
    description: "Update when you are ready to use the latest improvements.",
  },
  {
    status: "warning",
    title: "Your trial ends in 3 days",
    description: "Choose a plan to keep your projects active.",
  },
  {
    status: "danger",
    title: "Payment could not be processed",
    description: "Update your billing details and try again.",
  },
];

export default function AlertDoc() {
  const t = useTranslations("alert");
  const InformationCircle = useIcon("doc-info-item");
  const Bell = useIcon("bell");
  const Lightbulb = useIcon("lightbulb");
  const Shield = useIcon("shield");
  const CancelCircle = useIcon("circle-x");
  const statusIcons = {
    default: Bell,
    neutral: Lightbulb,
    info: InformationCircle,
    warning: Shield,
    danger: CancelCircle,
  };

  const rootProps: PropDef[] = [
    {
      name: "status",
      type: '"default" | "neutral" | "info" | "warning" | "danger"',
      default: '"default"',
      description: t("statusProp"),
    },
    { name: "children", type: "ReactNode", description: t("childrenProp") },
    { name: "className", type: "string", description: t("classNameProp") },
  ];

  const partProps: PropDef[] = [
    { name: "AlertIcon", type: "div", description: t("iconPart") },
    { name: "AlertTitle", type: "div", description: t("titlePart") },
    {
      name: "AlertDescription",
      type: "div",
      description: t("descriptionPart"),
    },
    { name: "AlertAction", type: "div", description: t("actionPart") },
  ];

  return (
    <DocPage
      title="Alert"
      slug="alert"
      description="A composable in-context callout for default and semantic status states."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Alert status="info" className="w-full max-w-xl">
            <AlertIcon>
              <InformationCircle size={16} strokeWidth={1.75} />
            </AlertIcon>
            <AlertTitle>{t("basicTitle")}</AlertTitle>
            <AlertDescription>{t("basicDescription")}</AlertDescription>
          </Alert>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("statuses")}>
        <ComponentPreview code={statusesCode}>
          <div className="flex w-full max-w-xl flex-col gap-3">
            {statuses.map(({ status, title, description }) => {
              const Icon = statusIcons[status];
              return (
                <Alert key={status} status={status}>
                  <AlertIcon>
                    <Icon size={16} strokeWidth={1.75} />
                  </AlertIcon>
                  <AlertTitle>{title}</AlertTitle>
                  <AlertDescription>{description}</AlertDescription>
                </Alert>
              );
            })}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("action")}>
        <ComponentPreview code={actionCode}>
          <Alert status="warning" className="w-full max-w-xl">
            <AlertIcon>
              <Shield size={16} strokeWidth={1.75} />
            </AlertIcon>
            <AlertTitle>{t("actionTitle")}</AlertTitle>
            <AlertDescription>{t("actionDescription")}</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="tertiary">
                {t("actionLabel")}
              </Button>
            </AlertAction>
          </Alert>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-medium text-fg-default">Alert</h3>
            <PropsTable props={rootProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-medium text-fg-default">
              {t("parts")}
            </h3>
            <PropsTable props={partProps} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
