"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@zeron/ui/button";
import { Switch } from "@zeron/ui/switch";
import {
  toast,
  ToastStack,
  type ToastData,
  type ToastPosition,
  type ToastStatus,
} from "@zeron/ui/toast";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import {
  PLAY_SWITCH,
  PlayDivider,
  PlayField,
  PlaygroundLayout,
  PlaygroundPanel,
  PlaySection,
  PlaySelect,
} from "@docs/components/playground/playground";

const POSITIONS: ToastPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const STATUSES: ToastStatus[] = [
  "neutral",
  "info",
  "loading",
  "success",
  "error",
];

const setupCode = `// app/providers.tsx
import { Toaster } from "./components";

export function App({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        offset={{ top: 24, right: 32 }}
      />
    </>
  );
}

// features/publish-button.tsx
"use client";

import { Button, toast } from "./components";

export function PublishButton() {
  return (
    <Button onClick={() => toast.success("Project published")}>
      Publish project
    </Button>
  );
}`;

const statusCode = `import { toast } from "./components";

toast("Changes saved");
toast.info("A new version is available");
toast.success("Project published");
toast.error("Upload failed", {
  description: "Check your connection and try again.",
});`;

const loadingCode = `const id = toast.loading("Publishing project", {
  description: "Optimizing assets and preparing the release.",
});

publishProject().then(() => {
  toast.update(id, {
    status: "success",
    title: "Project published",
    description: "The latest version is now live.",
  });
});`;

const actionCode = `toast.success("Member removed", {
  description: "Alex no longer has access to this workspace.",
  action: {
    label: "Undo",
    onClick: () => restoreMember(),
  },
});`;

function buildPlaygroundCode({
  position,
  offset,
  status,
  title,
  description,
  action,
  dismissible,
  descriptionText,
  undoLabel,
  showLabel,
}: {
  position: ToastPosition;
  offset: number;
  status: ToastStatus;
  title: string;
  description: boolean;
  action: boolean;
  dismissible: boolean;
  descriptionText: string;
  undoLabel: string;
  showLabel: string;
}) {
  const toasterProps = [
    `position="${position}"`,
    ...(offset === 16 ? [] : [`offset={${offset}}`]),
  ].join(" ");
  const method = status === "neutral" ? "toast" : `toast.${status}`;
  const options = [
    ...(description
      ? [`  description: ${JSON.stringify(descriptionText)},`]
      : []),
    ...(action
      ? [
          "  action: {",
          `    label: ${JSON.stringify(undoLabel)},`,
          "    onClick: () => restoreMember(),",
          "  },",
        ]
      : []),
    ...(!dismissible ? ["  dismissible: false,"] : []),
  ];
  const invocation = options.length
    ? `${method}(${JSON.stringify(title)}, {\n${options.join("\n")}\n})`
    : `${method}(${JSON.stringify(title)})`;

  return `import { Button, Toaster, toast } from "./components";

<Toaster ${toasterProps} />

<Button onClick={() => ${invocation}}>
  ${showLabel}
</Button>`;
}

function SetupDemo() {
  const t = useTranslations("toastDoc");

  return (
    <ComponentPreview code={setupCode} minHeightClass="min-h-[280px]">
      <div className="grid w-full max-w-3xl items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
        <div className="flex min-h-36 flex-col justify-between rounded-xl border-[0.5px] border-border bg-surface-raised p-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-label font-semibold text-fg-brand">
                {t("setupStepOne")}
              </span>
              <span className="text-label text-fg-subtle">
                {t("setupRootLabel")}
              </span>
            </div>
            <h3 className="mt-3 text-body font-semibold text-fg-default">
              {t("setupMountTitle")}
            </h3>
            <p className="mt-1 text-label text-fg-muted">
              {t("setupMountBody")}
            </p>
          </div>
          <code className="mt-4 w-fit rounded-lg bg-info-surface px-2 py-1 text-label font-medium text-fg-info">
            {"<Toaster />"}
          </code>
        </div>

        <span
          aria-hidden="true"
          className="justify-self-center text-title text-fg-subtle rotate-90 sm:rotate-0"
        >
          →
        </span>

        <div className="flex min-h-36 flex-col justify-between rounded-xl border-[0.5px] border-border bg-surface-raised p-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-label font-semibold text-fg-brand">
                {t("setupStepTwo")}
              </span>
              <span className="text-label text-fg-subtle">
                {t("setupClientLabel")}
              </span>
            </div>
            <h3 className="mt-3 text-body font-semibold text-fg-default">
              {t("setupCallTitle")}
            </h3>
            <p className="mt-1 text-label text-fg-muted">
              {t("setupCallBody")}
            </p>
          </div>
          <Button
            className="mt-4 self-start"
            size="sm"
            onClick={() =>
              toast.success(t("setupToastTitle"), {
                description: t("setupToastDescription"),
              })
            }
          >
            {t("setupShowToast")}
          </Button>
        </div>
      </div>
    </ComponentPreview>
  );
}

function ToastPlayground() {
  const t = useTranslations("toastDoc");
  const [position, setPosition] =
    useState<ToastPosition>("bottom-right");
  const [offset, setOffset] = useState(16);
  const [status, setStatus] = useState<ToastStatus>("success");
  const [withDescription, setWithDescription] = useState(true);
  const [withAction, setWithAction] = useState(false);
  const [dismissible, setDismissible] = useState(true);
  const [visible, setVisible] = useState(true);
  const [previewSeed, setPreviewSeed] = useState(0);

  const showPreview = () => {
    setPreviewSeed((value) => value + 1);
    setVisible(true);
  };

  const updatePosition = (value: ToastPosition) => {
    setPosition(value);
    showPreview();
  };

  const previewToast: ToastData = {
    id: `toast-playground-${previewSeed}`,
    title: t("playgroundTitle"),
    status,
    description: withDescription ? t("playgroundDescription") : undefined,
    dismissible,
    action: withAction
      ? {
          label: t("undo"),
          onClick: () => setVisible(false),
        }
      : undefined,
  };

  const randomize = () => {
    const pick = <T,>(items: readonly T[]) =>
      items[Math.floor(Math.random() * items.length)];
    setPosition(pick(POSITIONS));
    setOffset(pick([16, 24, 32] as const));
    setStatus(pick(STATUSES));
    setWithDescription(Math.random() > 0.35);
    setWithAction(Math.random() > 0.7);
    setDismissible(Math.random() > 0.2);
    showPreview();
  };

  const code = buildPlaygroundCode({
    position,
    offset,
    status,
    title: t("playgroundTitle"),
    description: withDescription,
    action: withAction,
    dismissible,
    descriptionText: t("playgroundDescription"),
    undoLabel: t("undo"),
    showLabel: t("showToast"),
  });

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label={t("placementControls")} />
      <div>
        <PlayField label={t("position")}>
          <PlaySelect
            value={position}
            onChange={(value) => updatePosition(value as ToastPosition)}
            options={POSITIONS.map((value) => ({ value, label: value }))}
          />
        </PlayField>
        <PlayField label={t("offset")}>
          <PlaySelect
            value={String(offset)}
            onChange={(value) => {
              setOffset(Number(value));
              showPreview();
            }}
            options={[16, 24, 32].map((value) => ({
              value: String(value),
              label: `${value} px`,
            }))}
          />
        </PlayField>
      </div>

      <PlayDivider />

      <PlaySection label={t("contentControls")} />
      <div>
        <PlayField label={t("status")}>
          <PlaySelect
            value={status}
            onChange={(value) => {
              setStatus(value as ToastStatus);
              showPreview();
            }}
            options={STATUSES.map((value) => ({
              value,
              label: value[0].toUpperCase() + value.slice(1),
            }))}
          />
        </PlayField>
        <Switch
          label={t("descriptionControl")}
          checked={withDescription}
          onToggle={() => {
            setWithDescription((value) => !value);
            showPreview();
          }}
          className={PLAY_SWITCH}
        />
        <Switch
          label={t("actionControl")}
          checked={withAction}
          onToggle={() => {
            setWithAction((value) => !value);
            showPreview();
          }}
          className={PLAY_SWITCH}
        />
        <Switch
          label={t("dismissibleControl")}
          checked={dismissible}
          onToggle={() => {
            setDismissible((value) => !value);
            showPreview();
          }}
          className={PLAY_SWITCH}
        />
      </div>
    </PlaygroundPanel>
  );

  return (
    <PlaygroundLayout
      controls={controls}
      preview={
        <ComponentPreview
          code={code}
          minHeightClass="min-h-[380px]"
          padding="none"
          onReplay={showPreview}
          inspectable={false}
        >
          <div className="relative h-[380px] w-full overflow-hidden">
            <div className="absolute inset-0 grid place-items-center">
              <Button variant="secondary" onClick={showPreview}>
                {t("showToast")}
              </Button>
            </div>
            <ToastStack
              toasts={visible ? [previewToast] : []}
              onDismiss={() => setVisible(false)}
              position={position}
              placement="absolute"
              portal={false}
              offset={offset}
            />
          </div>
        </ComponentPreview>
      }
    />
  );
}

function buildPositionCode(position: ToastPosition) {
  return `import { Toaster } from "./components";

<Toaster position="${position}" />`;
}

function PositionDemo() {
  const t = useTranslations("toastDoc");
  const [position, setPosition] =
    useState<ToastPosition>("top-right");
  const [previewSeed, setPreviewSeed] = useState(0);

  const selectPosition = (value: ToastPosition) => {
    setPosition(value);
    setPreviewSeed((seed) => seed + 1);
  };

  const previewToast: ToastData = {
    id: `toast-position-${previewSeed}`,
    title: t("positionPreview"),
    description: position,
    status: "info",
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-3xl text-body leading-5 text-fg-muted">
        {t("positionsIntro")}
      </p>
      <ComponentPreview
        code={buildPositionCode(position)}
        minHeightClass="min-h-[420px]"
        padding="none"
        inspectable={false}
      >
        <div className="relative h-[420px] w-full overflow-hidden">
          <div className="absolute inset-0 z-raised grid place-items-center px-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {POSITIONS.map((value) => (
                <Button
                  key={value}
                  variant={position === value ? "neutral" : "tertiary"}
                  size="sm"
                  active={position === value}
                  onClick={() => selectPosition(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
          <ToastStack
            toasts={[previewToast]}
            position={position}
            placement="absolute"
            portal={false}
            offset={16}
          />
        </div>
      </ComponentPreview>
    </div>
  );
}

export default function ToastDoc() {
  const t = useTranslations("toastDoc");
  const toastProps: PropDef[] = [
    { name: "toast", type: "ToastData", description: t("toastDataProp") },
    { name: "position", type: "ToastPosition", default: '"bottom-right"', description: t("positionProp") },
    { name: "onDismiss", type: "(id: ToastId) => void", description: t("onDismissProp") },
    { name: "classNames", type: "ToastClassNames", description: t("classNamesProp") },
    { name: "icons", type: "Partial<Record<ToastStatus, ReactNode>>", description: t("iconsProp") },
    { name: "renderToast", type: "(toast: ToastData) => ReactNode", description: t("renderToastProp") },
    { name: "closeLabel", type: "string", default: '"Dismiss notification"', description: t("closeLabelProp") },
  ];
  const toasterProps: PropDef[] = [
    { name: "position", type: "ToastPosition", default: '"bottom-right"', description: t("positionProp") },
    { name: "offset", type: "number | string | { top?; right?; bottom?; left? }", default: "16 + safe area", description: t("offsetProp") },
    { name: "duration", type: "number", default: "4200", description: t("durationProp") },
    { name: "maxVisible", type: "number", default: "4", description: t("maxVisibleProp") },
    { name: "placement", type: '"static" | "fixed" | "absolute"', default: '"fixed"', description: t("placementProp") },
    { name: "portal", type: "boolean", default: "true when fixed", description: t("portalProp") },
    { name: "container", type: "Element | null", description: t("containerProp") },
    { name: "closeLabel", type: "string", default: '"Dismiss notification"', description: t("closeLabelProp") },
    { name: "classNames", type: "ToastClassNames", description: t("classNamesProp") },
  ];
  const toastOptions: PropDef[] = [
    { name: "description", type: "ReactNode", description: t("descriptionProp") },
    { name: "status", type: '"neutral" | "info" | "loading" | "success" | "error"', default: '"neutral"', description: t("statusProp") },
    { name: "duration", type: "number", description: t("itemDurationProp") },
    { name: "dismissible", type: "boolean", default: "true", description: t("dismissibleProp") },
    { name: "icon", type: "ReactNode", description: t("iconProp") },
    { name: "action", type: "ToastAction", description: t("actionProp") },
    { name: "id", type: "string | number", description: t("idProp") },
  ];

  return (
    <DocPage
      title="Toast"
      slug="toast"
      description="Animated notification stack with semantic statuses, automatic dismissal, actions, drag gestures, and a small imperative API."
    >
      <DocSection title={t("playground")}>
        <ToastPlayground />
      </DocSection>

      <DocSection title={t("setup")}>
        <SetupDemo />
      </DocSection>

      <DocSection title={t("positions")}>
        <PositionDemo />
      </DocSection>

      <DocSection title={t("statuses")}>
        <ComponentPreview code={statusCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => toast(t("changesSaved"))}>
              {t("neutral")}
            </Button>
            <Button variant="secondary" onClick={() => toast.info(t("versionAvailable"))}>
              {t("info")}
            </Button>
            <Button variant="secondary" onClick={() => toast.success(t("projectPublished"))}>
              {t("success")}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.error(t("uploadFailed"), {
                  description: t("retryDescription"),
                })
              }
            >
              {t("error")}
            </Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("loadingUpdate")}>
        <ComponentPreview code={loadingCode}>
          <Button
            variant="secondary"
            onClick={() => {
              const id = toast.loading(t("publishingProject"), {
                description: t("optimizingAssets"),
              });
              window.setTimeout(() => {
                toast.update(id, {
                  status: "success",
                  title: t("projectPublished"),
                  description: t("latestLive"),
                });
              }, 1400);
            }}
          >
            {t("runLoading")}
          </Button>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("actions")}>
        <ComponentPreview code={actionCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                toast.success(t("memberRemoved"), {
                  description: t("noAccess"),
                  action: {
                    label: t("undo"),
                    onClick: () => toast.info(t("memberRestored")),
                  },
                })
              }
            >
              {t("showAction")}
            </Button>
            <Button variant="ghost" onClick={() => toast.dismiss()}>
              {t("dismissAll")}
            </Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-title font-semibold text-fg-default">Toast</h3>
            <PropsTable props={toastProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-title font-semibold text-fg-default">Toaster</h3>
            <PropsTable props={toasterProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-title font-semibold text-fg-default">ToastOptions</h3>
            <PropsTable props={toastOptions} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
