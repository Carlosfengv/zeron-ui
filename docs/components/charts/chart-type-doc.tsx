"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { BarChartGradientExample, barChartGradientExampleCode } from "@docs/components/charts/bar-chart-gradient-example";
import { ChartTypeExample, chartTypeExampleCode } from "@docs/components/charts/chart-type-example";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { chartTypes, type ChartType } from "@docs/lib/chart-types";

export function ChartTypeDoc({ kind }: { kind: ChartType }) {
  const locale = useLocale();
  const t = useTranslations("chartType");
  const definition = chartTypes.find((type) => type.kind === kind)!;
  const prefix = locale === "en" ? "/en" : "";
  const exampleProps = {
    kind, locale, label: t("chartLabel"), viewData: t("viewData"),
    primaryLabel: t("primary"), secondaryLabel: t("secondary"), totalLabel: t("total"), categoryLabel: t("category"), unassignedLabel: t("unassigned"),
  };
  return (
    <DocPage title={definition.name} slug={definition.slug} installSlug="chart" description={t("description")}>
      <DocSection title={t("basic")}>
        <ComponentPreview coverSource code={chartTypeExampleCode(kind)}><ChartTypeExample {...exampleProps} /></ComponentPreview>
      </DocSection>
      <DocSection title={t("advanced")}>
        <ComponentPreview code={chartTypeExampleCode(kind, true)}><ChartTypeExample {...exampleProps} advanced /></ComponentPreview>
      </DocSection>
      {kind === "bar" && (
        <DocSection title={t("gradient")}>
          <p className="text-body text-fg-muted">{t("gradientDescription")}</p>
          <Link className="text-label text-fg-brand underline underline-offset-4" href={`${prefix}/docs/blocks/support-analytics-01`}>{t("gradientSource")}</Link>
          <ComponentPreview code={barChartGradientExampleCode}>
            <BarChartGradientExample locale={locale} label={t("gradientLabel")} dateLabel={t("gradientDate")} countLabel={t("gradientCount")} viewData={t("viewData")} />
          </ComponentPreview>
          <p className="text-label text-fg-muted">{t("gradientGuidance")}</p>
        </DocSection>
      )}
      <DocSection title={t("usage")}>
        <p className="text-body text-fg-muted">{t("guidance")}</p>
        <p className="text-body text-fg-muted">{t("composition")}</p>
        <p className="text-body text-fg-muted">{t("sourceDescription")}</p>
        <div className="flex flex-wrap gap-4 text-label">
          <Link className="text-fg-brand underline underline-offset-4" href={`${prefix}${definition.sourceHref}`}>{t("sourceLink")}</Link>
          <Link className="text-fg-brand underline underline-offset-4" href={`${prefix}/docs/components/chart`}>{t("foundationLink")}</Link>
          <Link className="text-fg-brand underline underline-offset-4" href={`${prefix}/docs/components/chart-tokens`}>{t("tokensLink")}</Link>
          <Link className="text-fg-brand underline underline-offset-4" href={`${prefix}/docs/components/chart-primitives`}>{t("primitivesLink")}</Link>
        </div>
      </DocSection>
      <DocSection title={t("apiReference")}>
        <PropsTable props={[
          { name: "ChartContainer.config", type: "ChartConfig", description: t("configProp") },
          { name: kind === "pie" ? "ChartDataTable.rows" : "ChartContainer.dataTable", type: kind === "pie" ? "ChartDataTableProps['rows']" : "ChartDataTableProps", description: t("tableProp") },
          { name: `${kind === "pie" ? "Pie" : definition.name}.data`, type: "array", description: t("dataProp") },
          { name: `${definition.name.replace("Chart", "")}.dataKey`, type: "string", description: t("dataKeyProp") },
        ]} />
      </DocSection>
    </DocPage>
  );
}
