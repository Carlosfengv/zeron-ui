"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import {
  DropdownContent,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
  useDropdown,
} from "#components/dropdown";
import { MenuItem } from "#components/menu-item";
import {
  SidebarIdentityAvatar,
  SidebarIdentityRow,
} from "#components/sidebar-identity-row";
import type { IconComponent } from "#system/icon-context";
import { useIcon } from "#system/icon-context";
import { Elevated } from "#system/elevated";
import { cn } from "#system/utils";

export interface SidebarAccountMenuItem {
  id: string;
  label: string;
  icon?: IconComponent;
  leading?: ReactNode;
  trailing?: ReactNode;
  onSelect?: () => void;
  closeOnClick?: boolean;
  submenu?: SidebarAccountMenuSubmenu;
}

export interface SidebarAccountMenuSubmenuOption {
  label: string;
  value: string;
}

export interface SidebarAccountMenuSubmenu {
  onValueChange: (value: string) => void;
  options: SidebarAccountMenuSubmenuOption[];
  value: string;
}

export interface SidebarAccountMenuSection {
  items: SidebarAccountMenuItem[];
}

export interface SidebarAccountMenuProps {
  avatar?: ReactNode;
  className?: string;
  description: ReactNode;
  menuClassName?: string;
  primary: ReactNode;
  sections: SidebarAccountMenuSection[];
  triggerTrailing?: ReactNode;
}

function SidebarAccountSubmenu({
  item,
  index,
}: {
  item: SidebarAccountMenuItem;
  index: number;
}) {
  const Check = useIcon("check");
  const triggerRef = useRef<HTMLDivElement>(null);
  const { registerItem } = useDropdown();
  const submenu = item.submenu;

  useEffect(() => {
    registerItem(index, triggerRef.current);
    return () => registerItem(index, null);
  }, [index, registerItem]);

  if (!submenu) return null;

  return (
    <Menu.SubmenuRoot>
      <Menu.SubmenuTrigger
        label={item.label}
        render={
          <div
            ref={triggerRef}
            data-proximity-index={index}
            className="relative z-content flex h-control-md shrink-0 items-center gap-2 rounded-lg px-2 outline-none transition-colors data-[highlighted]:bg-hover data-[highlighted]:text-fg-default focus-visible:ring-1 focus-visible:ring-focus-ring"
          />
        }
      >
        {item.leading ?? (item.icon && <item.icon aria-hidden size={16} strokeWidth={1.5} className="shrink-0 text-fg-muted" />)}
        <span className="flex-1 text-body text-fg-muted">{item.label}</span>
        {item.trailing}
      </Menu.SubmenuTrigger>
      <Menu.Portal>
        <Menu.Positioner side="right" align="start" sideOffset={6} className="z-popover outline-none">
          <Menu.Popup render={<Elevated surface="floating" shadow="floating" />} className="flex min-w-36 flex-col gap-0.5 rounded-xl p-1 outline-none">
            <Menu.RadioGroup value={submenu.value}>
              {submenu.options.map((option) => {
                const checked = option.value === submenu.value;
                return (
                  <Menu.RadioItem
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    closeOnClick
                    onClick={() => submenu.onValueChange(option.value)}
                    render={<div className={cn("flex h-control-md items-center gap-2 rounded-lg px-2 outline-none transition-colors data-[highlighted]:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring", checked ? "text-fg-default" : "text-fg-muted")} />}
                  >
                    <span className={cn("flex-1 text-body", checked && "font-semibold")}>{option.label}</span>
                    {checked && <Check aria-hidden className="size-4" strokeWidth={2} />}
                  </Menu.RadioItem>
                );
              })}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.SubmenuRoot>
  );
}

/** Account control for a sidebar footer with a grouped, upward-opening menu. */
export function SidebarAccountMenu({
  avatar,
  className,
  description,
  menuClassName,
  primary,
  sections,
  triggerTrailing,
}: SidebarAccountMenuProps) {
  const accountAvatar = avatar ?? <SidebarIdentityAvatar>{String(primary).slice(0, 2)}</SidebarIdentityAvatar>;
  let itemIndex = 0;

  return (
    <DropdownMenu>
      <DropdownTrigger
        render={
          <SidebarIdentityRow
            as="button"
            primary={primary}
            description={description}
            layout="two-line"
            trailingPlacement="edge"
            leading={accountAvatar}
            trailing={triggerTrailing}
            className={className}
          />
        }
      />
      <DropdownContent
        side="top"
        align="center"
        className={cn("!w-[264px] !min-w-[264px] !max-w-[264px]", menuClassName)}
      >
        <div className="px-1.5 py-1">
          <SidebarIdentityRow
            primary={primary}
            description={description}
            layout="two-line"
            leading={accountAvatar}
            className="min-h-0 px-0 py-1"
          />
        </div>
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="contents">
            {sectionIndex > 0 && <DropdownSeparator />}
            {section.items.map((item) => {
              const index = itemIndex++;
              if (item.submenu) {
                return <SidebarAccountSubmenu key={item.id} item={item} index={index} />;
              }
              return (
                <MenuItem
                  key={item.id}
                  index={index}
                  label={item.label}
                  icon={item.icon}
                  leading={item.leading}
                  trailing={item.trailing}
                  closeOnClick={item.closeOnClick}
                  onSelect={item.onSelect}
                />
              );
            })}
          </div>
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}

export default SidebarAccountMenu;
