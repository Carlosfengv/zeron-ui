"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@zeron/ui/avatar";
import { Button } from "@zeron/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@zeron/ui/command";
import { Container, ContainerBody, ContainerFooter } from "@zeron/ui/container";
import { Kbd, KbdGroup } from "@zeron/ui/kbd";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@zeron/ui/popover";
import { Switch } from "@zeron/ui/switch";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { modelSelectorEnLabels } from "./model-selector-labels";
import type { ModelSelectorProps, ModelSelectorRating } from "./model-selector-types";

function Rating({ label, value, selected }: { label: string; value: ModelSelectorRating; selected: boolean }) {
  return (
    <span aria-hidden="true" className="flex min-w-0 flex-col items-center gap-1">
      <span className="text-label text-fg-subtle @min-[21rem]:hidden">{label}</span>
      <span className="flex items-center justify-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={cn("size-1.5 shrink-0 rounded-xs", index >= value ? "bg-border-subtle" : selected ? "bg-fg-default" : "bg-fg-subtle/40")}
          />
        ))}
      </span>
    </span>
  );
}

function Setting({ icon: Icon, id, label, checked, disabled, onCheckedChange }: {
  icon: IconComponent;
  id: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      id={id}
      label={<span className="flex min-w-0 items-center gap-3"><Icon aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" /><span>{label}</span></span>}
      className="w-full flex-row-reverse justify-between px-2 py-2.5"
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
    />
  );
}

export function ModelSelector({
  models,
  value,
  onValueChange,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  labels,
  locale = "en",
  currency = "USD",
  side = "bottom",
  align = "start",
  className,
}: ModelSelectorProps) {
  const copy = { ...modelSelectorEnLabels, ...labels };
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = (controlledOpen ?? internalOpen) && !disabled;
  const selected = models.find((model) => model.id === value.modelId);
  const initialHighlight = selected && !selected.disabled
    ? selected.id
    : models.find((model) => !model.disabled)?.id ?? "";
  const [navigation, setNavigation] = useState({ selectedId: value.modelId, open, activeId: initialHighlight });

  // Reset the keyboard draft on host changes and reopening, preserving input focus.
  if (navigation.selectedId !== value.modelId || navigation.open !== open) {
    setNavigation({ selectedId: value.modelId, open, activeId: initialHighlight });
  }
  const activeId = models.some((model) => model.id === navigation.activeId && !model.disabled)
    ? navigation.activeId
    : initialHighlight;
  const ChevronIcon = useIcon(open ? "chevron-up" : "chevron-down");
  const CheckIcon = useIcon("check");
  const ThinkingIcon = useIcon("lightbulb");
  const GlobeIcon = useIcon("globe");

  function changeOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  const { number, money } = useMemo(() => ({
    number: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    money: new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }),
  }), [locale, currency]);
  const latency = selected?.firstTokenSeconds;
  const cost = selected?.costPerMillionTokens;

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger render={<Button type="button" variant="secondary" size="lg" contentSized active={open} disabled={disabled} className={className} />}>
        <span className="flex min-w-0 items-center gap-2">
          {selected && <Avatar size="sm" shape="rounded" aria-hidden="true"><AvatarFallback>{selected.icon}</AvatarFallback></Avatar>}
          <span className="max-w-[min(13rem,40vw)] truncate">{selected?.name ?? copy.chooseModel}</span>
          <ChevronIcon aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />
        </span>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={8}
        initialFocus={inputRef}
        className="w-[min(22.5rem,calc(100vw-2rem))] min-w-0 max-w-none overflow-visible p-0"
        surfaceShadow="overlay"
        surfaceClassName="rounded-3xl"
      >
        <PopoverTitle className="sr-only">{copy.chooseModel}</PopoverTitle>
        <Container className="@container max-h-[var(--available-height)]">
          <ContainerBody className="overscroll-contain p-2">
            <div className="flex items-center gap-3 px-3 pb-1 pt-2 text-label text-fg-subtle" aria-hidden="true">
              <span className="min-w-0 flex-1">{copy.model}</span>
              <div className="hidden w-32 shrink-0 grid-cols-3 gap-2 text-center @min-[21rem]:grid">
                <span>{copy.speed}</span><span>{copy.quality}</span><span>{copy.cost}</span>
              </div>
            </div>
            <Command
              className="h-auto"
              label={copy.chooseModel}
              value={activeId}
              onValueChange={(activeId) => setNavigation({ selectedId: value.modelId, open, activeId })}
              shouldFilter={false}
              loop
              vimBindings={false}
            >
              <CommandInput asChild className="sr-only" ref={inputRef} readOnly aria-label={copy.chooseModel}><input /></CommandInput>
              <CommandList className="max-h-80" label={copy.model}>
                <CommandEmpty>{copy.empty}</CommandEmpty>
                {models.map((model, index) => {
                  const isSelected = model.id === value.modelId;
                  const descriptionId = `${id}-description-${index}`;
                  const ratingsId = `${id}-ratings-${index}`;
                  return (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      disabled={model.disabled}
                      aria-label={model.name}
                      aria-describedby={`${descriptionId} ${ratingsId}`}
                      aria-current={isSelected ? "true" : undefined}
                      className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 px-3 py-1.5 @min-[21rem]:flex"
                      onSelect={() => {
                        if (!isSelected) onValueChange({ ...value, modelId: model.id });
                        changeOpen(false);
                      }}
                    >
                      <Avatar size="sm" shape="rounded" aria-hidden="true"><AvatarFallback>{model.icon}</AvatarFallback></Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-body font-medium text-fg-default">
                          <span className="truncate" title={model.name}>{model.name}</span>
                          {isSelected && <CheckIcon aria-hidden="true" className="size-4 shrink-0" />}
                        </span>
                        <span id={descriptionId} className="mt-0.5 block break-words text-label text-fg-subtle">{model.description}</span>
                      </span>
                      <span id={ratingsId} className="sr-only">
                        {model.ratings
                          ? `${copy.speed}: ${model.ratings.speed}/5, ${copy.quality}: ${model.ratings.quality}/5, ${copy.cost}: ${model.ratings.cost}/5`
                          : copy.varies}
                      </span>
                      {model.ratings ? (
                        <span className="col-start-2 grid w-32 shrink-0 grid-cols-3 gap-2">
                          <Rating label={copy.speed} value={model.ratings.speed} selected={isSelected} />
                          <Rating label={copy.quality} value={model.ratings.quality} selected={isSelected} />
                          <Rating label={copy.cost} value={model.ratings.cost} selected={isSelected} />
                        </span>
                      ) : <span aria-hidden="true" className="col-start-2 w-32 shrink-0 text-label text-fg-subtle @min-[21rem]:text-center">{copy.varies}</span>}
                    </CommandItem>
                  );
                })}
              </CommandList>
            </Command>
            <div className="mx-1 my-1 border-t-hairline border-border" />
            <Setting icon={ThinkingIcon} id={`${id}-thinking`} label={copy.extendedThinking} checked={value.extendedThinking} disabled={disabled} onCheckedChange={(checked) => onValueChange({ ...value, extendedThinking: checked })} />
            <Setting icon={GlobeIcon} id={`${id}-search`} label={copy.webSearch} checked={value.webSearch} disabled={disabled} onCheckedChange={(checked) => onValueChange({ ...value, webSearch: checked })} />
          </ContainerBody>
          <ContainerFooter className="justify-between gap-2 px-2 py-1">
            <p className="flex min-w-0 flex-wrap gap-x-1 text-label text-fg-subtle" aria-live="polite">
              <span><span className="font-medium text-fg-default">{latency !== undefined && Number.isFinite(latency) && latency >= 0 ? `~${number.format(latency)}s` : copy.varies}</span> {copy.firstToken}</span>
              <span aria-hidden="true">·</span>
              <span><span className="font-medium text-fg-default">{cost !== undefined && Number.isFinite(cost) && cost >= 0 ? money.format(cost) : copy.varies}</span> {copy.perMillionTokens}</span>
            </p>
            <KbdGroup>
              <Kbd aria-label={copy.navigate}>↑↓</Kbd>
              <Kbd aria-label={copy.select}>↵</Kbd>
            </KbdGroup>
          </ContainerFooter>
        </Container>
      </PopoverContent>
    </Popover>
  );
}
