import {
  foregroundColorTokens,
  fillColorTokens,
  boundaryColorTokens,
  interactionColorTokens,
  compatibilityColorTokens,
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

type TokenRow = {
  token: string;
  light?: string;
  dark?: string;
  value?: string;
  description: string;
};

const designToken = (group: string, name: string | number) =>
  `${group}/${String(name).replaceAll("-", "/")}`;

function TokenCode({ children }: { children: string }) {
  return (
    <code className="font-mono text-caption text-fg-muted whitespace-nowrap">
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
  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-caption text-fg-muted">
            <th className="px-3 py-2 font-normal">Design token</th>
            {includeTheme ? (
              <>
                <th className="px-3 py-2 font-normal">Light</th>
                <th className="px-3 py-2 font-normal">Dark</th>
              </>
            ) : (
              <th className="px-3 py-2 font-normal">Value</th>
            )}
            <th className="px-3 py-2 font-normal">Role</th>
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
              <td className="max-w-[34ch] px-3 py-2.5 text-body-sm leading-relaxed text-fg-muted">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const fontWeightRows = [
  { utility: "font-normal", value: "400", role: "默认正文、未选中标签和输入值" },
  { utility: "font-medium", value: "500", role: "控件标签、Badge、Tooltip 和轻度强调" },
  { utility: "font-semibold", value: "600", role: "标题、选中项、展开项和重要标签" },
  { utility: "font-bold", value: "700", role: "页面主标题和少量强强调内容" },
] as const;

function FontWeightTable() {
  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-caption text-fg-muted">
            <th className="px-3 py-2 font-normal">Implementation utility</th>
            <th className="px-3 py-2 font-normal">Tailwind default</th>
            <th className="px-3 py-2 font-normal">Role</th>
          </tr>
        </thead>
        <tbody>
          {fontWeightRows.map((row) => (
            <tr key={row.utility} className="border-b border-border/70 last:border-b-0">
              <td className="px-3 py-2.5"><TokenCode>{row.utility}</TokenCode></td>
              <td className="px-3 py-2.5 text-body-sm text-fg-default">{row.value}</td>
              <td className="px-3 py-2.5 text-body-sm text-fg-muted">{row.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-3 text-body-sm text-fg-muted">
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
  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-caption text-fg-muted">
            <th className="px-3 py-2 font-normal">Tailwind scale</th>
            <th className="px-3 py-2 font-normal">Default</th>
            <th className="px-3 py-2 font-normal">Examples</th>
          </tr>
        </thead>
        <tbody>
          {spacingScaleRows.map((row) => (
            <tr key={row.scale} className="border-b border-border/70 last:border-b-0">
              <td className="px-3 py-2.5"><TokenCode>{row.scale}</TokenCode></td>
              <td className="px-3 py-2.5 text-body-sm text-fg-default">{row.value}</td>
              <td className="px-3 py-2.5"><TokenCode>{row.examples}</TokenCode></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-3 text-body-sm text-fg-muted">
        普通布局间距使用宿主 Tailwind Theme，不发布额外的间距 Design Token 或 CSS 变量。控件高度继续使用语义 Token。
      </p>
    </div>
  );
}

export default function SemanticTokensPage() {
  const colorRows = (tokens: typeof foregroundColorTokens): TokenRow[] => tokens.map((token) => ({
    token: designToken("color", token.name),
    light: token.light,
    dark: token.dark,
    description: token.usage,
  }));
  const foregroundRows = colorRows(foregroundColorTokens);
  const fillRows = colorRows(fillColorTokens);
  const boundaryRows = colorRows(boundaryColorTokens);
  const interactionRows = colorRows(interactionColorTokens);
  const supportRows = colorRows(supportColorTokens);
  const compatibilityRows = colorRows(compatibilityColorTokens);

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
      title="Semantic Tokens"
      slug="semantic-tokens"
      showInstall={false}
      description="The single vocabulary shared by Zeron Design and Figma."
    >
      <div className="-mt-2 flex flex-col gap-8">
        <section className="border-y border-border py-5">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.7fr)] lg:items-end">
            <div className="max-w-[62ch]">
              <p className="text-overline uppercase tracking-[0.14em] text-fg-subtle">Design-token ledger</p>
              <p className="mt-2 text-body-md leading-relaxed text-fg-default">
                Each name is the design token and the Figma variable name. Theme modes change values; the design vocabulary stays stable.
              </p>
            </div>
            <div className="border-l-2 border-foreground pl-4">
              <p className="text-caption text-fg-muted">Source of truth</p>
              <TokenCode>src/system/tokens/semantic-tokens.mjs</TokenCode>
            </div>
          </div>
        </section>

        <DocSection title="Naming">
          <div className="border-y border-border px-3 py-3.5">
            <TokenCode>surface/floating</TokenCode>
            <p className="mt-2 max-w-[62ch] text-body-sm leading-relaxed text-fg-muted">
              Token paths are used unchanged in Figma. CSS custom properties and Tailwind utilities are generated implementation details, so they are not listed here as a second naming system.
            </p>
          </div>
        </DocSection>

        <DocSection title="Surface">
          <TokenTable rows={semanticSurfaceRows} includeTheme />
        </DocSection>

        <DocSection title="Foreground colors">
          <div className="border-y border-border px-3 py-3.5 text-body-sm leading-relaxed text-fg-muted">
            <p className="max-w-[68ch]">
              <code className="font-mono text-caption text-fg-default">fg</code> means foreground and covers text plus icons that inherit currentColor. An <code className="font-mono text-caption text-fg-default">on</code> role is a contrast pair: <code className="font-mono text-caption text-fg-default">fg-brand</code> sits on a normal surface, while <code className="font-mono text-caption text-fg-default">fg-on-brand</code> only sits on a Brand fill.
            </p>
          </div>
          <TokenTable rows={foregroundRows} includeTheme />
        </DocSection>

        <DocSection title="Fill colors">
          <TokenTable rows={fillRows} includeTheme />
        </DocSection>

        <DocSection title="Boundaries">
          <TokenTable rows={boundaryRows} includeTheme />
        </DocSection>

        <DocSection title="Interaction colors">
          <TokenTable rows={interactionRows} includeTheme />
        </DocSection>

        <DocSection title="Support colors">
          <TokenTable rows={supportRows} includeTheme />
        </DocSection>

        <DocSection title="Compatibility aliases">
          <TokenTable rows={compatibilityRows} includeTheme />
        </DocSection>

        <DocSection title="Elevation">
          <TokenTable rows={shadowRows} />
        </DocSection>

        <DocSection title="Typography">
          <TokenTable rows={fontRows} />
          <TokenTable rows={typeRows} />
          <FontWeightTable />
        </DocSection>

        <DocSection title="Spacing">
          <SpacingScaleTable />
        </DocSection>

        <DocSection title="Controls">
          <TokenTable rows={controlRows} />
        </DocSection>

        <DocSection title="Shape">
          <TokenTable rows={radiusRows} />
        </DocSection>

        <DocSection title="Layers">
          <TokenTable rows={layerRows} />
        </DocSection>
      </div>
    </DocPage>
  );
}
