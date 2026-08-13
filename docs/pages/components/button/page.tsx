"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useIcon } from "@zeron/icons/context";
import { Button } from "@zeron/ui/button";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { Switch } from "@zeron/ui/switch";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
  PlaygroundLayout,
} from "@docs/components/playground/playground";

function getButtonProps(t: ReturnType<typeof useTranslations>): PropDef[] {
  return [
    { name: "variant", type: '"primary" | "neutral" | "destructive" | "secondary" | "tertiary" | "ghost"', default: '"primary"', description: t("visualStyle") },
    { name: "size", type: '"sm" | "md" | "lg" | "icon-sm" | "icon" | "icon-lg"', default: '"md"', description: t("buttonSize") },
    { name: "loading", type: "boolean", default: "false", description: t("loadingDescription") },
    { name: "active", type: "boolean", default: "false", description: t("activeDescription") },
    { name: "leadingIcon", type: "IconComponent", description: t("leadingIconDescription") },
    { name: "trailingIcon", type: "IconComponent", description: t("trailingIconDescription") },
    { name: "asChild", type: "boolean", default: "false", description: t("asChildDescription") },
    { name: "disabled", type: "boolean", default: "false", description: t("disabledDescription") },
  ];
}

type ButtonVariant = "primary" | "neutral" | "destructive" | "secondary" | "tertiary" | "ghost";

function DemoGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-label font-medium text-fg-subtle">{label}</span>
      {children}
    </div>
  );
}

function VariantGuide() {
  const t = useTranslations("button");
  const rows: Array<{
    variant: ButtonVariant;
    label: string;
    emphasis: string;
    useWhen: string;
    avoid: string;
  }> = [
    {
      variant: "primary",
      label: "Primary",
      emphasis: t("highEmphasis"),
      useWhen: t("primaryUseWhen"),
      avoid: t("primaryAvoid"),
    },
    {
      variant: "neutral",
      label: "Neutral",
      emphasis: t("highEmphasis"),
      useWhen: t("neutralUseWhen"),
      avoid: t("neutralAvoid"),
    },
    {
      variant: "destructive",
      label: "Destructive",
      emphasis: t("highEmphasis"),
      useWhen: t("destructiveUseWhen"),
      avoid: t("destructiveAvoid"),
    },
    {
      variant: "secondary",
      label: "Secondary",
      emphasis: t("mediumEmphasis"),
      useWhen: t("secondaryUseWhen"),
      avoid: t("secondaryAvoid"),
    },
    {
      variant: "tertiary",
      label: "Tertiary",
      emphasis: t("lowEmphasis"),
      useWhen: t("tertiaryUseWhen"),
      avoid: t("tertiaryAvoid"),
    },
    {
      variant: "ghost",
      label: "Ghost",
      emphasis: t("lowEmphasis"),
      useWhen: t("ghostUseWhen"),
      avoid: t("ghostAvoid"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-body leading-5 text-fg-muted">
        {t("choosingVariantIntro")}
      </p>
      <ScrollArea
        orientation="horizontal"
        viewportClassName="scroll-fade-x"
        className="w-full"
      >
        <table className="w-full min-w-[820px] border-collapse text-label">
          <thead>
            <tr className="border-b border-border">
              <th className="w-[150px] px-3 py-2 text-left font-semibold text-fg-default">
                {t("guideVariant")}
              </th>
              <th className="w-[120px] px-3 py-2 text-left font-semibold text-fg-default">
                {t("guideEmphasis")}
              </th>
              <th className="px-3 py-2 text-left font-semibold text-fg-default">
                {t("guideUseWhen")}
              </th>
              <th className="px-3 py-2 text-left font-semibold text-fg-default">
                {t("guideAvoid")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.variant} className="border-b border-border/40 align-top">
                <td className="px-3 py-3">
                  <Button variant={row.variant} size="sm">
                    {row.label}
                  </Button>
                </td>
                <td className="px-3 py-3 text-fg-default">{row.emphasis}</td>
                <td className="px-3 py-3 leading-5 text-fg-muted">{row.useWhen}</td>
                <td className="px-3 py-3 leading-5 text-fg-muted">{row.avoid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
      <p className="max-w-3xl text-body leading-5 text-fg-default">
        {t("highEmphasisRule")}
      </p>
    </div>
  );
}

function ButtonGroupGuidance() {
  const t = useTranslations("button");
  const compositionCode = `import { Button } from "./components";

// ${t("standardGroup")}
<Button>${t("createProject")}</Button>
<Button variant="secondary">${t("saveDraft")}</Button>
<Button variant="ghost">${t("cancel")}</Button>

// ${t("dangerGroup")}
<Button variant="destructive">${t("deleteProject")}</Button>
<Button variant="tertiary">${t("cancel")}</Button>`;

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-body leading-5 text-fg-muted">
        {t("compositionIntro")}
      </p>
      <ul className="flex max-w-3xl list-disc flex-col gap-1.5 pl-5 text-body leading-5 text-fg-muted marker:text-fg-subtle">
        <li>{t("compositionRule1")}</li>
        <li>{t("compositionRule2")}</li>
        <li>{t("compositionRule3")}</li>
        <li>{t("compositionRule4")}</li>
        <li>{t("compositionRule5")}</li>
      </ul>
      <ComponentPreview code={compositionCode}>
        <div className="flex flex-col items-start gap-6">
          <DemoGroup label={t("standardGroup")}>
            <div className="flex flex-wrap items-center gap-2">
              <Button>{t("createProject")}</Button>
              <Button variant="secondary">{t("saveDraft")}</Button>
              <Button variant="ghost">{t("cancel")}</Button>
            </div>
          </DemoGroup>
          <DemoGroup label={t("dangerGroup")}>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="destructive">{t("deleteProject")}</Button>
              <Button variant="tertiary">{t("cancel")}</Button>
            </div>
          </DemoGroup>
        </div>
      </ComponentPreview>
    </div>
  );
}

// ── Playground ───────────────────────────────────────────
// A live sandbox: the controls on the right drive a single real Button so
// every combination of the props can be previewed, with the matching code
// kept in sync in the Code tab.

type PlayVariant = ButtonVariant;
type PlaySize = "sm" | "md" | "lg";

// "Icon only" swaps the text sizes for their square counterparts.
const ICON_ONLY_SIZE: Record<PlaySize, "icon-sm" | "icon" | "icon-lg"> = {
  sm: "icon-sm",
  md: "icon",
  lg: "icon-lg",
};

function buildButtonCode(o: {
  variant: PlayVariant;
  size: PlaySize;
  iconOnly: boolean;
  leading: boolean;
  trailing: boolean;
  label: string;
  loading: boolean;
  active: boolean;
  disabled: boolean;
}) {
  const size = o.iconOnly ? ICON_ONLY_SIZE[o.size] : o.size;
  const props: string[] = [];
  if (o.variant !== "primary") props.push(`variant="${o.variant}"`);
  if (size !== "md") props.push(`size="${size}"`);
  if (!o.iconOnly && o.leading) props.push("leadingIcon={Plus}");
  if (!o.iconOnly && o.trailing) props.push("trailingIcon={ArrowRight}");
  if (o.loading) props.push("loading");
  if (o.active) props.push("active");
  if (o.disabled) props.push("disabled");
  // Icon-only buttons have no visible text, so the label becomes the
  // accessible name instead.
  if (o.iconOnly) props.push(`aria-label="${o.label}"`);
  const child = o.iconOnly ? "<Plus />" : o.label;

  const oneLine = `<Button${props.length ? " " + props.join(" ") : ""}>${child}</Button>`;
  if (oneLine.length <= 60) return oneLine;
  return `<Button\n${props.map((p) => "  " + p).join("\n")}\n>\n  ${child}\n</Button>`;
}

// A borderless text input styled to match the select rows.
function PlayText({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="h-7 w-[124px] rounded-control bg-transparent px-2 text-right text-label text-fg-default transition-colors duration-fast hover:bg-hover focus:bg-hover outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
    />
  );
}

const LABELS = ["Get started", "Learn more", "Deploy", "Continue", "Ship it"] as const;

function ButtonPlayground() {
  const t = useTranslations("button");
  const Plus = useIcon("plus");
  const ArrowRight = useIcon("arrow-right");

  const [variant, setVariant] = useState<PlayVariant>("primary");
  const [size, setSize] = useState<PlaySize>("md");
  const [iconOnly, setIconOnly] = useState(false);
  const [leading, setLeading] = useState(false);
  const [trailing, setTrailing] = useState(false);
  const [label, setLabel] = useState<string>(LABELS[0]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // An emptied label field would render a collapsed button (and an empty
  // accessible name when icon-only) — fall back to the default label instead.
  const labelText = label.trim() === "" ? LABELS[0] : label;

  const code = buildButtonCode({
    variant,
    size,
    iconOnly,
    leading,
    trailing,
    label: labelText,
    loading,
    active,
    disabled,
  });

  const randomize = () => {
    const pick = <T,>(arr: readonly T[]) =>
      arr[Math.floor(Math.random() * arr.length)];
    setVariant(pick(["primary", "neutral", "destructive", "secondary", "tertiary", "ghost"] as const));
    setSize(pick(["sm", "md", "lg"] as const));
    setIconOnly(Math.random() > 0.85);
    setLeading(Math.random() > 0.5);
    setTrailing(Math.random() > 0.75);
    setLabel(pick(LABELS));
    setLoading(Math.random() > 0.85);
    setActive(Math.random() > 0.85);
    setDisabled(Math.random() > 0.9);
  };

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label={t("playButton")} />
      <div>
        <PlayField label={t("variant")}>
          <PlaySelect
            value={variant}
            onChange={(v) => setVariant(v as PlayVariant)}
            options={[
              { value: "primary", label: "Primary" },
              { value: "neutral", label: "Neutral" },
              { value: "destructive", label: "Destructive" },
              { value: "secondary", label: "Secondary" },
              { value: "tertiary", label: "Tertiary" },
              { value: "ghost", label: "Ghost" },
            ]}
          />
        </PlayField>
        <PlayField label={t("size")}>
          <PlaySelect
            value={size}
            onChange={(v) => setSize(v as PlaySize)}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ]}
          />
        </PlayField>
        <PlayField label={t("label")} disabled={iconOnly}>
          <PlayText value={label} onChange={setLabel} ariaLabel={t("buttonLabel")} />
        </PlayField>
        <Switch
          label={t("iconOnly")}
          checked={iconOnly}
          onToggle={() => setIconOnly((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label={t("leadingIcon")}
          checked={leading}
          onToggle={() => setLeading((v) => !v)}
          disabled={iconOnly}
          className={PLAY_SWITCH}
        />
        <Switch
          label={t("trailingIcon")}
          checked={trailing}
          onToggle={() => setTrailing((v) => !v)}
          disabled={iconOnly}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />

      <PlaySection label={t("state")} />
      <div>
        <Switch
          label={t("loading")}
          checked={loading}
          onToggle={() => setLoading((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label={t("active")}
          checked={active}
          onToggle={() => setActive((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label={t("disabled")}
          checked={disabled}
          onToggle={() => setDisabled((v) => !v)}
          className={PLAY_SWITCH}
        />
      </div>
    </PlaygroundPanel>
  );

  return (
    <PlaygroundLayout
      controls={controls}
      preview={
        <ComponentPreview code={code} minHeightClass="min-h-[280px]">
          <Button
            variant={variant}
            size={iconOnly ? ICON_ONLY_SIZE[size] : size}
            leadingIcon={!iconOnly && leading ? Plus : undefined}
            trailingIcon={!iconOnly && trailing ? ArrowRight : undefined}
            loading={loading}
            active={active}
            disabled={disabled}
            aria-label={iconOnly ? labelText : undefined}
          >
            {iconOnly ? <Plus /> : labelText}
          </Button>
        </ComponentPreview>
      }
    />
  );
}

export default function ButtonDoc() {
  const t = useTranslations("button");
  const Plus = useIcon("plus");
  const ArrowRight = useIcon("arrow-right");
  const Search = useIcon("search");
  const Loader = useIcon("loader");

  const [loading, setLoading] = useState(false);
  const sizesCode = `import { Button } from "./components";
import { useIcon } from "@zeron/icons/context";

const Plus = useIcon("plus");

// ${t("textButtonSizes")}
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// ${t("iconButtonSizes")}
<Button size="icon-sm"><Plus /></Button>
<Button size="icon"><Plus /></Button>
<Button size="icon-lg"><Plus /></Button>`;
  const iconsCode = `import { Button } from "./components";
import { useIcon } from "@zeron/icons/context";

const Plus = useIcon("plus");
const ArrowRight = useIcon("arrow-right");
const Search = useIcon("search");

// ${t("singleIcon")}
<Button leadingIcon={Plus}>Create</Button>
<Button variant="secondary" trailingIcon={ArrowRight}>Next</Button>

// ${t("twoIcons")}
<Button variant="tertiary" leadingIcon={Search} trailingIcon={ArrowRight}>
  Search
</Button>`;
  const loadingCode = `import { Button } from "./components";
import { useIcon } from "@zeron/icons/context";

const Loader = useIcon("loader");

// ${t("loadingState")}
<Button loading>Loading</Button>
<Button variant="secondary" loading leadingIcon={Loader}>Saving</Button>

// ${t("disabledState")}
<Button disabled>Disabled</Button>`;

  return (
    <DocPage
      title="Button"
      slug="button"
      description={t("description")}
    >
      <DocSection title={t("playground")}>
        <ButtonPlayground />
      </DocSection>

      <DocSection title={t("choosingVariant")}>
        <VariantGuide />
      </DocSection>

      <DocSection title={t("composition")}>
        <ButtonGroupGuidance />
      </DocSection>

      <DocSection title={t("sizes")}>
        <ComponentPreview code={sizesCode}>
          <div className="flex flex-col items-start gap-6">
            <DemoGroup label={t("textButtonSizes")}>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </DemoGroup>
            <DemoGroup label={t("iconButtonSizes")}>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="icon-sm"><Plus /></Button>
                <Button size="icon"><Plus /></Button>
                <Button size="icon-lg"><Plus /></Button>
              </div>
            </DemoGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("withIcons")}>
        <ComponentPreview code={iconsCode}>
          <div className="flex flex-col items-start gap-6">
            <DemoGroup label={t("singleIcon")}>
              <div className="flex flex-wrap items-center gap-2">
                <Button leadingIcon={Plus}>Create</Button>
                <Button variant="secondary" trailingIcon={ArrowRight}>Next</Button>
              </div>
            </DemoGroup>
            <DemoGroup label={t("twoIcons")}>
              <Button variant="tertiary" leadingIcon={Search} trailingIcon={ArrowRight}>Search</Button>
            </DemoGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("loadingDisabled")}>
        <ComponentPreview code={loadingCode}>
          <div className="flex flex-col items-start gap-6">
            <DemoGroup label={t("loadingState")}>
              <div className="flex flex-wrap items-center gap-2">
                <Button loading={loading} onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 2000);
                }}>
                  {loading ? "Loading" : "Click me"}
                </Button>
                <Button variant="secondary" loading leadingIcon={Loader}>Saving</Button>
              </div>
            </DemoGroup>
            <DemoGroup label={t("disabledState")}>
              <Button disabled>Disabled</Button>
            </DemoGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Focus behavior">
        <p className="max-w-3xl text-body leading-5 text-fg-muted">
          Buttons use <code>:focus-visible</code>: keyboard focus receives a ring, while pointer focus normally does not. Browser and user accessibility preferences that request visible focus are always respected.
        </p>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={getButtonProps(t)} />
      </DocSection>
    </DocPage>
  );
}
