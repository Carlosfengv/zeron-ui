"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useIcons } from "@zeron/icons/context";
import {
  ACCORDION_ITEMS,
  BADGE_ITEMS,
  BUTTON_ITEMS,
  CHECKBOX_ITEMS,
  DIALOG_COPY,
  DROPDOWN_ITEMS,
  RADIO_DEFAULT,
  RADIO_ITEMS,
  SELECT_DEFAULT,
  SELECT_PLACEHOLDER,
  SELECT_ROLES,
  SLIDER_OPACITY,
  SLIDER_VOLUME,
  SWITCH_ITEMS,
  TABLE_COLUMNS,
  TABLE_ROWS,
  TABS_DEFAULT,
  TABS_ITEMS,
  TOOLTIP_COPY,
} from "@docs/components/shell/site/demo-data";

import {
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@zeron/ui/accordion";
import { Badge } from "@zeron/ui/badge";
import { BadgeOverflow } from "@zeron/ui/badge-overflow";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@zeron/ui/breadcrumb";
import { Button } from "@zeron/ui/button";
import { ButtonGroup } from "@zeron/ui/button-group";
import { Checkbox } from "@zeron/ui/checkbox";
import {
  CheckboxGroup,
  CheckboxItem,
} from "@zeron/ui/checkbox-group";
import { ColorPicker, ColorPickerPortalContainer } from "@zeron/ui/color-picker";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@zeron/ui/dialog";
import { Dropdown } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Input } from "@zeron/ui/input";
import { InputCopy } from "@zeron/ui/input-copy";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@zeron/ui/input-group";
import { Kbd, KbdGroup } from "@zeron/ui/kbd";
import { DataTable, useDataTable } from "@zeron/ui/data-table";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@zeron/ui/popover";
import { RadioGroup, RadioGroupItem } from "@zeron/ui/radio-group";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@zeron/ui/select";
import { Slider, SliderComfortable } from "@zeron/ui/slider";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperTitle,
  StepperTrigger,
} from "@zeron/ui/stepper";
import { Switch } from "@zeron/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@zeron/ui/table";
import { Tabs, TabsList, TabItem } from "@zeron/ui/tabs";
import { ThinkingIndicator } from "@zeron/ui/thinking-indicator";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepDetails,
  ThinkingStepSources,
  ThinkingStepSource,
} from "@zeron/ui/thinking-steps";
import { Tooltip } from "@zeron/ui/tooltip";
import {
  AskUserQuestions,
  type AskUserQuestion,
} from "@zeron/ui/ask-user-questions";
import { DataGridDemo } from "@docs/components/shell/site/data-grid-demo";

function AccordionPreview() {
  return (
    <div className="w-full max-w-[420px]">
      <AccordionGroup type="single" defaultValue="item-1" className="w-full">
        {ACCORDION_ITEMS.map((item, i) => (
          <AccordionItem key={item.value} value={item.value} index={i}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </AccordionGroup>
    </div>
  );
}

function BadgePreview() {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {BADGE_ITEMS.map((item) => (
        <Badge key={item.label} variant="dot" color={item.color}>
          {item.label}
        </Badge>
      ))}
    </div>
  );
}

function ButtonGroupPreview() {
  const { pencil: Pencil, copy: Copy, "file-archive": Archive } = useIcons();

  return (
    <ButtonGroup aria-label="Document actions">
      <Button variant="tertiary" size="icon-sm" aria-label="Edit">
        <Pencil />
      </Button>
      <Button variant="tertiary" size="icon-sm" aria-label="Duplicate">
        <Copy />
      </Button>
      <Button variant="tertiary" size="icon-sm" aria-label="Archive">
        <Archive />
      </Button>
    </ButtonGroup>
  );
}

const badgeOverflowPreviewItems = [
  { label: "Design", color: "violet" },
  { label: "React", color: "blue" },
  { label: "A11y", color: "green" },
  { label: "Motion", color: "amber" },
  { label: "Research", color: "rose" },
] as const;

type BadgeOverflowPreviewItem = (typeof badgeOverflowPreviewItems)[number];

function BadgeOverflowPreview() {
  return (
    <div className="w-full max-w-[300px]">
      <BadgeOverflow<BadgeOverflowPreviewItem>
        className="gap-1"
        getBadgeKey={(item) => item.label}
        getBadgeLabel={(item: BadgeOverflowPreviewItem) => item.label}
        items={[...badgeOverflowPreviewItems]}
        renderBadge={(item, label) => (
          <Badge color={item.color} size="sm" variant="dot">
            {label}
          </Badge>
        )}
      />
    </div>
  );
}

function BreadcrumbPreview() {
  return (
    <div className="w-full max-w-[420px] overflow-hidden">
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Atlas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">Project settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

function ButtonPreview() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {BUTTON_ITEMS.map((item) => (
        <Button key={item.label} variant={item.variant} size="sm">
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function InputPreview() {
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-2">
      <Input placeholder="you@example.com" aria-label="Email address" />
      <Input variant="secondary" placeholder="Search projects…" aria-label="Search projects" />
    </div>
  );
}

function CheckboxPreview() {
  const [checked, setChecked] = useState(true);

  return (
    <div className="flex flex-col gap-3 text-body">
      <label className="flex cursor-pointer items-center gap-2.5">
        <Checkbox checked={checked} onCheckedChange={setChecked} />
        <span>Product updates</span>
      </label>
      <label className="flex cursor-pointer items-center gap-2.5 text-fg-muted">
        <Checkbox checked="indeterminate" />
        <span>Selected projects</span>
      </label>
    </div>
  );
}

function CheckboxGroupPreview() {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  return (
    <div className="w-full max-w-[220px]">
      <CheckboxGroup checkedIndices={checked}>
        {CHECKBOX_ITEMS.map((item, i) => (
          <CheckboxItem
            key={item.id}
            index={i}
            label={item.label}
            checked={checked.has(i)}
            onToggle={() => {
              setChecked((prev) => {
                const next = new Set(prev);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                return next;
              });
            }}
          />
        ))}
      </CheckboxGroup>
    </div>
  );
}

function DialogPreview() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" size="sm">{DIALOG_COPY.trigger}</Button>} />
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{DIALOG_COPY.title}</DialogTitle>
          <DialogDescription>{DIALOG_COPY.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">{DIALOG_COPY.cancel}</Button>} />
          <Button>{DIALOG_COPY.confirm}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DropdownPreview() {
  const icons = useIcons();
  const [selected, setSelected] = useState<number | null>(0);
  return (
    <div className="w-full max-w-[280px]">
      <Dropdown checkedIndex={selected ?? undefined}>
        {DROPDOWN_ITEMS.map((item, i) => (
          <MenuItem
            key={item.value}
            index={i}
            icon={icons[item.icon]}
            label={item.label}
            checked={selected === i}
            onSelect={() => setSelected(selected === i ? null : i)}
          />
        ))}
      </Dropdown>
    </div>
  );
}

function InputCopyPreview() {
  return (
    <div className="w-full max-w-[420px] relative z-10">
      <InputCopy value="npx zeron-ui add button" />
    </div>
  );
}

function InputGroupPreview() {
  return (
    <div className="w-full max-w-[320px]">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="zerondesign" aria-label="Domain" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>Copy</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function KbdPreview() {
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-3 text-body">
      <div className="flex items-center justify-between gap-4">
        <span className="text-fg-muted">Command palette</span>
        <KbdGroup aria-label="Command K">
          <Kbd aria-label="Command">⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-fg-muted">Quick open</span>
        <KbdGroup aria-label="Command P">
          <Kbd aria-label="Command">⌘</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      </div>
    </div>
  );
}

function PopoverPreview() {
  return (
    <Popover>
      <PopoverTrigger
        render={<Button size="sm" variant="secondary">Open popover</Button>}
      />
      <PopoverContent align="center" className="w-64">
        <PopoverHeader>
          <PopoverTitle>Project shared</PopoverTitle>
          <PopoverDescription>
            Anyone with the link can view this workspace.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}

function RadioGroupPreview() {
  const [value, setValue] = useState<string>(RADIO_DEFAULT);
  return (
    <div className="w-full max-w-[220px]">
      <RadioGroup value={value} onValueChange={setValue}>
        {RADIO_ITEMS.map((item) => (
          <label
            className="flex cursor-pointer items-center gap-2.5 text-body"
            key={item.value}
          >
            <RadioGroupItem value={item.value} />
            <span>{item.label}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

function SelectPreview() {
  const [value, setValue] = useState<string>(SELECT_DEFAULT);
  return (
    <div className="w-full max-w-[280px]">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger placeholder={SELECT_PLACEHOLDER} variant="bordered" />
        <SelectContent>
          {SELECT_ROLES.map((role, i) => (
            <SelectItem key={role} index={i} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SliderPreview() {
  const [basic, setBasic] = useState<number>(SLIDER_OPACITY.initial);
  const [volume, setVolume] = useState<number>(SLIDER_VOLUME.initial);
  return (
    <div className="flex flex-col gap-8 w-full max-w-[280px]">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between text-label">
          <span className="text-fg-muted">{SLIDER_OPACITY.label}</span>
          <span className="text-fg-muted tabular-nums">{basic}</span>
        </div>
        <Slider value={basic} onChange={(v) => setBasic(v as number)} showValue={false} />
      </div>
      <SliderComfortable
        variant="scrubber"
        label={SLIDER_VOLUME.label}
        value={volume}
        onChange={setVolume}
        min={0}
        max={100}
        formatValue={(v) => `${v}%`}
      />
    </div>
  );
}

function StepperPreview() {
  const [value, setValue] = useState("profile");
  const steps = [
    { value: "account", title: "Account" },
    { value: "profile", title: "Profile" },
    { value: "review", title: "Review" },
  ];

  return (
    <Stepper value={value} onValueChange={setValue} className="w-full max-w-[420px]">
      <StepperList className="justify-center gap-1">
        {steps.map((step) => (
          <StepperItem key={step.value} value={step.value} className="p-1.5">
            <StepperTrigger className="gap-2">
              <StepperIndicator />
              <StepperTitle>{step.title}</StepperTitle>
              <StepperDescription className="sr-only">
                {step.title} step
              </StepperDescription>
            </StepperTrigger>
          </StepperItem>
        ))}
      </StepperList>
    </Stepper>
  );
}

function SwitchPreview() {
  const [on, setOn] = useState<Set<string>>(
    () => new Set(SWITCH_ITEMS.filter((item) => item.initial).map((item) => item.id))
  );
  return (
    <div className="flex flex-col gap-3">
      {SWITCH_ITEMS.map((item) => (
        <Switch
          key={item.id}
          label={item.label}
          checked={on.has(item.id)}
          onToggle={() =>
            setOn((prev) => {
              const next = new Set(prev);
              if (next.has(item.id)) next.delete(item.id);
              else next.add(item.id);
              return next;
            })
          }
        />
      ))}
    </div>
  );
}

function TablePreview() {
  return (
    <div className="w-full max-w-[420px]">
      <Table>
        <TableHeader>
          <TableRow>
            {TABLE_COLUMNS.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {TABLE_ROWS.map((row, i) => (
            <TableRow key={row[0]} index={i}>
              {row.map((cell) => (
                <TableCell key={cell}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type DataTablePreviewRow = {
  name: string;
  owner: string;
  status: "Active" | "Paused" | "Draft";
};

const dataTablePreviewRows: DataTablePreviewRow[] = [
  { name: "Atlas", owner: "Maya", status: "Active" },
  { name: "Beacon", owner: "Theo", status: "Paused" },
  { name: "Canvas", owner: "Iris", status: "Draft" },
];

const dataTablePreviewColumns: ColumnDef<DataTablePreviewRow, unknown>[] = [
  { accessorKey: "name", header: "Project" },
  { accessorKey: "owner", header: "Owner" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        color={
          row.original.status === "Active"
            ? "green"
            : row.original.status === "Paused"
              ? "amber"
              : "gray"
        }
        size="sm"
        variant="dot"
      >
        {row.original.status}
      </Badge>
    ),
  },
];

function DataTablePreview() {
  const { table } = useDataTable({
    columns: dataTablePreviewColumns,
    data: dataTablePreviewRows,
    initialState: { pagination: { pageIndex: 0, pageSize: 3 } },
  });

  return (
    <div className="w-full max-w-[520px]">
      <DataTable
        className="[&_[data-slot=data-table-pagination]]:hidden"
        table={table}
      />
    </div>
  );
}

function DataGridPreview() {
  return (
    <div className="w-full max-w-[560px]">
      <DataGridDemo compact height={220} />
    </div>
  );
}

function TabsPreview() {
  const [tab, setTab] = useState<string>(TABS_DEFAULT);
  return (
    <div className="w-full max-w-[360px]">
      <Tabs value={tab} onValueChange={setTab} variant="pill">
        <TabsList>
          {TABS_ITEMS.map((item) => (
            <TabItem key={item.value} value={item.value} label={item.label} />
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

function ThinkingIndicatorPreview() {
  return <ThinkingIndicator />;
}

// Same eight questions as the docs page's first "Example" section, so the
// home-page bento card and demo slide stay in sync with the canonical demo
// the docs link to.
const askUserExampleQuestions: AskUserQuestion[] = [
  {
    id: "role",
    title: "How do you plan to use Zeron Design?",
    options: [
      { id: "design", title: "Designer", description: "Prototyping flows and pages" },
      { id: "eng", title: "Engineer", description: "Shipping production UI" },
      { id: "pm", title: "PM", description: "Aligning the team on patterns" },
      { id: "founder", title: "Founder", description: "Bootstrapping a product" },
    ],
  },
  {
    id: "shape",
    title: "Which shape language fits your brand?",
    options: [
      { id: "rounded", title: "Rounded", description: "Soft, familiar corners" },
      { id: "pill", title: "Pill", description: "Fully rounded, friendly" },
    ],
  },
  {
    id: "components",
    title: "Which components are you reaching for first?",
    multiSelect: true,
    options: [
      { id: "input", title: "InputMessage", description: "Chat-style composer with attachments" },
      { id: "thinking", title: "ThinkingSteps", description: "Streamed reasoning steps" },
      { id: "ask", title: "AskUserQuestions", description: "Stepped question flows" },
      { id: "tabs", title: "Tabs", description: "Segment tab variant" },
      { id: "nav", title: "NavMenu", description: "Sidebar navigation" },
    ],
    nextLabel: "Continue",
  },
  {
    id: "drew",
    title: "What drew you to Zeron Design?",
    options: [
      { id: "motion", title: "Motion", description: "Springs that feel alive" },
      { id: "craft", title: "Craft", description: "Pixel-level polish" },
      { id: "tokens", title: "Tokens", description: "Shape and elevation systems" },
    ],
    allowOther: true,
    otherPlaceholder: "Something else?",
  },
  {
    id: "frameworks",
    title: "Where will you ship these components?",
    multiSelect: true,
    options: [
      { id: "next", title: "Next.js", description: "App Router projects" },
      { id: "remix", title: "Remix", description: "Full-stack apps" },
      { id: "vite", title: "Vite + React", description: "SPAs and dashboards" },
      { id: "astro", title: "Astro", description: "Content-first sites" },
    ],
  },
  {
    id: "themes",
    title: "Which theme mode do you support?",
    options: [
      { id: "light", title: "Light only" },
      { id: "dark", title: "Dark only" },
      { id: "system", title: "System-aware" },
      { id: "toggle", title: "User toggle" },
    ],
  },
  {
    id: "missing",
    title: "What's missing from the registry today?",
    multiSelect: true,
    options: [
      { id: "data", title: "Data table", description: "Sortable, filterable rows" },
      { id: "calendar", title: "Calendar", description: "Date picker and range" },
      { id: "command", title: "Command menu", description: "Fast keyboard launcher" },
    ],
    allowOther: true,
    otherPlaceholder: "Tell us what to build next…",
    nextLabel: "Send feedback",
  },
  {
    id: "recommend",
    title: "Would you recommend Zeron Design to a teammate?",
    skippable: false,
    options: [
      { id: "yes", title: "Yes", description: "Already have" },
      { id: "soon", title: "Soon", description: "Once it covers more ground" },
      { id: "unsure", title: "Not sure yet", description: "Still evaluating" },
    ],
  },
];

function AskUserQuestionsPreview() {
  // self-end overrides the BentoCard's `items-center` so the AskUserQuestions
  // card sits flush with the bottom of the preview area — its content height
  // changes per question (taller multi-select vs short single-select), so
  // anchoring the bottom keeps the footer button + chip column in the same
  // spot instead of drifting up and down as the user navigates.
  return (
    <div className="w-full max-w-[420px] self-end">
      <AskUserQuestions questions={askUserExampleQuestions} />
    </div>
  );
}

function ThinkingStepsPreview() {
  return (
    <div className="w-full max-w-[380px]">
      <ThinkingSteps defaultOpen>
        <ThinkingStepsHeader>Research Agent</ThinkingStepsHeader>
        <ThinkingStepsContent>
          <ThinkingStep status="complete" icon="search" label="Searching profiles">
            <ThinkingStepSources>
              <ThinkingStepSource>x.com</ThinkingStepSource>
              <ThinkingStepSource>github.com</ThinkingStepSource>
            </ThinkingStepSources>
          </ThinkingStep>
          <ThinkingStep status="complete" icon="globe" label="Reading portfolio">
            <ThinkingStepDetails
              summary="Explored 4 pages"
              details={[
                "Read about.html",
                "Read projects.html",
                "Read resume.pdf",
                "Read contact.html",
              ]}
            />
          </ThinkingStep>
          <ThinkingStep status="complete" icon="search" label="Searching recent work">
            <ThinkingStepSources>
              <ThinkingStepSource>figma.com</ThinkingStepSource>
              <ThinkingStepSource>behance.net</ThinkingStepSource>
            </ThinkingStepSources>
          </ThinkingStep>
          <ThinkingStep status="active" icon="brain" label="Analyzing results"
            description="Compiling findings into a summary." isLast />
        </ThinkingStepsContent>
      </ThinkingSteps>
    </div>
  );
}

function TooltipPreview() {
  return (
    <div className="relative z-10">
      <Tooltip content={TOOLTIP_COPY.content}>
        <Button variant="secondary" size="sm">{TOOLTIP_COPY.trigger}</Button>
      </Tooltip>
    </div>
  );
}

function ColorPickerPreview() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  // `relative` is load-bearing: the FormatDropdown (HEX/RGB/HSL/OKLCH) portals
  // INTO this wrapper and uses absolute positioning computed against the
  // wrapper's bounding rect. Without `relative`, the menu's absolute coords
  // resolve against the next positioned ancestor (the BentoCard's `.relative`
  // outer wrapper), so the dropdown lands far to the left of the picker.
  return (
    <div ref={setContainer} className="relative w-full max-w-[280px]">
      <ColorPickerPortalContainer value={container}>
        <ColorPicker defaultValue="#6B97FF" />
      </ColorPickerPortalContainer>
    </div>
  );
}

export const previewMap: Record<string, React.FC> = {
  accordion: AccordionPreview,
  "ask-user-questions": AskUserQuestionsPreview,
  badge: BadgePreview,
  "badge-overflow": BadgeOverflowPreview,
  breadcrumb: BreadcrumbPreview,
  button: ButtonPreview,
  "button-group": ButtonGroupPreview,
  checkbox: CheckboxPreview,
  "checkbox-group": CheckboxGroupPreview,
  "color-picker": ColorPickerPreview,
  "data-grid": DataGridPreview,
  "data-table": DataTablePreview,
  dialog: DialogPreview,
  dropdown: DropdownPreview,
  input: InputPreview,
  "input-copy": InputCopyPreview,
  "input-group": InputGroupPreview,
  kbd: KbdPreview,
  popover: PopoverPreview,
  "radio-group": RadioGroupPreview,
  select: SelectPreview,
  slider: SliderPreview,
  stepper: StepperPreview,
  switch: SwitchPreview,
  table: TablePreview,
  tabs: TabsPreview,
  "thinking-indicator": ThinkingIndicatorPreview,
  "thinking-steps": ThinkingStepsPreview,
  tooltip: TooltipPreview,
};
