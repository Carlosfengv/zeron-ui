"use client";

import { useState } from "react";
import AnthropicMono from "@lobehub/icons/es/Anthropic/components/Mono";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import { Button } from "@zeron/ui/button";
import { Input } from "@zeron/ui/input";
import {
  SortableCollection,
  type SortableCollectionAddOption,
  type SortableCollectionItem,
} from "@zeron/ui/sortable-collection";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

type ModelItem = SortableCollectionItem & {
  title: string;
  description?: string;
};

const ModelIcon = ({ provider }: { provider: "anthropic" | "openai" }) => {
  const Logo = provider === "anthropic" ? AnthropicMono : OpenAIMono;
  return <Logo aria-hidden size={16} />;
};

const modelMeta = (context: string) => (
  <>
    <span className="rounded-md bg-emphasis px-1.5 py-0.5 text-label">{context}</span>
    <span className="rounded-md bg-emphasis px-1.5 py-0.5 text-label">MM</span>
  </>
);

const initialModels: ModelItem[] = [
  { id: "gpt-5-4", title: "GPT-5.4", description: "Default model for complex tasks", leadingIcon: <ModelIcon provider="openai" />, meta: modelMeta("1M tokens") },
  { id: "gpt-5-4-pro", title: "GPT-5.4 Pro", description: "High reasoning budget", leadingIcon: <ModelIcon provider="openai" />, meta: modelMeta("400K tokens") },
  { id: "gpt-5-2", title: "GPT-5.2", description: "General-purpose flagship", leadingIcon: <ModelIcon provider="openai" />, meta: modelMeta("400K tokens") },
];

const addOptions: SortableCollectionAddOption[] = [
  { id: "gpt-4-1", title: "GPT-4.1", description: "Reliable production model", group: "OpenAI", leadingIcon: <ModelIcon provider="openai" />, meta: "1M tokens" },
  { id: "gpt-4-1-mini", title: "GPT-4.1 mini", description: "Fast and economical", group: "OpenAI", leadingIcon: <ModelIcon provider="openai" />, meta: "1M tokens" },
  { id: "claude-sonnet-4", title: "Claude Sonnet 4", description: "Balanced daily work", group: "Anthropic", leadingIcon: <ModelIcon provider="anthropic" />, meta: "200K tokens" },
];

const basicCode = `"use client";

import { useState } from "react";
import { SortableCollection } from "@zeron/ui/sortable-collection";

const [models, setModels] = useState([
  { id: "gpt-5-4", title: "GPT-5.4", description: "Default model" },
  { id: "gpt-5-4-pro", title: "GPT-5.4 Pro" },
]);

<SortableCollection
  items={models}
  onItemsChange={setModels}
  addLabel="Add model"
  addOptions={catalogOptions}
  onAdd={(option) => setModels((current) => [
    ...current,
    { id: option.id, title: option.title, description: option.description },
  ])}
/>`;

const editingCode = `<SortableCollection
  items={models}
  onItemsChange={setModels}
  showEditAction
  renderEditingContent={(item, { close }) => (
    <form onSubmit={(event) => {
      event.preventDefault();
      const title = new FormData(event.currentTarget).get("title");
      setModels((current) => current.map((entry) =>
        entry.id === item.id ? { ...entry, title: String(title) } : entry,
      ));
      close();
    }}>
      <Input name="title" defaultValue={String(item.title)} />
      <Button type="submit">Save</Button>
    </form>
  )}
/>`;

const collectionProps: PropDef[] = [
  { name: "items", type: "T[]", description: "Controlled collection. Array order is the persisted priority order." },
  { name: "onItemsChange", type: "(items: T[]) => void", description: "Called after a reorder or removal. Use it to update the controlled array when handling onAdd." },
  { name: "onReorder", type: "(items: T[]) => void", description: "Optional reorder-only callback, useful for persistence or analytics." },
  { name: "addOptions", type: "SortableCollectionAddOption[]", default: "[]", description: "Catalog entries displayed from the bottom add button." },
  { name: "addLabel", type: "string", default: '"Add item"', description: "Visible label for the bottom add button." },
  { name: "onAdd", type: "(option) => void", description: "Called after a selectable catalog option is chosen. The consumer adds the item to its controlled array." },
  { name: "allowDuplicates", type: "boolean", default: "false", description: "Allows catalog options whose id already exists in items." },
  { name: "maxItems", type: "number", description: "Disables adding once the controlled list reaches this length." },
  { name: "emptyState", type: "ReactNode", description: "Content shown when items is empty." },
  { name: "showEditAction", type: "boolean", default: "false", description: "Shows the optional edit action for items with renderEditingContent." },
  { name: "renderEditingContent", type: "(item, { close }) => ReactNode", description: "Renders inline editing content. Reordering is paused while an item is being edited." },
  { name: "renderActions", type: "(item, context) => ReactNode", description: "Adds product-specific trailing actions before the default remove button." },
];

const itemProps: PropDef[] = [
  { name: "id", type: "string", description: "Stable item identifier used for ordering and duplicate detection." },
  { name: "title", type: "ReactNode", description: "Primary inline label." },
  { name: "description", type: "ReactNode", description: "Optional supporting text, rendered on the same line as the title." },
  { name: "leadingIcon", type: "ReactNode", description: "Optional icon or compact leading media after the drag handle." },
  { name: "meta", type: "ReactNode", description: "Optional trailing metadata, such as badges or status." },
  { name: "draggable", type: "boolean", default: "true", description: "Disables reordering for this item when false." },
  { name: "removable", type: "boolean", default: "true", description: "Hides and disables the default remove action when false." },
  { name: "editable", type: "boolean", default: "true", description: "Disables the optional edit action for this item when false." },
];

function BasicExample() {
  const [models, setModels] = useState(initialModels);

  return (
    <SortableCollection<ModelItem>
      addLabel="Add model"
      addOptions={addOptions}
      className="w-full max-w-2xl"
      emptyState="No models yet. Add the first model to build a fallback chain."
      items={models}
      onAdd={(option) => setModels((current) => [
        ...current,
        {
          id: option.id,
          title: option.title,
          description: option.description,
          leadingIcon: option.leadingIcon,
          meta: modelMeta(typeof option.meta === "string" ? option.meta : "400K tokens"),
        },
      ])}
      onItemsChange={setModels}
    />
  );
}

function EditingExample() {
  const [models, setModels] = useState(initialModels.slice(0, 2));

  return (
    <SortableCollection<ModelItem>
      className="w-full max-w-2xl"
      items={models}
      onItemsChange={setModels}
      renderEditingContent={(item, { close }) => (
        <form
          className="flex min-w-0 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const title = new FormData(event.currentTarget).get("title");
            setModels((current) => current.map((entry) => entry.id === item.id
              ? { ...entry, title: String(title).trim() || entry.title }
              : entry));
            close();
          }}
        >
          <Input aria-label="Model name" defaultValue={item.title} name="title" size="sm" />
          <Button size="sm" type="submit">Save</Button>
          <Button onClick={close} size="sm" type="button" variant="tertiary">Cancel</Button>
        </form>
      )}
      showEditAction
    />
  );
}

export default function SortableCollectionDoc() {
  const t = useTranslations("sortableCollection");

  return (
    <DocPage
      title="SortableCollection"
      slug="sortable-collection"
      description="A controlled, reorderable list with optional inline editing, removal, and a catalog-based add action."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode} minHeightClass="min-h-[25rem]">
          <BasicExample />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("editing")}>
        <p className="max-w-2xl text-body leading-6 text-fg-muted">{t("editingBody")}</p>
        <ComponentPreview className="mt-3" code={editingCode} minHeightClass="min-h-[12rem]">
          <EditingExample />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("dragBehavior")}>
        <div className="max-w-2xl space-y-2 text-body leading-6 text-fg-muted">
          <p>{t("dragBehaviorBody")}</p>
          <p>{t("keyboardBody")}</p>
        </div>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-medium text-fg-default">SortableCollection</h3>
            <PropsTable props={collectionProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-medium text-fg-default">SortableCollectionItem</h3>
            <PropsTable props={itemProps} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
