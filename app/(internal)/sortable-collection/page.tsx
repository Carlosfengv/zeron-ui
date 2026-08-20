"use client";

import { useState } from "react";
import AnthropicMono from "@lobehub/icons/es/Anthropic/components/Mono";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import {
  SortableCollection,
  type SortableCollectionAddOption,
  type SortableCollectionItem,
} from "@zeron/ui/sortable-collection";

type ModelItem = SortableCollectionItem & {
  title: string;
  description?: string;
  context: string;
  modality: string;
  provider: string;
};

const ModelMark = ({ provider }: { provider: "anthropic" | "openai" }) => {
  const Logo = provider === "anthropic" ? AnthropicMono : OpenAIMono;
  return <Logo aria-hidden size={16} />;
};

const initialModels: ModelItem[] = [
  {
    id: "gpt-5-4",
    title: "GPT-5.4",
    description: "Default model for complex tasks",
    leadingIcon: <ModelMark provider="openai" />,
    context: "1M tokens",
    modality: "MM",
    provider: "OpenAI",
    meta: <><span className="rounded-md bg-emphasis px-1.5 py-0.5 text-label">1M tokens</span><span className="rounded-md bg-emphasis px-1.5 py-0.5 text-label">MM</span></>,
  },
  {
    id: "gpt-5-4-pro",
    title: "GPT-5.4 Pro",
    leadingIcon: <ModelMark provider="openai" />,
    context: "400K tokens",
    modality: "MM",
    provider: "OpenAI",
    meta: <><span className="rounded-md bg-emphasis px-1.5 py-0.5 text-label">400K tokens</span><span className="rounded-md bg-emphasis px-1.5 py-0.5 text-label">MM</span></>,
  },
  {
    id: "gpt-5-2",
    title: "GPT-5.2",
    leadingIcon: <ModelMark provider="openai" />,
    context: "400K tokens",
    modality: "MM",
    provider: "OpenAI",
    meta: <><span className="rounded-md bg-emphasis px-1.5 py-0.5 text-label">400K tokens</span><span className="rounded-md bg-emphasis px-1.5 py-0.5 text-label">MM</span></>,
  },
];

const modelOptions: SortableCollectionAddOption[] = [
  { id: "gpt-5", title: "GPT-5", group: "OpenAI", description: "General-purpose flagship", leadingIcon: <ModelMark provider="openai" />, meta: "400K tokens" },
  { id: "gpt-4-1", title: "GPT-4.1", group: "OpenAI", description: "Reliable production model", leadingIcon: <ModelMark provider="openai" />, meta: "1M tokens" },
  { id: "gpt-4-1-mini", title: "GPT-4.1 mini", group: "OpenAI", description: "Fast and economical", leadingIcon: <ModelMark provider="openai" />, meta: "1M tokens" },
  { id: "claude-opus-4", title: "Claude Opus 4", group: "Anthropic", description: "Deep reasoning", leadingIcon: <ModelMark provider="anthropic" />, meta: "200K tokens" },
  { id: "claude-sonnet-4", title: "Claude Sonnet 4", group: "Anthropic", description: "Balanced daily work", leadingIcon: <ModelMark provider="anthropic" />, meta: "200K tokens" },
];

export default function SortableCollectionDemo() {
  const [models, setModels] = useState(initialModels);

  return (
    <main className="min-h-screen bg-surface-base px-5 py-12 text-fg-default sm:px-8">
      <section className="mx-auto grid w-full max-w-3xl gap-8">
        <header className="max-w-xl">
          <p className="text-label font-medium text-fg-brand">Component preview</p>
          <h1 className="mt-2 text-heading font-semibold tracking-tight">Model priority</h1>
          <p className="mt-2 text-body text-fg-muted">Drag models to set their fallback order. Add a model from the catalog, or edit its display details in place.</p>
        </header>

        <SortableCollection<ModelItem>
          addLabel="Add Model"
          addOptions={modelOptions}
          className="max-w-[42rem]"
          emptyState="No models yet. Add the first model to build a fallback chain."
          items={models}
          onAdd={(option) => {
            const context = option.meta === "1M tokens" ? "1M tokens" : option.meta === "200K tokens" ? "200K tokens" : "400K tokens";
            setModels((current) => [...current, {
              id: option.id,
              title: option.title,
              description: option.description,
              leadingIcon: option.leadingIcon,
              context,
              modality: "MM",
              provider: option.group ?? "Custom",
              meta: <><span className="rounded-md bg-emphasis px-1.5 py-0.5 text-label">{context}</span><span className="rounded-md bg-emphasis px-1.5 py-0.5 text-label">MM</span></>,
            }]);
          }}
          onItemsChange={setModels}
        />
      </section>
    </main>
  );
}
