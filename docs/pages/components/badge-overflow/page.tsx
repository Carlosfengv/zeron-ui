"use client";

import { Badge, type BadgeColor } from "@zeron/ui/badge";
import { BadgeOverflow } from "@zeron/ui/badge-overflow";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const skills = [
  "Product design",
  "React",
  "TypeScript",
  "Accessibility",
  "Motion",
  "Design systems",
  "Research",
  "Prototyping",
];

const skillColors: BadgeColor[] = [
  "violet",
  "blue",
  "cyan",
  "green",
  "amber",
  "rose",
  "indigo",
  "teal",
];

type Team = {
  id: string;
  name: string;
  color: BadgeColor;
};

const teams: Team[] = [
  { id: "platform", name: "Platform", color: "violet" },
  { id: "growth", name: "Growth", color: "green" },
  { id: "mobile", name: "Mobile", color: "blue" },
  { id: "research", name: "Research", color: "amber" },
  { id: "systems", name: "Design systems", color: "rose" },
  { id: "quality", name: "Quality", color: "teal" },
];

const basicCode = `import { Badge } from "./components/badge";
import { BadgeOverflow } from "./components/badge-overflow";

const skills = ["Product design", "React", "TypeScript", "Accessibility"];

<BadgeOverflow
  className="gap-1"
  items={skills}
  renderBadge={(skill) => <Badge size="sm">{skill}</Badge>}
/>`;

const multiLineCode = `<BadgeOverflow
  className="gap-1"
  items={skills}
  lineCount={2}
  renderBadge={(skill) => <Badge size="sm">{skill}</Badge>}
/>`;

const objectCode = `const teams = [
  { id: "platform", name: "Platform", color: "violet" },
  { id: "growth", name: "Growth", color: "green" },
];

<BadgeOverflow
  className="gap-1"
  items={teams}
  getBadgeKey={(team) => team.id}
  getBadgeLabel={(team) => team.name}
  renderBadge={(team, label) => (
    <Badge color={team.color} size="sm" variant="dot">{label}</Badge>
  )}
  renderOverflow={(count) => (
    <Badge color="gray" size="sm">+{count} teams</Badge>
  )}
/>`;

const badgeOverflowProps = (t: ReturnType<typeof useTranslations>): PropDef[] => [
  {
    name: "items",
    type: "T[]",
    description: t("items"),
  },
  {
    name: "renderBadge",
    type: "(item: T, label: string) => ReactNode",
    description: t("renderBadge"),
  },
  {
    name: "lineCount",
    type: "number",
    default: "1",
    description: t("lineCount"),
  },
  {
    name: "getBadgeLabel",
    type: "(item: T) => string",
    description: t("getBadgeLabel"),
  },
  {
    name: "getBadgeKey",
    type: "(item: T, label: string) => React.Key",
    description: t("getBadgeKey"),
  },
  {
    name: "renderOverflow",
    type: "(count: number) => ReactNode",
    description: t("renderOverflow"),
  },
  {
    name: "render",
    type: "ReactElement | ((props, state) => ReactElement)",
    description: t("render"),
  },
  {
    name: "className",
    type: "string",
    description: t("className"),
  },
];

function SkillBadges({ lineCount = 1 }: { lineCount?: number }) {
  return (
    <BadgeOverflow
      className="gap-1"
      items={skills}
      lineCount={lineCount}
      renderBadge={(skill, label) => (
        <Badge
          color={skillColors[skills.indexOf(skill)] ?? "gray"}
          size="sm"
        >
          {label}
        </Badge>
      )}
    />
  );
}

export default function BadgeOverflowDoc() {
  const t = useTranslations("badgeOverflow");
  return (
    <DocPage
      title="BadgeOverflow"
      slug="badge-overflow"
      description="Responsive badge list that reveals every item in a centered, hover-triggered popover with Select-style rows and five-item scrolling."
    >
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "single-line",
              label: "Single line",
              code: basicCode,
              preview: <div className="w-full max-w-[360px] border border-border-subtle bg-muted/20 p-3 rounded-xl"><SkillBadges /></div>,
            },
            {
              value: "two-lines",
              label: "Two lines",
              code: multiLineCode,
              preview: <div className="w-full max-w-[360px] border border-border-subtle bg-muted/20 p-3 rounded-xl"><SkillBadges lineCount={2} /></div>,
            },
            {
              value: "teams",
              label: "Object items",
              code: objectCode,
              preview: <div className="w-full max-w-[340px] border border-border-subtle bg-muted/20 p-3 rounded-xl"><BadgeOverflow className="gap-1" getBadgeKey={(team) => team.id} getBadgeLabel={(team) => team.name} items={teams} renderBadge={(team, label) => <Badge color={team.color} size="sm" variant="dot">{label}</Badge>} /></div>,
            },
          ]}
        />
      </DocSection>

      <DocSection title={t("singleLine")}>
        <ComponentPreview code={basicCode}>
          <div className="w-full max-w-[360px] border border-border-subtle bg-muted/20 p-3 rounded-xl">
            <SkillBadges />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("multipleLines")}>
        <ComponentPreview code={multiLineCode}>
          <div className="w-full max-w-[360px] border border-border-subtle bg-muted/20 p-3 rounded-xl">
            <SkillBadges lineCount={2} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("objectsAndCustomOverflow")}>
        <ComponentPreview code={objectCode}>
          <div className="w-full max-w-[340px] border border-border-subtle bg-muted/20 p-3 rounded-xl">
            <BadgeOverflow
              className="gap-1"
              getBadgeKey={(team) => team.id}
              getBadgeLabel={(team) => team.name}
              items={teams}
              renderBadge={(team, label) => (
                <Badge color={team.color} size="sm" variant="dot">
                  {label}
                </Badge>
              )}
              renderOverflow={(count) => (
                <Badge color="gray" size="sm">
                  +{count} teams
                </Badge>
              )}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={badgeOverflowProps(t)} />
      </DocSection>
    </DocPage>
  );
}
