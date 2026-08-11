"use client";

import { useShape } from "@/lib/shape-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";
import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const RELEASES = Array.from(
  { length: 24 },
  (_, i) => `v1.${23 - i}.0 — maintenance release`
);

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CITIES = [
  "Amsterdam", "Berlin", "Copenhagen", "Dublin", "Helsinki", "Lisbon",
  "London", "Madrid", "Oslo", "Paris", "Prague", "Stockholm",
  "Vienna", "Warsaw", "Zurich",
];

// Deterministic fake metric so the table renders identically on every pass.
function metric(row: number, col: number) {
  return (((row + 3) * (col + 7) * 37) % 900) + 100;
}

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const PROBLEM_CODE = `// ❌ Native overflow. On macOS the scrollbar is hidden until
// you happen to scroll, so the list looks like it just stops —
// and when it does show, it's the OS default.
<div className="h-56 overflow-y-auto">
  {releases.map((r) => <Row key={r} label={r} />)}
</div>

// ✅ ScrollArea. A scrollbar that stays discoverable on hover,
// plus a shadcn scroll-fade on the viewport so the edge dissolves
// when there's more below.
<ScrollArea viewportClassName="scroll-fade" className="h-56">
  {releases.map((r) => <Row key={r} label={r} />)}
</ScrollArea>`;

const HORIZONTAL_CODE = `import { ScrollArea } from "./components";

// scroll-fade-x fades the left/right edges instead.
<ScrollArea
  orientation="horizontal"
  viewportClassName="scroll-fade-x"
  className="w-full"
>
  <div className="flex gap-2 p-3 w-max">
    {months.map((month) => (
      <Card key={month} label={month} />
    ))}
  </div>
</ScrollArea>`;

const FADE_CODE = `/* globals.css — vendored from shadcn's scroll-fade utility.
   A mask dissolves the content toward the edges with more to
   scroll; a scroll-driven animation keeps the true start/end
   edge crisp. */
.scroll-fade {
  --scroll-fade-size: 48px;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--scroll-fade-size),
    #000 calc(100% - var(--scroll-fade-size)),
    transparent 100%
  );
}

/* Apply it to any scroll container, or to a ScrollArea viewport. */
<ScrollArea viewportClassName="scroll-fade" className="h-56">
  ...
</ScrollArea>`;

const TABLE_CODE = `import { ScrollArea } from "./components";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "./components";

// orientation="both" adds both scrollbars and the corner. w-max
// lets the table grow past the viewport instead of squeezing in.
<ScrollArea orientation="both" className="h-80 w-full">
  <Table className="w-max">
    <TableHeader>
      <TableRow>
        <TableHead>City</TableHead>
        {months.map((m) => (
          <TableHead key={m} className="text-right">{m}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {cities.map((city, r) => (
        <TableRow key={city} index={r}>
          <TableCell>{city}</TableCell>
          {months.map((m, c) => (
            <TableCell key={m} className="text-right tabular-nums">
              {metric(r, c)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ScrollArea>`;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const scrollAreaProps: PropDef[] = [
  {
    name: "orientation",
    type: '"vertical" | "horizontal" | "both"',
    default: '"vertical"',
    description: "Which axes get scrollbars.",
  },
  {
    name: "viewportClassName",
    type: "string",
    description:
      "Classes for the inner scrolling viewport — where the scroll-fade utility goes.",
  },
  {
    name: "className",
    type: "string",
    description:
      "Classes for the outer container — set the height/width constraint here.",
  },
];

// ---------------------------------------------------------------------------
// Demos
// ---------------------------------------------------------------------------

function ReleaseRows() {
  return (
    <div className="flex flex-col p-3">
      {RELEASES.map((release) => (
        <div
          key={release}
          className="px-3 py-2 text-label text-fg-default whitespace-nowrap"
        >
          {release}
        </div>
      ))}
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-label text-fg-muted text-center">
      {children}
    </span>
  );
}

function ProblemDemo() {
  const shape = useShape();
  return (
    <ComponentPreview code={PROBLEM_CODE} padding="responsive">
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="flex flex-col gap-2">
          <div
            className={`h-56 w-64 overflow-y-auto border border-border ${shape.container}`}
          >
            <ReleaseRows />
          </div>
          <PanelLabel>
            <span aria-hidden="true">❌</span> MacOS scrollbar — hide until you
            scroll + clipped list without signifier
          </PanelLabel>
        </div>
        <div className="flex flex-col gap-2">
          <ScrollArea
            viewportClassName="scroll-fade"
            className={`h-56 w-64 border border-border ${shape.container}`}
          >
            <ReleaseRows />
          </ScrollArea>
          <PanelLabel>
            <span aria-hidden="true">✅</span> Zeron Design — Refined
            scrollbars on hover + fade
          </PanelLabel>
        </div>
      </div>
    </ComponentPreview>
  );
}

function HorizontalDemo() {
  const shape = useShape();
  return (
    <ComponentPreview
      code={HORIZONTAL_CODE}
      padding="none"
      minHeightClass="min-h-0"
    >
      <ScrollArea
        orientation="horizontal"
        viewportClassName="scroll-fade-x"
        className="w-full"
      >
        <div className="flex gap-2 p-3 w-max">
          {MONTHS.map((month) => (
            <div
              key={month}
              className={`flex items-center justify-center h-20 w-28 shrink-0 border border-border text-label text-fg-default ${shape.bg}`}
            >
              {month}
            </div>
          ))}
        </div>
      </ScrollArea>
    </ComponentPreview>
  );
}

function FadeDemo() {
  const shape = useShape();
  return (
    <ComponentPreview code={FADE_CODE} padding="responsive">
      <ScrollArea
        viewportClassName="scroll-fade"
        className={`h-64 w-72 border border-border ${shape.container}`}
      >
        <ReleaseRows />
      </ScrollArea>
    </ComponentPreview>
  );
}

function TableDemo() {
  return (
    <ComponentPreview code={TABLE_CODE} padding="none">
      <ScrollArea orientation="both" className="h-80 w-full">
        <Table className="w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">City</TableHead>
              {MONTHS.map((m) => (
                <TableHead key={m} className="text-right whitespace-nowrap">
                  {m}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {CITIES.map((city, r) => (
              <TableRow key={city} index={r}>
                <TableCell className="text-fg-default whitespace-nowrap">
                  {city}
                </TableCell>
                {MONTHS.map((m, c) => (
                  <TableCell
                    key={m}
                    className="text-right tabular-nums whitespace-nowrap"
                  >
                    {metric(r, c)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Doc Page
// ---------------------------------------------------------------------------

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-title text-fg-default mt-2 font-semibold"
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-body text-fg-muted leading-relaxed">
      {children}
    </p>
  );
}

export default function ScrollbarsDoc() {
  const t = useTranslations("scrollbars");
  const localizedProps = scrollAreaProps.map((prop, index) => ({ ...prop, description: t(`p${index}`) }));
  return (
    <DocPage
      title="Scrollbars"
      slug="scrollbars"
      installSlug="scroll-area"
      description={
        <>
          A scrollbar that stays out of the way but never disappears, over
          shadcn&apos;s scroll-fade as the baseline edge treatment — restyled to
          the shape system, with native scroll physics on touch.
        </>
      }
    >
      <DocSection title={t("problem")}>
        <div className="flex flex-col gap-3 text-body text-fg-muted leading-relaxed">
          <p>
            {t("problemBody")}
          </p>
        </div>
        <ProblemDemo />
      </DocSection>

      <DocSection title={t("scrollbar")}>
        <P>
          {t("scrollbarBody")}
        </P>
        <P>
          Built on Base UI with a single API. Scrollbar machinery adapted from{" "}
          <a
            href="https://lina.sameer.sh"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Lina
          </a>
          .
        </P>
      </DocSection>

      <DocSection title={t("fade")}>
        <P>
          {t("fadeBody")}
        </P>
        <FadeDemo />
      </DocSection>

      <DocSection title={t("examples")}>
        <H3>{t("horizontal")}</H3>
        <P>{t("horizontalBody")}</P>
        <HorizontalDemo />

        <H3>{t("doubleOverflow")}</H3>
        <P>{t("doubleOverflowBody")}</P>
        <TableDemo />
      </DocSection>

      <DocSection title={t("apiReference")}>
        <H3>ScrollArea</H3>
        <PropsTable props={localizedProps} />
      </DocSection>
    </DocPage>
  );
}
