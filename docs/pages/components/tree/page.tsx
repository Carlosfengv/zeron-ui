"use client";

import { useState } from "react";
import { Tree, type TreeNode } from "@zeron/ui/tree";
import { MemberTree, type OrganizationNode } from "@zeron/ui/member-tree";
import { FileTree, type FileNode } from "@zeron/ui/file-tree";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Switch } from "@zeron/ui/switch";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { AgentGuide } from "@docs/components/content/AgentGuide";
import {
  PLAY_SWITCH,
  PlayDivider,
  PlayField,
  PlaygroundLayout,
  PlaygroundPanel,
  PlaySection,
  PlaySelect,
} from "@docs/components/playground/playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useIcon } from "@zeron/icons/context";
import { useTranslations } from "next-intl";
import metricCatalogData from "./metric-catalog.json";

type MetricCatalogMetric = {
  id: string;
  label: string;
  unit?: string;
  dimensions?: readonly string[];
  aggregate?: boolean;
};

type MetricCatalogSource = {
  id: string;
  label: string;
  metricCount: number;
  listedMetricCount?: number;
  resources: readonly {
    id: string;
    type?: string;
    label: string;
    metricCount: number;
    listedMetricCount?: number;
    partial?: boolean;
    groups: readonly {
      id: string;
      label: string;
      metrics: readonly MetricCatalogMetric[];
    }[];
  }[];
};

type MetricTreeData = {
  kind: "source" | "resource" | "group" | "metric";
  id: string;
  metricCount?: number;
  listedMetricCount?: number;
  resourceType?: string;
  unit?: string;
  dimensions?: readonly string[];
  aggregate?: boolean;
};

const metricCatalog = metricCatalogData as readonly MetricCatalogSource[];

const storageResourceTypes = new Set([
  "volume", "primary_storage", "backup_storage", "storage_cluster", "storage_host",
  "storage_pool", "physical_disk", "ceph_osd", "ceph_rbd", "k8s_pvc",
]);
const networkResourceTypes = new Set(["l3_network", "load_balancer", "vrouter", "port_group"]);
const clusterResourceTypes = new Set(["cluster", "k8s_cluster"]);
const performanceGroupIds = new Set(["cpu", "memory", "gpu", "resource-utilization", "io-performance", "disk-io"]);
const storageGroupIds = new Set(["capacity", "disk", "storage", "inode", "osd-overview"]);
const networkGroupIds = new Set(["network", "traffic", "connections", "http-response", "ip-address"]);
const healthGroupIds = new Set(["health", "health-recovery", "smart-health", "status", "runtime", "recovery", "monitor", "service"]);

const metricCatalogItems: readonly TreeNode<MetricTreeData>[] = metricCatalog.map((source) => {
  const sourceKey = `source:${source.id}`;
  return {
    key: sourceKey,
    label: source.label,
    selectable: false,
    data: {
      kind: "source",
      id: source.id,
      metricCount: source.metricCount,
      listedMetricCount: source.listedMetricCount,
    },
    children: source.resources.map((resource) => {
      const resourceKey = `${sourceKey}:resource:${resource.id}`;
      const resourceType = resource.type ?? resource.id;
      return {
        key: resourceKey,
        label: resource.label,
        description: `[${resourceType}]`,
        keywords: [resourceType],
        selectable: false,
        data: {
          kind: "resource",
          id: resource.id,
          resourceType,
          metricCount: resource.metricCount,
          listedMetricCount: resource.listedMetricCount,
        },
        children: resource.groups.map((group) => {
          const groupKey = `${resourceKey}:group:${group.id}`;
          return {
            key: groupKey,
            label: group.label,
            selectable: false,
            data: { kind: "group", id: group.id },
            children: group.metrics.map((metric) => {
              const metricKey = `${groupKey}:metric:${metric.id}`;
              return {
                key: metricKey,
                label: metric.label,
                keywords: [metric.id, metric.unit ?? "", ...(metric.dimensions ?? [])],
                data: {
                  kind: "metric",
                  id: metricKey,
                  resourceType,
                  unit: metric.unit,
                  dimensions: metric.dimensions,
                  aggregate: metric.aggregate,
                },
              };
            }),
          };
        }),
      };
    }),
  };
});

const categoryItems: readonly TreeNode[] = [
  {
    key: "product", label: "Product", selectable: false,
    children: [
      { key: "design-system", label: "Design system" },
      { key: "analytics", label: "Analytics" },
    ],
  },
];

const organization: readonly OrganizationNode[] = [
  {
    key: "department:product", type: "department", departmentId: "product", label: "Product",
    children: [
      { key: "member:lin", type: "member", memberId: "lin", label: "Lin", description: "Product designer" },
      { key: "member:zhou", type: "member", memberId: "zhou", label: "Zhou", description: "Product manager" },
    ],
  },
];

const files: readonly FileNode[] = [
  {
    key: "folder:project", type: "folder", label: "Project files",
    children: [
      { key: "file:brief", type: "file", label: "Brief.pdf", extension: "pdf" },
      { key: "file:budget", type: "file", label: "Budget.xlsx", extension: "xlsx" },
    ],
  },
];

const richItems: readonly TreeNode[] = [{
  key: "workspace", label: "Workspace", description: "Shared project space", selectable: false,
  children: [
    { key: "roadmap", label: "Roadmap", description: "Planning document", keywords: ["planning"] },
    { key: "archive", label: "Archive", disabled: true, disabledReason: "You do not have archive access", children: [{ key: "old-plan", label: "Old plan" }] },
  ],
}];

const multiLevelItems: readonly TreeNode[] = [
  {
    key: "workspace", label: "Acme workspace", description: "Company workspace", selectable: false,
    children: [
      {
        key: "teams", label: "Teams", selectable: false,
        children: [
          {
            key: "product", label: "Product", selectable: false,
            children: [
              { key: "design-system", label: "Design system", description: "12 components" },
              { key: "analytics", label: "Analytics", description: "3 dashboards" },
            ],
          },
          {
            key: "engineering", label: "Engineering", selectable: false,
            children: [
              {
                key: "platform", label: "Platform", selectable: false,
                children: [
                  { key: "public-api", label: "Public API", description: "Production" },
                  { key: "infrastructure", label: "Infrastructure", description: "8 services" },
                ],
              },
            ],
          },
        ],
      },
      { key: "archive", label: "Archive", description: "18 inactive projects" },
    ],
  },
];

const genericCode = `const [selectedKeys, setSelectedKeys] = useState<readonly string[]>([]);

<Tree
  aria-label="Choose a category"
  items={categories}
  defaultExpandedKeys={["product"]}
  selectionMode="single"
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
/>`;

const memberCode = `<MemberTree
  aria-label="Choose members"
  items={organization}
  defaultExpandedKeys={["department:product"]}
  selectableTypes={["member"]}
  selectionMode="multiple"
  selectionIndicator="checkbox"
  checkStrategy="cascade"
/>`;

const fileCode = `<FileTree
  aria-label="Choose a PDF"
  items={files}
  defaultExpandedKeys={["folder:project"]}
  selectableTypes={["file"]}
  allowedExtensions={["pdf"]}
  selectionMode="single"
/>`;

const multiLevelCode = `import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";

<Tree
  aria-label="Workspace hierarchy"
  items={items}
  defaultExpandedKeys={["workspace", "teams", "product", "engineering", "platform"]}
  selectionMode="single"
  showLines
  variant="bordered"
  renderActions={({ node }) => (
    <DropdownMenu>
      <DropdownTrigger
        render={
          <Button
            iconOnly
            size="xs"
            variant="ghost"
            aria-label={\`Options for \${node.label}\`}
          >
            <MoreIcon />
          </Button>
        }
      />
      <DropdownContent align="end" className="w-40">
        <MenuItem index={0} label="Rename" onSelect={() => rename(node)} />
        <MenuItem index={1} label="Duplicate" onSelect={() => duplicate(node)} />
        <MenuItem index={2} label="Archive" onSelect={() => archive(node)} />
      </DropdownContent>
    </DropdownMenu>
  )}
/>`;

const metricCatalogCode = `import metricCatalog from "./metric-catalog.json";

const items = toMetricTreeNodes(metricCatalog);

<Tree
  aria-label="实时指标目录"
  items={items}
  query={query}
  defaultExpandedKeys={[
    "source:zstack-cloud",
    "source:zstack-cloud:resource:cluster",
    "source:zstack-cloud:resource:cluster:group:cpu",
    "source:zstack-cloud:resource:cluster:group:memory",
    "source:zstack-cloud:resource:cluster:group:network",
    "source:zstack-cloud:resource:cluster:group:disk",
  ]}
  selectionMode="single"
  selectionScope="leaf"
  showLines
  variant="bordered"
  renderIcon={({ node }) => <MetricNodeIcon data={node.data} />}
  renderTrailing={renderMetricMetadata}
  renderActions={renderMetricActions}
/>`;

type PlaygroundSelectionMode = "none" | "single" | "multiple";
type PlaygroundIndicator = "highlight" | "checkbox";
type PlaygroundCheckStrategy = "independent" | "cascade";
type PlaygroundStatus = "ready" | "loading" | "error";

function buildTreePlaygroundCode({
  variant,
  density,
  indent,
  selectionMode,
  selectionIndicator,
  checkStrategy,
  selectionScope,
  showLines,
  readOnly,
  disabled,
  status,
  query,
  showIcons,
  showLabelSlot,
  showTrailing,
  showActions,
  customMessages,
}: {
  variant: "plain" | "bordered";
  density: "compact" | "regular" | "comfortable";
  indent: number;
  selectionMode: PlaygroundSelectionMode;
  selectionIndicator: PlaygroundIndicator;
  checkStrategy: PlaygroundCheckStrategy;
  selectionScope: "all" | "leaf";
  showLines: boolean;
  readOnly: boolean;
  disabled: boolean;
  status: PlaygroundStatus;
  query: string;
  showIcons: boolean;
  showLabelSlot: boolean;
  showTrailing: boolean;
  showActions: boolean;
  customMessages: boolean;
}) {
  const selectionLines = selectionMode === "none"
    ? []
    : [
        `  selectionMode="${selectionMode}"`,
        ...(selectionMode === "multiple" ? [
          `  selectionIndicator="${selectionIndicator}"`,
          ...(selectionIndicator === "checkbox" ? [`  checkStrategy="${checkStrategy}"`] : []),
        ] : []),
        `  selectionScope="${selectionScope}"`,
        "  selectedKeys={selectedKeys}",
        "  onSelectionChange={setSelectedKeys}",
      ];
  const slotLines = [
    ...(showIcons ? ["  renderIcon={({ node }) => node.children?.length ? <FolderIcon /> : <MetricIcon />}"] : []),
    ...(showLabelSlot ? ["  renderLabel={({ node, selected }) => <span>{node.label}{selected ? \" · selected\" : \"\"}</span>}"] : []),
    ...(showTrailing ? ["  renderTrailing={({ level }) => <span>Level {level}</span>}"] : []),
    ...(showActions ? ["  renderActions={({ node }) => <Button iconOnly variant=\"ghost\" aria-label={`Options for ${node.label}`}><MoreIcon /></Button>}"] : []),
  ];

  return `const [expandedKeys, setExpandedKeys] = useState(["workspace", "teams", "product", "engineering", "platform"]);
const [selectedKeys, setSelectedKeys] = useState<readonly string[]>(["design-system"]);

<Tree
  aria-label="Configurable workspace tree"
  items={items}
  expandedKeys={expandedKeys}
  onExpandedChange={setExpandedKeys}
  variant="${variant}"
  density="${density}"
  indent={${indent}}
  showLines={${showLines}}
  readOnly={${readOnly}}
  disabled={${disabled}}
  loading={${status === "loading"}}
  error={${status === "error" ? '"Could not refresh the hierarchy."' : "undefined"}}
  query={${JSON.stringify(query)}}
${selectionLines.join("\n")}
${slotLines.join("\n")}
${customMessages ? "  messages={{ expandNode: (label) => `Open ${label}`, collapseNode: (label) => `Close ${label}` }}\n" : ""}  onNodeAction={(node) => openDetails(node)}
/>`;
}

function TreePlayground() {
  const t = useTranslations("tree");
  const Folder = useIcon("folder");
  const Metric = useIcon("hash");
  const More = useIcon("ellipsis");
  const [variant, setVariant] = useState<"plain" | "bordered">("bordered");
  const [density, setDensity] = useState<"compact" | "regular" | "comfortable">("regular");
  const [indent, setIndent] = useState(20);
  const [selectionMode, setSelectionMode] = useState<PlaygroundSelectionMode>("multiple");
  const [selectionIndicator, setSelectionIndicator] = useState<PlaygroundIndicator>("checkbox");
  const [checkStrategy, setCheckStrategy] = useState<PlaygroundCheckStrategy>("cascade");
  const [selectionScope, setSelectionScope] = useState<"all" | "leaf">("leaf");
  const [showLines, setShowLines] = useState(true);
  const [showIcons, setShowIcons] = useState(true);
  const [showLabelSlot, setShowLabelSlot] = useState(false);
  const [showTrailing, setShowTrailing] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [status, setStatus] = useState<PlaygroundStatus>("ready");
  const [customMessages, setCustomMessages] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<readonly string[]>(["workspace", "teams", "product", "engineering", "platform"]);
  const [selectedKeys, setSelectedKeys] = useState<readonly string[]>(["design-system"]);
  const [lastAction, setLastAction] = useState("");

  const changeSelectionMode = (nextMode: PlaygroundSelectionMode) => {
    setSelectionMode(nextMode);
    setSelectedKeys((keys) => nextMode === "single" ? keys.slice(0, 1) : nextMode === "none" ? [] : keys);
  };

  const reset = () => {
    const modes: readonly PlaygroundSelectionMode[] = ["none", "single", "multiple"];
    const nextMode = modes[Math.floor(Math.random() * modes.length)]!;
    const nextCheckbox = nextMode === "multiple" && Math.random() > 0.45;
    setVariant(Math.random() > 0.5 ? "bordered" : "plain");
    setDensity((["compact", "regular", "comfortable"] as const)[Math.floor(Math.random() * 3)]!);
    setIndent(([12, 20, 28] as const)[Math.floor(Math.random() * 3)]!);
    setSelectionMode(nextMode);
    setSelectionIndicator(nextCheckbox ? "checkbox" : "highlight");
    setCheckStrategy(Math.random() > 0.5 ? "cascade" : "independent");
    setSelectionScope(Math.random() > 0.5 ? "leaf" : "all");
    setShowLines(Math.random() > 0.3);
    setShowIcons(Math.random() > 0.2);
    setShowLabelSlot(Math.random() > 0.7);
    setShowTrailing(Math.random() > 0.35);
    setShowActions(Math.random() > 0.35);
    setReadOnly(Math.random() > 0.8);
    setDisabled(false);
    setStatus("ready");
    setCustomMessages(Math.random() > 0.7);
    setQuery("");
    setExpandedKeys(["workspace", "teams", "product", "engineering", "platform"]);
    setSelectedKeys(nextMode === "none" ? [] : ["design-system"]);
    setLastAction("");
  };

  const commonProps = {
    "aria-label": t("playgroundTreeAriaLabel"),
    items: multiLevelItems,
    expandedKeys,
    onExpandedChange: (keys: readonly string[]) => setExpandedKeys(keys),
    variant,
    density,
    indent,
    showLines,
    readOnly,
    disabled,
    loading: status === "loading",
    error: status === "error" ? t("playgroundErrorMessage") : undefined,
    onRetry: () => setStatus("ready"),
    query,
    messages: customMessages
      ? {
          expandNode: (label: string) => t("playgroundExpandNode", { label }),
          collapseNode: (label: string) => t("playgroundCollapseNode", { label }),
        }
      : undefined,
    renderIcon: showIcons
      ? ({ node }: { node: TreeNode }) => {
          const Icon = node.children?.length ? Folder : Metric;
          return <span aria-hidden data-slot="tree-icon" className="grid size-4 shrink-0 place-items-center text-fg-muted"><Icon size={16} /></span>;
        }
      : undefined,
    renderLabel: showLabelSlot
      ? ({ node, selected }: { node: TreeNode; selected: boolean }) => <span>{node.label}{selected ? ` · ${t("playgroundSelected")}` : ""}</span>
      : undefined,
    renderTrailing: showTrailing
      ? ({ level }: { level: number }) => <span className="text-label text-fg-muted">{t("playgroundLevel", { level })}</span>
      : undefined,
    renderActions: showActions
      ? ({ node }: { node: TreeNode }) => (
          <Button
            iconOnly
            size="xs"
            variant="ghost"
            aria-label={`${t("nodeOptions")}: ${node.label}`}
            onClick={() => setLastAction(t("actionFeedback", { action: t("playgroundMoreAction"), node: node.label }))}
          >
            <More aria-hidden />
          </Button>
        )
      : undefined,
    onNodeAction: (node: TreeNode) => setLastAction(t("actionFeedback", { action: t("playgroundOpenAction"), node: node.label })),
  };

  const tree = selectionMode === "none" ? (
    <Tree {...commonProps} />
  ) : selectionMode === "single" ? (
    <Tree {...commonProps} selectionMode="single" selectionScope={selectionScope} selectedKeys={selectedKeys} onSelectionChange={(keys) => setSelectedKeys(keys)} />
  ) : selectionIndicator === "checkbox" ? (
    <Tree {...commonProps} selectionMode="multiple" selectionIndicator="checkbox" checkStrategy={checkStrategy} selectionScope={selectionScope} selectedKeys={selectedKeys} onSelectionChange={(keys) => setSelectedKeys(keys)} />
  ) : (
    <Tree {...commonProps} selectionMode="multiple" selectionIndicator="highlight" selectionScope={selectionScope} selectedKeys={selectedKeys} onSelectionChange={(keys) => setSelectedKeys(keys)} />
  );

  const code = buildTreePlaygroundCode({
    variant, density, indent, selectionMode, selectionIndicator, checkStrategy, selectionScope,
    showLines, readOnly, disabled, status, query, showIcons, showLabelSlot, showTrailing,
    showActions, customMessages,
  });

  const controls = (
    <PlaygroundPanel title={t("playgroundControls")} onShuffle={reset}>
      <PlaySection label={t("playgroundDisplay")} />
      <PlayField label={t("playgroundVariant")}>
        <PlaySelect value={variant} onChange={(value) => setVariant(value as "plain" | "bordered")} options={[{ value: "plain", label: "Plain" }, { value: "bordered", label: "Bordered" }]} />
      </PlayField>
      <PlayField label={t("playgroundDensity")}>
        <PlaySelect value={density} onChange={(value) => setDensity(value as "compact" | "regular" | "comfortable")} options={[{ value: "compact", label: "Compact" }, { value: "regular", label: "Regular" }, { value: "comfortable", label: "Comfortable" }]} />
      </PlayField>
      <PlayField label={t("playgroundIndent")}>
        <PlaySelect value={String(indent)} onChange={(value) => setIndent(Number(value))} options={[{ value: "12", label: "12 px" }, { value: "20", label: "20 px" }, { value: "28", label: "28 px" }]} />
      </PlayField>
      <Switch label={t("playgroundLines")} checked={showLines} onToggle={() => setShowLines((value) => !value)} className={PLAY_SWITCH} />
      <Switch label={t("playgroundIcons")} checked={showIcons} onToggle={() => setShowIcons((value) => !value)} className={PLAY_SWITCH} />
      <Switch label={t("playgroundLabelSlot")} checked={showLabelSlot} onToggle={() => setShowLabelSlot((value) => !value)} className={PLAY_SWITCH} />
      <Switch label={t("playgroundTrailingSlot")} checked={showTrailing} onToggle={() => setShowTrailing((value) => !value)} className={PLAY_SWITCH} />
      <Switch label={t("playgroundActions")} checked={showActions} onToggle={() => setShowActions((value) => !value)} className={PLAY_SWITCH} />

      <PlayDivider />
      <PlaySection label={t("playgroundSelection")} />
      <PlayField label={t("playgroundSelectionMode")}>
        <PlaySelect value={selectionMode} onChange={(value) => changeSelectionMode(value as PlaygroundSelectionMode)} options={[{ value: "none", label: "None" }, { value: "single", label: "Single" }, { value: "multiple", label: "Multiple" }]} />
      </PlayField>
      {selectionMode === "multiple" ? <PlayField label={t("playgroundIndicator")}>
        <PlaySelect value={selectionIndicator} onChange={(value) => setSelectionIndicator(value as PlaygroundIndicator)} options={[{ value: "highlight", label: "Highlight" }, { value: "checkbox", label: "Checkbox" }]} />
      </PlayField> : null}
      {selectionMode === "multiple" && selectionIndicator === "checkbox" ? <PlayField label={t("playgroundCheckStrategy")}>
        <PlaySelect value={checkStrategy} onChange={(value) => setCheckStrategy(value as PlaygroundCheckStrategy)} options={[{ value: "independent", label: "Independent" }, { value: "cascade", label: "Cascade" }]} />
      </PlayField> : null}
      {selectionMode !== "none" ? <PlayField label={t("playgroundSelectionScope")}>
        <PlaySelect value={selectionScope} onChange={(value) => setSelectionScope(value as "all" | "leaf")} options={[{ value: "all", label: "All nodes" }, { value: "leaf", label: "Leaf nodes" }]} />
      </PlayField> : null}
      <Switch label={t("playgroundReadOnly")} checked={readOnly} onToggle={() => setReadOnly((value) => !value)} className={PLAY_SWITCH} />
      <Switch label={t("playgroundDisabled")} checked={disabled} onToggle={() => setDisabled((value) => !value)} className={PLAY_SWITCH} />

      <PlayDivider />
      <PlaySection label={t("playgroundDataAndState")} />
      <PlayField label={t("playgroundFilter")}>
        <input aria-label={t("playgroundFilter")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} className="h-7 w-28 rounded-md border border-input bg-surface px-2 text-label outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" />
      </PlayField>
      <PlayField label={t("playgroundStatus")}>
        <PlaySelect value={status} onChange={(value) => setStatus(value as PlaygroundStatus)} options={[{ value: "ready", label: t("playgroundReady") }, { value: "loading", label: t("playgroundLoading") }, { value: "error", label: t("playgroundError") }]} />
      </PlayField>
      <Switch label={t("playgroundCustomMessages")} checked={customMessages} onToggle={() => setCustomMessages((value) => !value)} className={PLAY_SWITCH} />
    </PlaygroundPanel>
  );

  return (
    <PlaygroundLayout
      controls={controls}
      preview={
        <ComponentPreview code={code} minHeightClass="min-h-[440px]" align="top" padding="responsive">
          <div className="flex w-full max-w-2xl flex-col gap-3">
            {tree}
            <div className="flex min-h-5 flex-wrap items-center justify-between gap-2 text-label text-fg-muted">
              <span>{selectionMode === "none" ? t("playgroundNoSelection") : t("playgroundSelectedKeys", { keys: selectedKeys.join(", ") || t("none") })}</span>
              <span aria-live="polite">{lastAction || t("playgroundActionHint")}</span>
            </div>
          </div>
        </ComponentPreview>
      }
    />
  );
}

export default function TreeDoc() {
  const t = useTranslations("tree");
  const More = useIcon("ellipsis");
  const Source = useIcon("globe");
  const Cluster = useIcon("square-library");
  const Compute = useIcon("monitor");
  const Storage = useIcon("inbox");
  const Network = useIcon("link");
  const Performance = useIcon("rectangle-horizontal");
  const Health = useIcon("heart");
  const Category = useIcon("folder");
  const Metric = useIcon("hash");
  const [selectedKeys, setSelectedKeys] = useState<readonly string[]>([]);
  const [memberKeys, setMemberKeys] = useState<readonly string[]>([]);
  const [fileKeys, setFileKeys] = useState<readonly string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<readonly string[]>(["workspace"]);
  const [query, setQuery] = useState("");
  const [controlledKeys, setControlledKeys] = useState<readonly string[]>(["roadmap", "missing-after-refresh"]);
  const [showError, setShowError] = useState(false);
  const [lastAction, setLastAction] = useState("");
  const [metricQuery, setMetricQuery] = useState("");
  const [selectedMetricKeys, setSelectedMetricKeys] = useState<readonly string[]>([]);
  const [metricAction, setMetricAction] = useState("");
  const treeProps: PropDef[] = [
    { name: "items", type: "readonly TreeNode<T>[]", description: "Stable, unique-keyed hierarchy rendered by the tree." },
    { name: "selectionMode", type: '"none" | "single" | "multiple"', default: '"none"', description: "Controls whether rows can become selected." },
    { name: "selectionIndicator", type: '"highlight" | "checkbox"', default: '"highlight"', description: "Uses a checkbox affordance for multiple selection." },
    { name: "checkStrategy", type: '"independent" | "cascade"', default: '"independent"', description: "Cascade selects eligible descendants and derives mixed parent state." },
    { name: "selectedKeys", type: "readonly string[]", description: "Controlled selected entity keys." },
    { name: "defaultSelectedKeys", type: "readonly string[]", description: "Initial uncontrolled selected entity keys." },
    { name: "expandedKeys", type: "readonly string[]", description: "Controlled expanded branch keys." },
    { name: "defaultExpandedKeys", type: "readonly string[]", description: "Initial uncontrolled expanded branch keys." },
    { name: "onExpandedChange", type: "(keys, details) => void", description: "Reports a pointer or keyboard branch expansion change." },
    { name: "query", type: "string", default: '""', description: "External search query; matching paths remain visible and expanded." },
    { name: "variant", type: '"plain" | "bordered"', default: '"plain"', description: "Visual surface treatment only; it does not change selection semantics." },
    { name: "density", type: '"compact" | "regular" | "comfortable"', default: '"regular"', description: "Sets the row density. Labels and descriptions remain aligned in one row." },
    { name: "selectionScope", type: '"all" | "leaf"', default: '"all"', description: "Limits direct selection to leaf nodes while allowing a cascade parent to act as a collection switch." },
    { name: "renderIcon / renderLabel / renderTrailing", type: "(context) => ReactNode", description: "Render slots for non-interactive node content." },
    { name: "renderActions", type: "(context) => ReactNode", description: "Interactive controls at the end of a row. Pointer and keyboard events are isolated from row selection." },
    { name: "loading / error / onRetry", type: "boolean / string / () => void", description: "Whole-tree refresh states. Existing data stays visible and selection is locked." },
    { name: "messages", type: "Partial<TreeMessages>", description: "Overrides loading, empty, error, retry, search, read-only, unavailable, expand/collapse, and result-count copy." },
    { name: "onNodeAction", type: "(node) => void", description: "Receives double-click or Ctrl/⌘+Enter preview actions." },
  ];
  const nodeProps: PropDef[] = [
    { name: "key", type: "string", description: "Non-empty, stable key across the full tree." },
    { name: "label", type: "string", description: "Visible and typeahead label." },
    { name: "children", type: "readonly TreeNode<T>[]", description: "Nested child nodes. Empty arrays are leaf nodes." },
    { name: "selectable / disabled / disabledReason", type: "boolean / boolean / string", description: "Controls eligibility and the reason exposed to assistive technology." },
    { name: "data", type: "T", description: "Domain entity preserved in selection callback details." },
    { name: "TreeChangeDetails", type: "{ addedKeys; removedKeys; selectedNodes; unresolvedKeys }", description: "Structured selection change metadata, including keys absent from the current data refresh." },
  ];
  const scenarioProps: PropDef[] = [
    { name: "MemberTree.selectableTypes", type: 'readonly ("department" | "member")[]', default: '["member"]', description: "Choose member entities, department entities, or both independently." },
    { name: "FileTree.selectableTypes", type: 'readonly ("folder" | "file")[]', default: '["file"]', description: "Controls file and folder entity selection." },
    { name: "FileTree.allowedExtensions", type: "readonly string[]", description: "Case-insensitive extension allow-list; disallowed files remain visible but unavailable." },
    { name: "onSelectionChange", type: "(keys, details) => void", description: "Returns stable keys plus resolved selected nodes and unresolved keys." },
  ];

  return (
    <DocPage
      title={t("title")}
      slug="tree"
      description={t("description")}
    >
      <DocSection title={t("playground")}>
        <TreePlayground />
      </DocSection>

      <DocSection title={t("generalNodes")}>
        <ComponentPreview code={genericCode}>
          <div className="w-full max-w-sm" data-component-cover-source>
            <Tree
              aria-label="Choose a category"
              items={categoryItems}
              defaultExpandedKeys={["product"]}
              selectionMode="single"
              selectedKeys={selectedKeys}
              onSelectionChange={(keys) => setSelectedKeys(keys)}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("multiLevelActionsTitle")}>
        <ComponentPreview code={multiLevelCode}>
          <div className="flex w-full max-w-lg flex-col gap-3">
            <Tree
              aria-label={t("workspaceHierarchy")}
              items={multiLevelItems}
              defaultExpandedKeys={["workspace", "teams", "product", "engineering", "platform"]}
              selectionMode="single"
              showLines
              variant="bordered"
              renderActions={({ node }) => (
                <DropdownMenu>
                  <DropdownTrigger
                    render={
                      <Button
                        iconOnly
                        size="xs"
                        variant="ghost"
                        aria-label={`${t("nodeOptions")}: ${node.label}`}
                      >
                        <More aria-hidden />
                      </Button>
                    }
                  />
                  <DropdownContent align="end" className="w-40">
                    <MenuItem index={0} label={t("rename")} onSelect={() => setLastAction(t("actionFeedback", { action: t("rename"), node: node.label }))} />
                    <MenuItem index={1} label={t("duplicate")} onSelect={() => setLastAction(t("actionFeedback", { action: t("duplicate"), node: node.label }))} />
                    <MenuItem index={2} label={t("archive")} onSelect={() => setLastAction(t("actionFeedback", { action: t("archive"), node: node.label }))} />
                  </DropdownContent>
                </DropdownMenu>
              )}
            />
            <p aria-live="polite" className="min-h-5 text-label text-fg-muted">
              {lastAction || t("actionHint")}
            </p>
          </div>
        </ComponentPreview>
        <p className="text-body text-fg-muted">{t("multiLevelActionsDescription")}</p>
      </DocSection>

      <DocSection title={t("metricCatalogTitle")}>
        <ComponentPreview code={metricCatalogCode}>
          <div className="flex w-full max-w-2xl flex-col gap-3">
            <label className="text-label text-fg-muted" htmlFor="metric-catalog-search">{t("metricCatalogSearchLabel")}</label>
            <input
              id="metric-catalog-search"
              value={metricQuery}
              onChange={(event) => setMetricQuery(event.target.value)}
              placeholder={t("metricCatalogSearchPlaceholder")}
              className="h-control-md rounded-lg border border-input bg-surface px-3 text-body outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            />
            <Tree
              aria-label={t("metricCatalogAriaLabel")}
              items={metricCatalogItems}
              query={metricQuery}
              defaultExpandedKeys={[
                "source:zstack-cloud",
                "source:zstack-cloud:resource:cluster",
                "source:zstack-cloud:resource:cluster:group:cpu",
                "source:zstack-cloud:resource:cluster:group:memory",
                "source:zstack-cloud:resource:cluster:group:network",
                "source:zstack-cloud:resource:cluster:group:disk",
              ]}
              selectionMode="single"
              selectionScope="leaf"
              selectedKeys={selectedMetricKeys}
              onSelectionChange={(keys) => setSelectedMetricKeys(keys)}
              showLines
              variant="bordered"
              renderIcon={({ node }) => {
                const data = node.data;
                if (!data) return null;
                let Icon = Metric;
                if (data.kind === "source") Icon = data.id === "zbs" ? Storage : data.id === "zaku" ? Cluster : Source;
                else if (data.kind === "resource") {
                  if (storageResourceTypes.has(data.resourceType ?? "")) Icon = Storage;
                  else if (networkResourceTypes.has(data.resourceType ?? "")) Icon = Network;
                  else if (clusterResourceTypes.has(data.resourceType ?? "")) Icon = Cluster;
                  else Icon = Compute;
                } else if (data.kind === "group") {
                  if (performanceGroupIds.has(data.id)) Icon = Performance;
                  else if (storageGroupIds.has(data.id)) Icon = Storage;
                  else if (networkGroupIds.has(data.id)) Icon = Network;
                  else if (healthGroupIds.has(data.id)) Icon = Health;
                  else Icon = Category;
                }
                return <span aria-hidden data-slot="tree-icon" className="grid size-4 shrink-0 place-items-center text-fg-muted"><Icon size={16} /></span>;
              }}
              renderTrailing={({ node }) => {
                const data = node.data;
                if (!data) return null;
                if (data.kind === "source" || data.kind === "resource") {
                  const metricCount = data.metricCount ?? 0;
                  const listedMetricCount = data.listedMetricCount ?? metricCount;
                  const isPartial = listedMetricCount !== metricCount;
                  return (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-label text-fg-muted">
                      {isPartial
                        ? t("partialMetricCount", { listed: listedMetricCount, total: metricCount })
                        : t("metricCount", { count: metricCount })}
                    </span>
                  );
                }
                if (data.kind !== "metric") return null;
                const metadata = [
                  data.unit ? `[${data.unit}]` : null,
                  data.dimensions?.length ? `{${data.dimensions.join(", ")}}` : null,
                  data.aggregate ? t("aggregate") : null,
                ].filter(Boolean).join(" · ");
                return metadata ? <span className="text-label text-fg-muted">{metadata}</span> : null;
              }}
              renderActions={({ node }) => {
                if (node.data?.kind !== "metric") return null;
                return (
                  <DropdownMenu>
                    <DropdownTrigger
                      render={
                        <Button
                          iconOnly
                          size="xs"
                          variant="ghost"
                          aria-label={`${t("metricOptions")}: ${node.label}`}
                        >
                          <More aria-hidden />
                        </Button>
                      }
                    />
                    <DropdownContent align="end" className="w-40">
                      <MenuItem index={0} label={t("addToChart")} onSelect={() => setMetricAction(t("actionFeedback", { action: t("addToChart"), node: node.label }))} />
                      <MenuItem index={1} label={t("viewDefinition")} onSelect={() => setMetricAction(t("actionFeedback", { action: t("viewDefinition"), node: node.label }))} />
                    </DropdownContent>
                  </DropdownMenu>
                );
              }}
            />
            <div className="flex min-h-5 flex-wrap items-center justify-between gap-2 text-label text-fg-muted">
              <span>{t("selectedMetricCount", { count: selectedMetricKeys.length })}</span>
              <span aria-live="polite">{metricAction || t("metricActionHint")}</span>
            </div>
          </div>
        </ComponentPreview>
        <div className="space-y-2 text-body text-fg-muted">
          <p>{t("metricCatalogDescription")}</p>
          <p>{t("metricCatalogDataNote")}</p>
        </div>
      </DocSection>

      <DocSection title={t("selectionModes")}>
        <ComponentPreview code={`<Tree aria-label="Read-only hierarchy" items={items} />`}>
          <div className="grid w-full gap-5 md:grid-cols-2">
            <Tree aria-label="Display-only hierarchy" items={categoryItems} defaultExpandedKeys={["product"]} />
            <Tree aria-label="Independent multiple selection" items={categoryItems} defaultExpandedKeys={["product"]} selectionMode="multiple" defaultSelectedKeys={["analytics"]} />
            <Tree aria-label="Checkbox cascade selection" items={categoryItems} defaultExpandedKeys={["product"]} selectionMode="multiple" selectionIndicator="checkbox" checkStrategy="cascade" selectionScope="leaf" />
            <Tree aria-label="Bordered category selection" items={categoryItems} defaultExpandedKeys={["product"]} selectionMode="single" variant="bordered" />
          </div>
        </ComponentPreview>
        <p className="text-body text-fg-muted">{t("selectionModesDescription")}</p>
      </DocSection>

      <DocSection title={t("departmentMembers")}>
        <ComponentPreview code={memberCode}>
          <div className="w-full max-w-sm">
            <MemberTree
              aria-label="Choose members"
              items={organization}
              defaultExpandedKeys={["department:product"]}
              selectableTypes={["member"]}
              selectionMode="multiple"
              selectionIndicator="checkbox"
              checkStrategy="cascade"
              selectedKeys={memberKeys}
              onSelectionChange={(keys) => setMemberKeys(keys)}
            />
          </div>
        </ComponentPreview>
        <p className="text-body text-fg-muted">{t("memberCascadeDescription")} <code>{'selectableTypes={["department"]}'}</code>.</p>
      </DocSection>

      <DocSection title={t("entitySemanticsTitle")}>
        <ComponentPreview code={`<MemberTree selectableTypes={["department"]} selectionMode="multiple" />`}>
          <div className="grid w-full gap-5 md:grid-cols-2">
            <MemberTree aria-label="Choose a department" items={organization} defaultExpandedKeys={["department:product"]} selectableTypes={["department"]} selectionMode="multiple" selectionIndicator="highlight" />
            <FileTree aria-label="Choose a folder" items={files} defaultExpandedKeys={["folder:project"]} selectableTypes={["folder"]} selectionMode="single" />
          </div>
        </ComponentPreview>
        <p className="text-body text-fg-muted">{t("entitySemanticsDescription")}</p>
      </DocSection>

      <DocSection title={t("controlledTitle")}>
        <ComponentPreview code={`<Tree query={query} expandedKeys={expandedKeys} selectedKeys={selectedKeys} onExpandedChange={setExpandedKeys} onSelectionChange={setSelectedKeys} />`}>
          <div className="flex w-full max-w-md flex-col gap-3">
            <label className="text-label text-fg-muted" htmlFor="tree-search">{t("searchLabel")}</label>
            <input id="tree-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} className="h-control-md rounded-lg border border-input bg-surface px-3 text-body outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" />
            <Tree
              aria-label="Controlled workspace tree"
              items={richItems}
              query={query}
              expandedKeys={expandedKeys}
              onExpandedChange={(keys) => setExpandedKeys(keys)}
              selectionMode="multiple"
              selectionIndicator="checkbox"
              checkStrategy="cascade"
              selectionScope="leaf"
              selectedKeys={controlledKeys}
              onSelectionChange={(keys) => setControlledKeys(keys)}
              showLines
              variant="bordered"
            />
            <p className="text-label text-fg-muted">{t("selectedKeys", { keys: controlledKeys.join(", ") || t("none") })}</p>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("constraintsTitle")}>
        <ComponentPreview code={`<Tree selectionScope="leaf" readOnly showLines density="comfortable" renderTrailing={({ node }) => <Badge>{node.key}</Badge>} />`}>
          <div className="grid w-full gap-5 md:grid-cols-2">
            <Tree aria-label="Leaf-only workspace tree" items={richItems} defaultExpandedKeys={["workspace"]} selectionMode="multiple" selectionScope="leaf" showLines density="comfortable" renderTrailing={({ node }) => <span className="rounded-full bg-muted px-2 py-0.5 text-label text-fg-muted">{node.key}</span>} />
            <Tree aria-label="Read-only workspace tree" items={richItems} defaultExpandedKeys={["workspace"]} selectionMode="multiple" selectionIndicator="checkbox" defaultSelectedKeys={["roadmap"]} readOnly variant="bordered" />
          </div>
        </ComponentPreview>
        <p className="text-body text-fg-muted">{t("constraintsDescription")}</p>
      </DocSection>

      <DocSection title={t("statesTitle")}>
        <ComponentPreview code={`<Tree loading={loading} error={error} onRetry={retry} items={items} />`}>
          <div className="flex w-full max-w-md flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-lg border border-input px-3 py-1.5 text-label" onClick={() => setShowError((value) => !value)}>{showError ? t("clearError") : t("showError")}</button>
            </div>
            <Tree aria-label="Refreshable workspace tree" items={richItems} defaultExpandedKeys={["workspace"]} selectionMode="single" error={showError ? "We could not refresh this tree." : undefined} onRetry={() => setShowError(false)} />
            <Tree aria-label="Empty tree" items={[]} />
            <Tree aria-label="No result tree" items={richItems} query="not-found" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("filesAndFolders")}>
        <ComponentPreview code={fileCode}>
          <div className="w-full max-w-sm">
            <FileTree
              aria-label="Choose a PDF"
              items={files}
              defaultExpandedKeys={["folder:project"]}
              selectableTypes={["file"]}
              allowedExtensions={["pdf"]}
              selectionMode="single"
              selectedKeys={fileKeys}
              onSelectionChange={(keys) => setFileKeys(keys)}
              variant="bordered"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("accessibility")}>
        <p className="text-body text-fg-muted">{t("accessibilityDescription")}</p>
        <p className="mt-3 text-body text-fg-muted">{t("accessibilityLimitation")}</p>
      </DocSection>

      <AgentGuide collection="components" slug="tree" />

      <DocSection title={`${t("api")} — Tree`}>
        <PropsTable props={treeProps} />
      </DocSection>
      <DocSection title={`${t("api")} — ${t("nodesAndCallbacks")}`}>
        <PropsTable props={nodeProps} />
      </DocSection>
      <DocSection title={`${t("api")} — MemberTree / FileTree`}>
        <PropsTable props={scenarioProps} />
      </DocSection>
    </DocPage>
  );
}
