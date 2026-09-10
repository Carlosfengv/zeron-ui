"use client";

import { useMemo, useState } from "react";
import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import GeminiColor from "@lobehub/icons/es/Gemini/components/Color";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import { Badge, badgeColors } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Card, CardFooter } from "@zeron/ui/card";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Switch } from "@zeron/ui/switch";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import {
  useIcon,
  type IconComponentProps,
} from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import type {
  CreditUsageCycle,
  CreditUsageCycleData,
  CreditUsageFormatters,
  CreditUsageLabels,
  CreditUsageModel,
  CreditUsageProps,
} from "./credit-usage-types";

const defaultLabels: CreditUsageLabels = {
  title: "Monthly credits",
  currentCycle: "This cycle",
  previousCycle: "Last cycle",
  creditsUsed: "of your credits used",
  resets: "resets",
  byModel: "By model",
  projectedToDeplete: "On pace to run out by",
  daysBeforeReset: "days before reset",
  autoSwitchPrefix: "Auto-switch to",
  autoSwitchAt: "at",
  autoSwitchDescription: "Keeps runs going on cheaper credits until the cycle resets",
  credits: "credits",
  setLimit: "Set a limit",
  upgrade: "Upgrade to Ultra",
  emptyModels: "No model usage in this cycle.",
};

function UpgradeArrow(props: IconComponentProps) {
  const ArrowUp = useIcon("arrow-up");
  return <ArrowUp {...props} className={cn("rotate-45", props.className)} />;
}

function normalizeCredits(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function positiveCredits(model: CreditUsageModel) {
  return normalizeCredits(model.credits);
}

function normalizePercentage(value: number) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

const modelProviderLogos = {
  anthropic: ClaudeColor,
  google: GeminiColor,
  openai: OpenAIMono,
} as const;

function ModelLogo({ model }: { model: CreditUsageModel }) {
  const GenericModelIcon = useIcon("brain");
  const ProviderLogo = model.provider
    ? modelProviderLogos[model.provider]
    : null;

  return (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center text-fg-default [&>img]:size-[18px] [&>svg]:size-[18px]"
      data-slot="credit-usage-model-logo"
    >
      {model.logo ?? (
        ProviderLogo
          ? <ProviderLogo size={18} />
          : <GenericModelIcon size={18} strokeWidth={1.5} />
      )}
    </span>
  );
}

function CreditBar({
  models,
  totalCredits,
  usedCredits,
  valueText,
}: {
  models: readonly CreditUsageModel[];
  totalCredits: number;
  usedCredits: number;
  valueText: string;
}) {
  const denominator = Math.max(totalCredits, usedCredits, 1);
  const remaining = Math.max(0, totalCredits - usedCredits);

  return (
    <div
      aria-label={valueText}
      aria-valuemax={denominator}
      aria-valuemin={0}
      aria-valuenow={Math.min(denominator, usedCredits)}
      aria-valuetext={valueText}
      className="flex h-7 w-full overflow-hidden rounded-lg bg-info-surface"
      role="progressbar"
    >
      {models.map((model, index) => (
        <span
          aria-hidden="true"
          className={cn(
            "h-full min-w-0 transition-[flex-grow] duration-slow motion-reduce:transition-none",
            index > 0 && "border-l-[3px] border-surface-floating",
          )}
          key={model.id}
          style={{
            backgroundColor: badgeColors[model.color],
            flexBasis: 0,
            flexGrow: positiveCredits(model) / denominator,
          }}
        />
      ))}
      {remaining > 0 && (
        <span
          aria-hidden="true"
          className="h-full min-w-0 border-l-[3px] border-surface-floating bg-info-surface"
          style={{ flexBasis: 0, flexGrow: remaining / denominator }}
        />
      )}
    </div>
  );
}

function ModelUsageList({
  formatNumber,
  labels,
  models,
}: {
  formatNumber: (value: number) => string;
  labels: CreditUsageLabels;
  models: readonly CreditUsageModel[];
}) {
  if (!models.length) {
    return <p className="mt-5 text-body text-fg-muted">{labels.emptyModels}</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      {models.map((model) => (
        <div className="flex h-7 min-w-0 items-center gap-2.5" key={model.id}>
          <ModelLogo model={model} />
          <span className="min-w-0 flex-1 truncate text-body text-fg-default">
            {model.name}
          </span>
          <span className="shrink-0 tabular-nums text-body text-fg-subtle">
            {formatNumber(positiveCredits(model))}
          </span>
        </div>
      ))}
    </div>
  );
}

function CyclePanel({
  cycle,
  data,
  formatPercentage,
  formatNumber,
  formatters,
  labels,
  totalCredits,
}: {
  cycle: CreditUsageCycle;
  data: CreditUsageCycleData;
  formatPercentage: (value: number) => string;
  formatNumber: (value: number) => string;
  formatters?: CreditUsageFormatters;
  labels: CreditUsageLabels;
  totalCredits: number;
}) {
  const TrendIcon = useIcon("arrow-up");
  const usedCredits = data.models.reduce(
    (total, model) => total + positiveCredits(model),
    0,
  );
  const usedRatio = totalCredits > 0
    ? usedCredits / totalCredits
    : usedCredits > 0
      ? 1
      : 0;
  const formattedUsedCredits = formatNumber(usedCredits);
  const formattedTotalCredits = formatNumber(totalCredits);
  const usedPercentage = formatPercentage(usedRatio);
  const usageSummaryValues = {
    usedCredits: formattedUsedCredits,
    totalCredits: formattedTotalCredits,
    resetAt: data.resetAt,
    resets: labels.resets,
  };
  const usageSummary = formatters?.usageSummary?.(usageSummaryValues)
    ?? `${formattedUsedCredits} of ${formattedTotalCredits} · ${labels.resets} ${data.resetAt}`;
  const progressValueText = formatters?.progressValueText?.({
    usedCredits: formattedUsedCredits,
    totalCredits: formattedTotalCredits,
    credits: labels.credits,
  }) ?? `${formattedUsedCredits} of ${formattedTotalCredits} ${labels.credits} used`;

  return (
    <TabPanel value={cycle}>
      <section className="px-3 py-3">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <strong className="text-[3.25rem] font-semibold leading-[0.9] tracking-[-0.05em] tabular-nums text-fg-default sm:text-[3.5rem]">
            {usedPercentage}
          </strong>
          <div className="pb-1">
            <p className="text-body text-fg-muted">{labels.creditsUsed}</p>
            <p className="mt-0.5 text-body tabular-nums text-fg-subtle">
              {usageSummary}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <CreditBar
            models={data.models}
            totalCredits={totalCredits}
            usedCredits={usedCredits}
            valueText={progressValueText}
          />
        </div>

        {data.projection && (
          <p className="mt-3 flex items-center gap-2 text-caption">
            <TrendIcon
              aria-hidden="true"
              className="shrink-0 rotate-45 text-fg-warning"
              size={17}
              strokeWidth={2}
            />
            <span className="text-fg-default">
              {labels.projectedToDeplete} {data.projection.depletesAt}
              <span className="text-fg-muted">
                {" "}· {data.projection.daysBeforeReset} {labels.daysBeforeReset}
              </span>
            </span>
          </p>
        )}
      </section>

      <section className="border-t border-border-subtle px-3 py-3">
        <h2 className="text-body font-medium text-fg-muted">{labels.byModel}</h2>
        <ModelUsageList
          formatNumber={formatNumber}
          labels={labels}
          models={data.models}
        />
      </section>
    </TabPanel>
  );
}

/** A responsive credit-cycle summary with model attribution and plan controls. */
export function CreditUsage({
  actions,
  autoSwitchEnabled: controlledAutoSwitchEnabled,
  className,
  cycle: controlledCycle,
  data,
  defaultAutoSwitchEnabled = true,
  defaultCycle = "current",
  formatters,
  labels: suppliedLabels,
  locale = "en-US",
  operationState,
  ...props
}: CreditUsageProps) {
  const GaugeIcon = useIcon("rectangle-horizontal");
  const [uncontrolledCycle, setUncontrolledCycle] = useState(defaultCycle);
  const [uncontrolledAutoSwitchEnabled, setUncontrolledAutoSwitchEnabled] =
    useState(defaultAutoSwitchEnabled);
  const labels = { ...defaultLabels, ...suppliedLabels };
  const formatNumber = useMemo(
    () => new Intl.NumberFormat(locale).format,
    [locale],
  );
  const formatPercentage = useMemo(
    () => new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      style: "percent",
    }).format,
    [locale],
  );
  const totalCredits = normalizeCredits(data.totalCredits);
  const requestedCycle = controlledCycle ?? uncontrolledCycle;
  const cycle = requestedCycle === "previous" && !data.previousCycle
    ? "current"
    : requestedCycle;
  const autoSwitchEnabled =
    controlledAutoSwitchEnabled ?? uncontrolledAutoSwitchEnabled;
  const pending = operationState?.pending ?? [];
  const autoSwitchTitle = data.autoSwitch
    ? formatters?.autoSwitchTitle?.({
        targetModel: data.autoSwitch.targetModel,
        threshold: formatPercentage(
          normalizePercentage(data.autoSwitch.threshold) / 100,
        ),
      }) ?? `${labels.autoSwitchPrefix} ${data.autoSwitch.targetModel} ${labels.autoSwitchAt} ${formatPercentage(normalizePercentage(data.autoSwitch.threshold) / 100)}`
    : null;

  const changeCycle = (value: string) => {
    const nextCycle = value as CreditUsageCycle;
    if (nextCycle === "previous" && !data.previousCycle) return;
    if (controlledCycle === undefined) setUncontrolledCycle(nextCycle);
    actions?.onCycleChange?.(nextCycle);
  };

  const changeAutoSwitch = (enabled: boolean) => {
    if (controlledAutoSwitchEnabled === undefined) {
      setUncontrolledAutoSwitchEnabled(enabled);
    }
    actions?.onAutoSwitchChange?.(enabled);
  };

  return (
    <Card
      className={cn(
        "@container w-full max-w-[520px] overflow-hidden rounded-2xl border-[0.5px] border-border bg-surface-floating pb-0 shadow-raised",
        className,
      )}
      {...props}
    >
      <Tabs color="default" onValueChange={changeCycle} value={cycle} variant="pill">
        <header className="flex flex-wrap items-center justify-between gap-3 px-3 pt-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <GaugeIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-fg-subtle"
              strokeWidth={1.5}
            />
            <h2 className="truncate text-body text-fg-muted">{labels.title}</h2>
            <Badge className="shrink-0" color="gray" size="sm">
              {data.planName}
            </Badge>
          </div>

          <TabsList aria-label={labels.title} className="shrink-0 rounded-lg p-0.5 shadow-control">
            <TabItem label={labels.currentCycle} value="current" />
            <TabItem
              disabled={!data.previousCycle}
              label={labels.previousCycle}
              value="previous"
            />
          </TabsList>
        </header>

        <CyclePanel
          cycle="current"
          data={data.currentCycle}
          formatPercentage={formatPercentage}
          formatNumber={formatNumber}
          formatters={formatters}
          labels={labels}
          totalCredits={totalCredits}
        />
        {data.previousCycle && (
          <CyclePanel
            cycle="previous"
            data={data.previousCycle}
            formatPercentage={formatPercentage}
            formatNumber={formatNumber}
            formatters={formatters}
            labels={labels}
            totalCredits={totalCredits}
          />
        )}
      </Tabs>

      {operationState?.error && (
        <div className="border-t border-border-subtle px-3 py-3">
          <InlineNotice role="alert" tone="danger" variant="emphasized">
            <InlineNoticeContent>{operationState.error}</InlineNoticeContent>
          </InlineNotice>
        </div>
      )}

      {data.autoSwitch && (
        <section className="flex items-center justify-between gap-4 border-t border-border-subtle px-3 py-3">
          <div className="min-w-0">
            <h2 className="text-body font-medium text-fg-default">
              {autoSwitchTitle}
            </h2>
            <p className="mt-0.5 text-caption text-fg-subtle">
              {data.autoSwitch.description ?? labels.autoSwitchDescription}
            </p>
          </div>
          <Switch
            checked={autoSwitchEnabled}
            className="shrink-0 p-0"
            disabled={pending.includes("auto-switch")}
            label={<span className="sr-only">{autoSwitchTitle}</span>}
            onCheckedChange={changeAutoSwitch}
          />
        </section>
      )}

      <CardFooter className="justify-between gap-3 border-t border-border-subtle px-3 py-3">
        <p className="mr-auto text-body tabular-nums text-fg-subtle">
          {data.planName} · {formatNumber(totalCredits)} {labels.credits}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {actions?.onSetLimit && (
            <Button
              disabled={pending.includes("set-limit")}
              onClick={actions.onSetLimit}
              size="md"
              type="button"
              variant="ghost"
            >
              {labels.setLimit}
            </Button>
          )}
          {actions?.onUpgrade && (
            <Button
              disabled={pending.includes("upgrade")}
              onClick={actions.onUpgrade}
              size="md"
              trailingIcon={UpgradeArrow}
              type="button"
            >
              {labels.upgrade}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
