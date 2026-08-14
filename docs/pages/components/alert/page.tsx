"use client";

import { useState } from "react";

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
import { Switch } from "@zeron/ui/switch";
import { useIcon } from "@zeron/icons/context";
import { useTranslations } from "next-intl";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlaygroundLayout,
  PlaygroundPanel,
} from "@docs/components/playground/playground";

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

function buildAlertCode({
  status,
  withIcon,
  withDescription,
  withAction,
}: {
  status: AlertStatus;
  withIcon: boolean;
  withDescription: boolean;
  withAction: boolean;
}) {
  const parts = [
    "Alert",
    ...(withIcon ? ["AlertIcon"] : []),
    "AlertTitle",
    ...(withDescription ? ["AlertDescription"] : []),
    ...(withAction ? ["AlertAction"] : []),
  ];
  const imports = [`import { ${parts.join(", ")} } from "./components/alert";`];
  if (withAction) imports.push('import { Button } from "./components/button";');

  const children = [
    ...(withIcon ? ["  <AlertIcon><InformationCircle /></AlertIcon>"] : []),
    "  <AlertTitle>Workspace settings need review</AlertTitle>",
    ...(withDescription
      ? [
          "  <AlertDescription>",
          "    Check the latest defaults before you publish.",
          "  </AlertDescription>",
        ]
      : []),
    ...(withAction
      ? [
          "  <AlertAction>",
          "    <Button size=\"sm\" variant=\"tertiary\">View details</Button>",
          "  </AlertAction>",
        ]
      : []),
  ];
  const statusProp = status === "default" ? "" : ` status="${status}"`;

  return `${imports.join("\n")}\n\n<Alert${statusProp}>\n${children.join("\n")}\n</Alert>`;
}

function AlertPlayground() {
  const t = useTranslations("alert");
  const InformationCircle = useIcon("doc-info-item");
  const [status, setStatus] = useState<AlertStatus>("default");
  const [withIcon, setWithIcon] = useState(true);
  const [withDescription, setWithDescription] = useState(true);
  const [withAction, setWithAction] = useState(false);

  const code = buildAlertCode({
    status,
    withIcon,
    withDescription,
    withAction,
  });

  const randomize = () => {
    const pick = <T,>(values: readonly T[]) =>
      values[Math.floor(Math.random() * values.length)];

    setStatus(pick(["default", "neutral", "info", "warning", "danger"] as const));
    setWithIcon(Math.random() > 0.25);
    setWithDescription(Math.random() > 0.2);
    setWithAction(Math.random() > 0.5);
  };

  const controls = (
    <PlaygroundPanel title={t("playground")} onShuffle={randomize}>
      <PlaySection label={t("playAlert")} />
      <div>
        <PlayField label={t("status")}>
          <PlaySelect
            value={status}
            onChange={(value) => setStatus(value as AlertStatus)}
            options={[
              { value: "default", label: "Default" },
              { value: "neutral", label: "Neutral" },
              { value: "info", label: "Info" },
              { value: "warning", label: "Warning" },
              { value: "danger", label: "Danger" },
            ]}
          />
        </PlayField>
        <Switch
          label={t("icon")}
          checked={withIcon}
          onToggle={() => setWithIcon((value) => !value)}
          className={PLAY_SWITCH}
        />
        <Switch
          label={t("description")}
          checked={withDescription}
          onToggle={() => setWithDescription((value) => !value)}
          className={PLAY_SWITCH}
        />
        <Switch
          label={t("action")}
          checked={withAction}
          onToggle={() => setWithAction((value) => !value)}
          className={PLAY_SWITCH}
        />
      </div>
    </PlaygroundPanel>
  );

  return (
    <PlaygroundLayout
      controls={controls}
      preview={
        <ComponentPreview code={code} minHeightClass="min-h-[240px]">
          <Alert status={status} className="w-full max-w-xl">
            {withIcon && (
              <AlertIcon>
                <InformationCircle size={16} strokeWidth={1.75} />
              </AlertIcon>
            )}
            <AlertTitle>Workspace settings need review</AlertTitle>
            {withDescription && (
              <AlertDescription>
                Check the latest defaults before you publish.
              </AlertDescription>
            )}
            {withAction && (
              <AlertAction>
                <Button size="sm" variant="tertiary">
                  View details
                </Button>
              </AlertAction>
            )}
          </Alert>
        </ComponentPreview>
      }
    />
  );
}

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
      <DocSection title={t("playground")}>
        <AlertPlayground />
      </DocSection>

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
