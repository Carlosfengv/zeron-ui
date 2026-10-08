"use client";

import { useReducedMotion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { cn } from "#system/utils";
import { chartCenterValueClassName, chartCenterValueStyle, chartCenterLabelClassName, chartCenterLabelStyle } from "./chart-center-typography";

/** Subset of `Intl.NumberFormatOptions` supported by NumberFlow */
export interface ChartStatFlowFormat {
  notation?: "standard" | "compact";
  compactDisplay?: "short" | "long";
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  minimumIntegerDigits?: number;
  minimumSignificantDigits?: number;
  maximumSignificantDigits?: number;
  style?: "decimal" | "percent" | "currency";
  currency?: string;
  currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
  unit?: string;
  unitDisplay?: "short" | "long" | "narrow";
}

export const defaultChartStatFlowFormat: ChartStatFlowFormat = {
  notation: "standard",
  maximumFractionDigits: 0,
};

function formatStatValue(
  value: number,
  formatOptions: ChartStatFlowFormat,
  prefix?: string,
  suffix?: string
): string {
  const formatted = new Intl.NumberFormat(undefined, formatOptions).format(
    value
  );
  return `${prefix ?? ""}${formatted}${suffix ?? ""}`;
}

function useNumberFlowElementReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) {
      return;
    }
    if (typeof customElements === "undefined") return;
    let cancelled = false;
    customElements.whenDefined("number-flow-react").then(() => {
      if (!cancelled) {
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}

export interface ChartStatFlowProps {
  value: number;
  label: string;
  formatOptions?: ChartStatFlowFormat;
  prefix?: string;
  suffix?: string;
  valueClassName?: string;
  labelClassName?: string;
  icon?: ReactNode;
}

/**
 * Shared value + label stack using NumberFlow (same layout as pie / ring centers).
 * Parent should provide flex alignment and sizing when needed.
 */
export function ChartStatFlow({
  value,
  label,
  formatOptions = defaultChartStatFlowFormat,
  prefix,
  suffix,
  valueClassName = "text-heading font-bold",
  labelClassName = "text-label",
  icon,
}: ChartStatFlowProps) {
  const reducedMotion = useReducedMotion();
  const numberFlowReady = useNumberFlowElementReady();
  const staticValue = useMemo(
    () => formatStatValue(value, formatOptions, prefix, suffix),
    [value, formatOptions, prefix, suffix]
  );

  return (
    <>
      {icon ? (
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
          {icon}
        </div>
      ) : null}
      <span className={cn("text-fg-default tabular-nums", valueClassName)} style={valueClassName === chartCenterValueClassName ? chartCenterValueStyle : undefined}>
        {numberFlowReady ? (
          <NumberFlow
            animated={!reducedMotion}
            format={formatOptions}
            isolate
            prefix={prefix}
            suffix={suffix}
            value={value}
            willChange
          />
        ) : (
          staticValue
        )}
      </span>
      <span className={cn("mt-0.5 text-fg-subtle", labelClassName)} style={labelClassName === chartCenterLabelClassName ? chartCenterLabelStyle : undefined}>
        {label}
      </span>
    </>
  );
}

ChartStatFlow.displayName = "ChartStatFlow";
