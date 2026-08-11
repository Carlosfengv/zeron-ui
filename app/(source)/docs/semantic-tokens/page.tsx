"use client";

import {
  foregroundColorTokens,
  fillColorTokens,
  boundaryColorTokens,
  interactionColorTokens,
  supportColorTokens,
  surfaceTokens,
  shadowTokens,
  typographyTokens,
  fontTokens,
  controlHeightTokens,
  radiusRoles,
  shapeModes,
  layerTokens,
} from "@/lib/tokens/semantic-tokens.mjs";
import { DocPage, DocSection } from "@/docs/DocPage";
import { useTranslations } from "next-intl";

type TokenRow = {
  token: string;
  light?: string;
  dark?: string;
  value?: string;
  description: string;
};

type ColorToken = {
  name: string;
  light: string;
  dark: string;
  usage: string;
};

const designToken = (group: string, name: string | number) =>
  `${group}/${String(name).replaceAll("-", "/")}`;

function TokenCode({ children }: { children: string }) {
  return (
    <code className="font-mono text-label text-fg-muted whitespace-nowrap">
      {children}
    </code>
  );
}

function Swatch({ value }: { value: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-3 shrink-0 rounded-full border border-border/70"
      style={{ background: value }}
    />
  );
}

function ThemeValue({ value }: { value: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Swatch value={value} />
      <TokenCode>{value}</TokenCode>
    </span>
  );
}

function TokenTable({
  rows,
  includeTheme = false,
}: {
  rows: TokenRow[];
  includeTheme?: boolean;
}) {
  const t = useTranslations("semanticTokens");
  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-label text-fg-muted">
            <th className="px-3 py-2 font-normal">{t("designToken")}</th>
            {includeTheme ? (
              <>
                <th className="px-3 py-2 font-normal">{t("light")}</th>
                <th className="px-3 py-2 font-normal">{t("dark")}</th>
              </>
            ) : (
              <th className="px-3 py-2 font-normal">{t("value")}</th>
            )}
            <th className="px-3 py-2 font-normal">{t("role")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/80">
          {rows.map((row) => (
            <tr key={row.token} className="align-top transition-colors hover:bg-hover">
              <td className="px-3 py-2.5"><TokenCode>{row.token}</TokenCode></td>
              {includeTheme ? (
                <>
                  <td className="px-3 py-2.5"><ThemeValue value={row.light ?? "transparent"} /></td>
                  <td className="px-3 py-2.5"><ThemeValue value={row.dark ?? "transparent"} /></td>
                </>
              ) : (
                <td className="px-3 py-2.5"><TokenCode>{row.value ?? "—"}</TokenCode></td>
              )}
              <td className="max-w-[34ch] px-3 py-2.5 text-body leading-relaxed text-fg-muted">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChoiceCard({
  title,
  body,
  token,
}: {
  title: string;
  body: string;
  token: string;
}) {
  return (
    <div className="flex min-h-32 flex-col justify-between border border-border bg-surface-raised p-4">
      <div>
        <p className="text-body font-semibold text-fg-default">{title}</p>
        <p className="mt-1 text-body leading-relaxed text-fg-muted">{body}</p>
      </div>
      <TokenCode>{token}</TokenCode>
    </div>
  );
}

function RecipeTable({ rows }: { rows: Array<{ scenario: string; tokens: string }> }) {
  const t = useTranslations("semanticTokens");
  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-label text-fg-muted">
            <th className="px-3 py-2 font-normal">{t("scenario")}</th>
            <th className="px-3 py-2 font-normal">{t("use")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/80">
          {rows.map((row) => (
            <tr key={row.scenario} className="align-top">
              <td className="w-[34%] px-3 py-2.5 text-body text-fg-default">{row.scenario}</td>
              <td className="px-3 py-2.5"><TokenCode>{row.tokens}</TokenCode></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[72ch] text-body leading-relaxed text-fg-muted">{children}</p>;
}

const fontWeightRows = [
  { utility: "font-normal", value: "400", role: "默认正文、未选中标签和输入值" },
  { utility: "font-medium", value: "500", role: "控件标签、Badge、Tooltip 和轻度强调" },
  { utility: "font-semibold", value: "600", role: "标题、选中项、展开项和重要标签" },
  { utility: "font-bold", value: "700", role: "页面主标题和少量强强调内容" },
] as const;

function FontWeightTable() {
  const t = useTranslations("semanticTokens");
  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-label text-fg-muted">
            <th className="px-3 py-2 font-normal">{t("implementationUtility")}</th>
            <th className="px-3 py-2 font-normal">{t("tailwindDefault")}</th>
            <th className="px-3 py-2 font-normal">{t("role")}</th>
          </tr>
        </thead>
        <tbody>
          {fontWeightRows.map((row) => (
            <tr key={row.utility} className="border-b border-border/70 last:border-b-0">
              <td className="px-3 py-2.5"><TokenCode>{row.utility}</TokenCode></td>
              <td className="px-3 py-2.5 text-body text-fg-default">{row.value}</td>
              <td className="px-3 py-2.5 text-body text-fg-muted">{row.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-3 text-body text-fg-muted">
        字重是 Tailwind 实现能力，不是 Design Token。消费项目覆盖原生字重 Theme 时，组件跟随宿主配置。
      </p>
    </div>
  );
}

const spacingScaleRows = [
  { scale: "1", value: "4px", examples: "gap-1 / p-1" },
  { scale: "2", value: "8px", examples: "gap-2 / p-2" },
  { scale: "3", value: "12px", examples: "gap-3 / px-3" },
  { scale: "4", value: "16px", examples: "gap-4 / px-4" },
  { scale: "5", value: "20px", examples: "gap-5 / px-5" },
  { scale: "6", value: "24px", examples: "gap-6 / px-6" },
  { scale: "8", value: "32px", examples: "gap-8 / px-8" },
  { scale: "12", value: "48px", examples: "gap-12 / py-12" },
  { scale: "16", value: "64px", examples: "gap-16 / py-16" },
] as const;

function SpacingScaleTable() {
  const t = useTranslations("semanticTokens");
  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-label text-fg-muted">
            <th className="px-3 py-2 font-normal">{t("tailwindScale")}</th>
            <th className="px-3 py-2 font-normal">{t("tailwindDefault")}</th>
            <th className="px-3 py-2 font-normal">{t("examples")}</th>
          </tr>
        </thead>
        <tbody>
          {spacingScaleRows.map((row) => (
            <tr key={row.scale} className="border-b border-border/70 last:border-b-0">
              <td className="px-3 py-2.5"><TokenCode>{row.scale}</TokenCode></td>
              <td className="px-3 py-2.5 text-body text-fg-default">{row.value}</td>
              <td className="px-3 py-2.5"><TokenCode>{row.examples}</TokenCode></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-3 text-body text-fg-muted">
        普通布局间距使用宿主 Tailwind Theme，不发布额外的间距 Design Token 或 CSS 变量。控件高度继续使用语义 Token。
      </p>
    </div>
  );
}

export default function SemanticTokensPage() {
  const t = useTranslations("semanticTokens");
  const colorRows = (tokens: ColorToken[]): TokenRow[] => tokens.map((token) => ({
    token: designToken("color", token.name),
    light: token.light,
    dark: token.dark,
    description: token.usage,
  }));
  const tokenRows = (tokens: ColorToken[], names: string[]) =>
    colorRows(tokens.filter((token) => names.includes(token.name)));
  const foregroundRows = colorRows(foregroundColorTokens);
  const boundaryRows = colorRows(boundaryColorTokens);
  const supportRows = colorRows(supportColorTokens);
  const actionFillRows = tokenRows(fillColorTokens, [
    "brand", "brand-hover", "brand-active",
    "secondary-action", "secondary-action-hover", "secondary-action-active",
    "destructive", "destructive-hover", "destructive-active",
    "inverse-background", "inverse-background-hover", "inverse-background-active",
  ]);
  const additionalBackgroundRows = tokenRows(fillColorTokens, [
    "muted", "emphasis", "scrim",
  ]);
  const interactionRows = [
    ...colorRows(interactionColorTokens),
    ...tokenRows(fillColorTokens, ["selection"]),
  ];
  const feedbackRows = [
    ...tokenRows(fillColorTokens, ["danger-surface", "warning-surface"]),
    ...tokenRows(foregroundColorTokens, ["fg-danger", "fg-warning"]),
    ...tokenRows(boundaryColorTokens, ["danger-border", "warning-border"]),
  ];

  const semanticSurfaceRows: TokenRow[] = surfaceTokens.map((token) => ({
    token: designToken("surface", token.name),
    light: token.light,
    dark: token.dark,
    description: token.usage,
  }));

  const typeRows: TokenRow[] = typographyTokens.map((token) => ({
    token: designToken("typography", token.name),
    value: `${token.px}px / ${token.linePx}px`,
    description: token.usage,
  }));

  const controlRows: TokenRow[] = controlHeightTokens.map((token) => ({
    token: designToken("control/height", token.name),
    value: `${token.px}px`,
    description: token.usage,
  }));

  const radiusRows: TokenRow[] = radiusRoles.map((role) => {
    // The token source is JavaScript, so retain the generated shape object's
    // literal keys when indexing it from a documented role.
    const name = role.name as keyof typeof shapeModes.rounded;
    return {
      token: designToken("shape/radius", role.name),
      value: `${shapeModes.rounded[name]}px → ${shapeModes.pill[name]}px`,
      description: role.usage,
    };
  });

  const layerRows: TokenRow[] = layerTokens.map((token) => ({
    token: designToken("layer", token.name),
    value: String(token.value),
    description: token.usage,
  }));

  const shadowRows: TokenRow[] = shadowTokens.map((token) => ({
    token: designToken("shadow", token.name),
    value: `shadow-${token.name}`,
    description: token.usage,
  }));

  const fontRows: TokenRow[] = [
    {
      token: "typography/font-family",
      value: fontTokens.family,
      description: "界面默认字体族",
    },
  ];

  return (
    <DocPage
      title={t("pageTitle")}
      slug="semantic-tokens"
      showInstall={false}
      description={t("pageDescription")}
    >
      <div className="-mt-2 flex flex-col gap-8">
        <section className="border-y border-border py-5">
          <p className="text-label uppercase tracking-[0.14em] text-fg-subtle">{t("quickStart")}</p>
          <p className="mt-2 max-w-[68ch] text-body leading-relaxed text-fg-default">{t("quickStartBody")}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ChoiceCard title={t("backgroundsChoice")} body={t("backgroundsChoiceBody")} token="surface/*" />
            <ChoiceCard title={t("textChoice")} body={t("textChoiceBody")} token="color/fg/*" />
            <ChoiceCard title={t("actionsChoice")} body={t("actionsChoiceBody")} token="color/brand + selection/background" />
            <ChoiceCard title={t("boundariesChoice")} body={t("boundariesChoiceBody")} token="color/border + focus/ring" />
            <ChoiceCard title={t("feedbackChoice")} body={t("feedbackChoiceBody")} token="danger/* + warning/*" />
          </div>
        </section>

        <DocSection title={t("commonRecipes")}>
          <SectionDescription>{t("commonRecipesBody")}</SectionDescription>
          <RecipeTable rows={[
            { scenario: t("primaryAction"), tokens: "brand + fg-on-brand" },
            { scenario: t("secondaryAction"), tokens: "secondary-action + fg-default" },
            { scenario: t("dangerAction"), tokens: "destructive + fg-on-danger" },
            { scenario: t("dangerAlert"), tokens: "danger-surface + fg-danger + danger-border" },
            { scenario: t("warningAlert"), tokens: "warning-surface + fg-warning + warning-border" },
            { scenario: t("tooltip"), tokens: "inverse-background + fg-on-inverse" },
          ]} />
        </DocSection>

        <DocSection title={t("actionFill")}>
          <SectionDescription>{t("actionFillBody")}</SectionDescription>
          <TokenTable rows={actionFillRows} includeTheme />
        </DocSection>

        <DocSection title={t("foreground")}>
          <SectionDescription>{t("foregroundBody")}</SectionDescription>
          <div className="border-y border-border px-3 py-3.5 text-body leading-relaxed text-fg-muted">
            <p className="max-w-[68ch]">{t("onPairBody")}</p>
          </div>
          <TokenTable rows={foregroundRows} includeTheme />
        </DocSection>

        <DocSection title={t("surface")}>
          <SectionDescription>{t("surfaceBody")}</SectionDescription>
          <TokenTable rows={semanticSurfaceRows} includeTheme />
          <p className="text-body font-medium text-fg-default">{t("additionalBackgrounds")}</p>
          <TokenTable rows={additionalBackgroundRows} includeTheme />
        </DocSection>

        <DocSection title={t("boundaries")}>
          <SectionDescription>{t("boundariesBody")}</SectionDescription>
          <TokenTable rows={boundaryRows} includeTheme />
        </DocSection>

        <DocSection title={t("interaction")}>
          <SectionDescription>{t("interactionBody")}</SectionDescription>
          <TokenTable rows={interactionRows} includeTheme />
        </DocSection>

        <DocSection title={t("feedback")}>
          <SectionDescription>{t("feedbackBody")}</SectionDescription>
          <TokenTable rows={feedbackRows} includeTheme />
        </DocSection>

        <DocSection title={t("elevation")}>
          <TokenTable rows={shadowRows} />
        </DocSection>

        <DocSection title={t("typography")}>
          <TokenTable rows={fontRows} />
          <TokenTable rows={typeRows} />
          <FontWeightTable />
        </DocSection>

        <DocSection title={t("spacing")}>
          <SpacingScaleTable />
        </DocSection>

        <DocSection title={t("controls")}>
          <TokenTable rows={controlRows} />
        </DocSection>

        <DocSection title={t("shape")}>
          <TokenTable rows={radiusRows} />
        </DocSection>

        <DocSection title={t("layers")}>
          <TokenTable rows={layerRows} />
        </DocSection>

        <details className="border-y border-border py-4">
          <summary className="cursor-pointer text-body font-semibold text-fg-default">{t("support")}</summary>
          <div className="mt-3 flex flex-col gap-3">
            <SectionDescription>{t("supportBody")}</SectionDescription>
            <TokenTable rows={supportRows} includeTheme />
          </div>
        </details>

        <DocSection title={t("developerReference")}>
          <SectionDescription>{t("developerReferenceBody")}</SectionDescription>
          <div className="border-y border-border px-3 py-3.5">
            <p className="text-label text-fg-muted">{t("source")}</p>
            <TokenCode>src/system/tokens/semantic-tokens.mjs</TokenCode>
          </div>
          <div className="border-y border-border px-3 py-3.5">
            <p className="text-body font-medium text-fg-default">{t("naming")}</p>
            <TokenCode>surface/floating</TokenCode>
            <p className="mt-2 max-w-[62ch] text-body leading-relaxed text-fg-muted">{t("namingBody")}</p>
          </div>
        </DocSection>
      </div>
    </DocPage>
  );
}
