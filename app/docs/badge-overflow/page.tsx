"use client";

import { Badge, type BadgeColor } from "@/components/ui/badge";
import { BadgeOverflow } from "@/components/ui/badge-overflow";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";

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

const badgeOverflowProps: PropDef[] = [
  {
    name: "items",
    type: "T[]",
    description: "Ordered badge data to fit inside the available width.",
  },
  {
    name: "renderBadge",
    type: "(item: T, label: string) => ReactNode",
    description: "Renders an item in both the visible and measurement layers.",
  },
  {
    name: "lineCount",
    type: "number",
    default: "1",
    description: "Maximum number of badge rows before overflow is collapsed.",
  },
  {
    name: "getBadgeLabel",
    type: "(item: T) => string",
    description: "Returns the label. Required for object items; primitives use String(item).",
  },
  {
    name: "getBadgeKey",
    type: "(item: T, label: string) => React.Key",
    description: "Returns a stable key. The computed label is used by default.",
  },
  {
    name: "renderOverflow",
    type: "(count: number) => ReactNode",
    description: "Customizes the popover trigger. Defaults to a bordered +count badge.",
  },
  {
    name: "render",
    type: "ReactElement | ((props, state) => ReactElement)",
    description: "Changes the root element using Base UI render composition.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional root classes. The computed CSS gap is included in fitting calculations.",
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
  return (
    <DocPage
      title="BadgeOverflow"
      slug="badge-overflow"
      description="Responsive badge list that reveals every item in a centered, hover-triggered popover with Select-style rows and five-item scrolling."
    >
      <DocSection title="Single Line">
        <ComponentPreview code={basicCode}>
          <div className="w-full max-w-[360px] border border-border/60 bg-muted/20 p-3 rounded-xl">
            <SkillBadges />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Multiple Lines">
        <ComponentPreview code={multiLineCode}>
          <div className="w-full max-w-[360px] border border-border/60 bg-muted/20 p-3 rounded-xl">
            <SkillBadges lineCount={2} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Objects and Custom Overflow">
        <ComponentPreview code={objectCode}>
          <div className="w-full max-w-[340px] border border-border/60 bg-muted/20 p-3 rounded-xl">
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

      <DocSection title="API Reference">
        <PropsTable props={badgeOverflowProps} />
      </DocSection>
    </DocPage>
  );
}
