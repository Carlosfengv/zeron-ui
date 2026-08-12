"use client";

import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import { useTranslations } from "next-intl";
import { SurfaceProvider } from "@/lib/surface-context";
import {
  type ShadowRole,
  type SurfaceRole,
  shadowClasses,
  surfaceClasses,
} from "@/lib/surface-classes";
import { Elevated } from "@/lib/elevated";
import {
  shadowTokens,
  surfaceTokens,
} from "@/lib/tokens/semantic-tokens.mjs";

const SURFACE_CODE = `<main className="bg-surface-base">
  <section className="bg-surface-raised">...</section>
  <Menu className="bg-surface-floating shadow-floating" />
  <Dialog className="bg-surface-overlay shadow-overlay" />
  <Tooltip className="bg-surface-top shadow-floating" />
</main>`;

const NESTING_CODE = `<SurfaceProvider role="base">
  <Elevated surface="raised" shadow="raised">
    Raised container
    <Elevated surface="floating" shadow="floating">
      Floating content
      <Elevated surface="overlay" shadow="overlay">
        Overlay
        <Elevated surface="top" shadow="floating">
          Top nested surface
        </Elevated>
      </Elevated>
    </Elevated>
  </Elevated>
</SurfaceProvider>`;

const surfaceExamples: Record<
  SurfaceRole,
  { label: string; use: string; shadow: ShadowRole }
> = {
  base: { label: "Base", use: "Page and application canvas", shadow: "none" },
  raised: { label: "Raised", use: "Tool areas and quiet containers", shadow: "raised" },
  floating: { label: "Floating", use: "Menu, Dropdown and Popover", shadow: "floating" },
  overlay: { label: "Overlay", use: "Dialog, Drawer and Sheet", shadow: "overlay" },
  top: { label: "Top", use: "Nested floating UI and Tooltip", shadow: "floating" },
};

function SurfaceCard({ role }: { role: SurfaceRole }) {
  const example = surfaceExamples[role];

  return (
    <article
      className={`${surfaceClasses(role, example.shadow)} flex min-h-28 flex-col justify-between rounded-container border border-border/70 p-4`}
      data-surface={role}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-body font-semibold">{example.label}</span>
        <code className="text-label text-fg-muted">{role}</code>
      </div>
      <p className="mt-6 text-label leading-relaxed text-fg-muted">
        {example.use}
      </p>
    </article>
  );
}

function SemanticSurfaceGrid() {
  return (
    <SurfaceProvider role="base">
      <div className="grid w-full gap-3 sm:grid-cols-2">
        {(Object.keys(surfaceExamples) as SurfaceRole[]).map((role) => (
          <SurfaceCard key={role} role={role} />
        ))}
      </div>
    </SurfaceProvider>
  );
}

function SemanticNestingDemo() {
  return (
    <SurfaceProvider role="base">
      <div className="w-full max-w-md rounded-container bg-surface-base p-3">
        <Elevated
          className="rounded-container p-3"
          shadow="raised"
          surface="raised"
        >
          <p className="text-label text-fg-muted">Raised container</p>
          <Elevated
            className="mt-3 rounded-container p-3"
            shadow="floating"
            surface="floating"
          >
            <p className="text-label text-fg-muted">Floating content</p>
            <Elevated
              className="mt-3 rounded-container p-3"
              shadow="overlay"
              surface="overlay"
            >
              <p className="text-label text-fg-muted">Overlay</p>
              <Elevated
                className="mt-3 rounded-container p-3"
                shadow="floating"
                surface="top"
              >
                <p className="text-label text-fg-muted">
                  Top nested surface
                </p>
              </Elevated>
            </Elevated>
          </Elevated>
        </Elevated>
      </div>
    </SurfaceProvider>
  );
}

export default function SurfacesDoc() {
  const t = useTranslations("surfaces");
  return (
    <DocPage
      description="Five semantic content planes with independent, purpose-based shadows."
      installSlug="elevated"
      slug="surfaces"
      title="Surfaces"
    >
      <DocSection title={t("semanticRoles")}>
        <p className="max-w-[62ch] text-body leading-relaxed text-fg-muted">
          {t("semanticRolesBody")}
        </p>
        <ComponentPreview code={SURFACE_CODE} padding="responsive">
          <SemanticSurfaceGrid />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("relativeNesting")}>
        <p className="max-w-[62ch] text-body leading-relaxed text-fg-muted">
          {t("relativeNestingBody")}
        </p>
        <ComponentPreview
          code={NESTING_CODE}
          minHeightClass="min-h-[420px]"
          padding="responsive"
        >
          <SemanticNestingDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("tokenContract")}>
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[580px] border-collapse text-left text-body">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-label text-fg-muted">
                <th className="px-3 py-2 font-normal">{t("cssToken")}</th>
                <th className="px-3 py-2 font-normal">Tailwind</th>
                <th className="px-3 py-2 font-normal">{t("light")}</th>
                <th className="px-3 py-2 font-normal">{t("dark")}</th>
                <th className="px-3 py-2 font-normal">{t("role")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {(surfaceTokens as Array<{ name: string; light: string; dark: string; usage: string }>).map((token) => (
                <tr key={token.name}>
                  <td className="px-3 py-2.5 font-mono text-label">
                    --surface-{token.name}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-label">
                    bg-surface-{token.name}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-label">
                    {token.light}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-label">
                    {token.dark}
                  </td>
                  <td className="px-3 py-2.5 text-label text-fg-muted">
                    {token.usage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title={t("shadowContract")}>
        <p className="max-w-[62ch] text-body leading-relaxed text-fg-muted">
          {t("shadowContractBody")}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {shadowTokens.map((token) => (
            <div
              className={`rounded-container bg-surface-raised p-4 ${shadowClasses(token.name as Exclude<ShadowRole, "none">)}`}
              key={token.name}
            >
              <code className="text-label">--shadow-{token.name}</code>
              <p className="mt-2 text-label leading-relaxed text-fg-muted">
                {token.usage}
              </p>
            </div>
          ))}
        </div>
      </DocSection>
    </DocPage>
  );
}
