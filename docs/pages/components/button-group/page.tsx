"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useIcon } from "@zeron/icons/context";
import { Button } from "@zeron/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@zeron/ui/button-group";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Tooltip, TooltipProvider } from "@zeron/ui/tooltip";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";

function getButtonGroupProps(
  t: ReturnType<typeof useTranslations>
): PropDef[] {
  return [
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      default: '"horizontal"',
      description: t("orientationDescription"),
    },
    {
      name: "aria-label",
      type: "string",
      description: t("ariaLabelDescription"),
    },
  ];
}

function getButtonGroupTextProps(
  t: ReturnType<typeof useTranslations>
): PropDef[] {
  return [
    {
      name: "children",
      type: "ReactNode",
      description: t("textChildrenDescription"),
    },
  ];
}

function getButtonGroupSeparatorProps(
  t: ReturnType<typeof useTranslations>
): PropDef[] {
  return [
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      default: '"vertical"',
      description: t("separatorOrientationDescription"),
    },
  ];
}

export default function ButtonGroupDoc() {
  const t = useTranslations("buttonGroup");
  const Pencil = useIcon("pencil");
  const Copy = useIcon("copy");
  const Archive = useIcon("file-archive");
  const ChevronDown = useIcon("chevron-down");
  const Clock = useIcon("clock");
  const Rocket = useIcon("rocket");
  const ArrowLeft = useIcon("arrow-left");
  const ArrowRight = useIcon("arrow-right");
  const Rotate = useIcon("rotate-ccw");
  const Upload = useIcon("upload");
  const Check = useIcon("check");
  const Message = useIcon("message-circle");

  const [splitOpen, setSplitOpen] = useState(false);

  const basicCode = `import { Button, ButtonGroup } from "./components";

<ButtonGroup aria-label="${t("documentActions")}">
  <Button variant="tertiary" leadingIcon={Pencil}>${t("edit")}</Button>
  <Button variant="tertiary" leadingIcon={Copy}>${t("duplicate")}</Button>
  <Button variant="tertiary" leadingIcon={Archive}>${t("archive")}</Button>
</ButtonGroup>`;

  const splitCode = `import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  MenuItem,
} from "./components";

<ButtonGroup aria-label="${t("publishActions")}">
  <Button>${t("publish")}</Button>
  <ButtonGroupSeparator className="bg-fg-on-brand/20" />
  <DropdownMenu>
    <DropdownTrigger
      render={
        <Button variant="primary" iconOnly size="sm" aria-label="${t("morePublishOptions")}">
          <ChevronDown />
        </Button>
      }
    />
    <DropdownContent align="end">
      <MenuItem index={0} icon={Rocket} label="${t("publishNow")}" />
      <MenuItem index={1} icon={Clock} label="${t("schedule")}" />
    </DropdownContent>
  </DropdownMenu>
</ButtonGroup>`;

  const iconCode = `import { Button, ButtonGroup, Tooltip, TooltipProvider } from "./components";

<TooltipProvider>
  <ButtonGroup aria-label="${t("historyNavigation")}">
    <Tooltip content="${t("previous")}">
      <Button variant="tertiary" iconOnly size="sm" aria-label="${t("previous")}">
        <ArrowLeft />
      </Button>
    </Tooltip>
    <Tooltip content="${t("refresh")}">
      <Button variant="tertiary" iconOnly size="sm" aria-label="${t("refresh")}">
        <Rotate />
      </Button>
    </Tooltip>
    <Tooltip content="${t("next")}">
      <Button variant="tertiary" iconOnly size="sm" aria-label="${t("next")}">
        <ArrowRight />
      </Button>
    </Tooltip>
  </ButtonGroup>
</TooltipProvider>`;

  const addonCode = `import { Button, ButtonGroup, ButtonGroupText } from "./components";

<ButtonGroup aria-label="${t("selectionActions")}">
  <ButtonGroupText>${t("threeSelected")}</ButtonGroupText>
  <Button variant="tertiary" leadingIcon={Upload}>${t("export")}</Button>
</ButtonGroup>`;

  const verticalCode = `import { Button, ButtonGroup } from "./components";

<ButtonGroup orientation="vertical" aria-label="${t("reviewActions")}">
  <Button variant="tertiary" leadingIcon={Check}>${t("approve")}</Button>
  <Button variant="tertiary" leadingIcon={Message}>${t("requestChanges")}</Button>
  <Button variant="tertiary" leadingIcon={Archive}>${t("archive")}</Button>
</ButtonGroup>`;

  return (
    <DocPage
      title="ButtonGroup"
      slug="button-group"
      description={t("description")}
    >
      <DocSection title={t("basic")}>
        <p className="mb-4 max-w-3xl text-body leading-5 text-fg-muted">
          {t("basicDescription")}
        </p>
        <ComponentPreview code={basicCode}>
          <ButtonGroup aria-label={t("documentActions")}>
            <Button variant="tertiary" leadingIcon={Pencil}>
              {t("edit")}
            </Button>
            <Button variant="tertiary" leadingIcon={Copy}>
              {t("duplicate")}
            </Button>
            <Button variant="tertiary" leadingIcon={Archive}>
              {t("archive")}
            </Button>
          </ButtonGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("splitAction")}>
        <p className="mb-4 max-w-3xl text-body leading-5 text-fg-muted">
          {t("splitDescription")}
        </p>
        <ComponentPreview code={splitCode}>
          <ButtonGroup aria-label={t("publishActions")}>
            <Button>{t("publish")}</Button>
            <ButtonGroupSeparator className="bg-fg-on-brand/20" />
            <DropdownMenu open={splitOpen} onOpenChange={setSplitOpen}>
              <DropdownTrigger
                render={
                  <Button
                    active={splitOpen}
                    variant="primary"
                    iconOnly
                    size="sm"
                    aria-label={t("morePublishOptions")}
                  >
                    <ChevronDown />
                  </Button>
                }
              />
              <DropdownContent align="end">
                <MenuItem
                  index={0}
                  icon={Rocket}
                  label={t("publishNow")}
                />
                <MenuItem
                  index={1}
                  icon={Clock}
                  label={t("schedule")}
                />
              </DropdownContent>
            </DropdownMenu>
          </ButtonGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("iconActions")}>
        <p className="mb-4 max-w-3xl text-body leading-5 text-fg-muted">
          {t("iconDescription")}
        </p>
        <ComponentPreview code={iconCode}>
          <TooltipProvider>
            <ButtonGroup aria-label={t("historyNavigation")}>
              <Tooltip content={t("previous")}>
                <Button
                  variant="tertiary"
                  iconOnly
                  size="sm"
                  aria-label={t("previous")}
                >
                  <ArrowLeft />
                </Button>
              </Tooltip>
              <Tooltip content={t("refresh")}>
                <Button
                  variant="tertiary"
                  iconOnly
                  size="sm"
                  aria-label={t("refresh")}
                >
                  <Rotate />
                </Button>
              </Tooltip>
              <Tooltip content={t("next")}>
                <Button
                  variant="tertiary"
                  iconOnly
                  size="sm"
                  aria-label={t("next")}
                >
                  <ArrowRight />
                </Button>
              </Tooltip>
            </ButtonGroup>
          </TooltipProvider>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("contextualAddon")}>
        <p className="mb-4 max-w-3xl text-body leading-5 text-fg-muted">
          {t("addonDescription")}
        </p>
        <ComponentPreview code={addonCode}>
          <ButtonGroup aria-label={t("selectionActions")}>
            <ButtonGroupText>{t("threeSelected")}</ButtonGroupText>
            <Button variant="tertiary" leadingIcon={Upload}>
              {t("export")}
            </Button>
          </ButtonGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("vertical")}>
        <p className="mb-4 max-w-3xl text-body leading-5 text-fg-muted">
          {t("verticalDescription")}
        </p>
        <ComponentPreview code={verticalCode}>
          <ButtonGroup
            orientation="vertical"
            aria-label={t("reviewActions")}
          >
            <Button variant="tertiary" leadingIcon={Check}>
              {t("approve")}
            </Button>
            <Button variant="tertiary" leadingIcon={Message}>
              {t("requestChanges")}
            </Button>
            <Button variant="tertiary" leadingIcon={Archive}>
              {t("archive")}
            </Button>
          </ButtonGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("accessibility")}>
        <div className="flex max-w-3xl flex-col gap-2 text-body leading-5 text-fg-muted">
          <p>{t("accessibilityGroup")}</p>
          <p>{t("accessibilityKeyboard")}</p>
          <p>{t("accessibilitySelection")}</p>
        </div>
      </DocSection>

      <DocSection title={`${t("apiReference")} — ButtonGroup`}>
        <PropsTable props={getButtonGroupProps(t)} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — ButtonGroupText`}>
        <PropsTable props={getButtonGroupTextProps(t)} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — ButtonGroupSeparator`}>
        <PropsTable props={getButtonGroupSeparatorProps(t)} />
      </DocSection>
    </DocPage>
  );
}
