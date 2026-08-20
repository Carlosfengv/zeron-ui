"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon";
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import ArrowLeftDoubleIcon from "@hugeicons/core-free-icons/ArrowLeftDoubleIcon";
import ArrowMoveDownRightIcon from "@hugeicons/core-free-icons/ArrowMoveDownRightIcon";
import ArrowReloadHorizontalIcon from "@hugeicons/core-free-icons/ArrowReloadHorizontalIcon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import ArrowRightDoubleIcon from "@hugeicons/core-free-icons/ArrowRightDoubleIcon";
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon";
import ArrowUpDownIcon from "@hugeicons/core-free-icons/ArrowUpDownIcon";
import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon";
import BulbIcon from "@hugeicons/core-free-icons/BulbIcon";
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import CancelCircleIcon from "@hugeicons/core-free-icons/CancelCircleIcon";
import CircleIcon from "@hugeicons/core-free-icons/CircleIcon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import ComputerIcon from "@hugeicons/core-free-icons/ComputerIcon";
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon";
import DashboardCircleIcon from "@hugeicons/core-free-icons/DashboardCircleIcon";
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import DropperIcon from "@hugeicons/core-free-icons/DropperIcon";
import Eraser01Icon from "@hugeicons/core-free-icons/Eraser01Icon";
import FavouriteIcon from "@hugeicons/core-free-icons/FavouriteIcon";
import File01Icon from "@hugeicons/core-free-icons/File01Icon";
import File02Icon from "@hugeicons/core-free-icons/File02Icon";
import FileAudioIcon from "@hugeicons/core-free-icons/FileAudioIcon";
import FileImageIcon from "@hugeicons/core-free-icons/FileImageIcon";
import FileSpreadsheetIcon from "@hugeicons/core-free-icons/FileSpreadsheetIcon";
import FileVideoIcon from "@hugeicons/core-free-icons/FileVideoIcon";
import FileZipIcon from "@hugeicons/core-free-icons/FileZipIcon";
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon";
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon";
import HashtagIcon from "@hugeicons/core-free-icons/HashtagIcon";
import Home01Icon from "@hugeicons/core-free-icons/Home01Icon";
import Image01Icon from "@hugeicons/core-free-icons/Image01Icon";
import InboxIcon from "@hugeicons/core-free-icons/InboxIcon";
import LibraryIcon from "@hugeicons/core-free-icons/LibraryIcon";
import Link01Icon from "@hugeicons/core-free-icons/Link01Icon";
import Loading01Icon from "@hugeicons/core-free-icons/Loading01Icon";
import ListViewIcon from "@hugeicons/core-free-icons/ListViewIcon";
import LockIcon from "@hugeicons/core-free-icons/LockIcon";
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import Menu01Icon from "@hugeicons/core-free-icons/Menu01Icon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import Moon02Icon from "@hugeicons/core-free-icons/Moon02Icon";
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon";
import NextIcon from "@hugeicons/core-free-icons/NextIcon";
import Notification01Icon from "@hugeicons/core-free-icons/Notification01Icon";
import PaintBrush02Icon from "@hugeicons/core-free-icons/PaintBrush02Icon";
import PaintBrush01Icon from "@hugeicons/core-free-icons/PaintBrush01Icon";
import PauseIcon from "@hugeicons/core-free-icons/PauseIcon";
import PencilEdit01Icon from "@hugeicons/core-free-icons/PencilEdit01Icon";
import PinIcon from "@hugeicons/core-free-icons/PinIcon";
import PinOffIcon from "@hugeicons/core-free-icons/PinOffIcon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import PlusSignCircleIcon from "@hugeicons/core-free-icons/PlusSignCircleIcon";
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon";
import Presentation01Icon from "@hugeicons/core-free-icons/Presentation01Icon";
import Rocket01Icon from "@hugeicons/core-free-icons/Rocket01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import Scissor01Icon from "@hugeicons/core-free-icons/Scissor01Icon";
import Settings01Icon from "@hugeicons/core-free-icons/Settings01Icon";
import Shield01Icon from "@hugeicons/core-free-icons/Shield01Icon";
import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import Sun01Icon from "@hugeicons/core-free-icons/Sun01Icon";
import Task01Icon from "@hugeicons/core-free-icons/Task01Icon";
import TextAlignLeftIcon from "@hugeicons/core-free-icons/TextAlignLeftIcon";
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon";
import TickDouble01Icon from "@hugeicons/core-free-icons/TickDouble01Icon";
import TypeCursorIcon from "@hugeicons/core-free-icons/TypeCursorIcon";
import Upload01Icon from "@hugeicons/core-free-icons/Upload01Icon";
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import ViewOffIcon from "@hugeicons/core-free-icons/ViewOffIcon";
import { type HugeIconComponent } from "#system/huge-icon";
import { createIconMap } from "#system/icon-catalog";
import DashboardSquare01Icon from "@hugeicons/core-free-icons/DashboardSquare01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Layers01Icon from "@hugeicons/core-free-icons/Layers01Icon";
import TokenSquareIcon from "@hugeicons/core-free-icons/TokenSquareIcon";
import ScrollVerticalIcon from "@hugeicons/core-free-icons/ScrollVerticalIcon";
import Motion01Icon from "@hugeicons/core-free-icons/Motion01Icon";
import BrowserIcon from "@hugeicons/core-free-icons/BrowserIcon";
import LayoutThreeColumnIcon from "@hugeicons/core-free-icons/LayoutThreeColumnIcon";
import SidebarLeftIcon from "@hugeicons/core-free-icons/SidebarLeftIcon";
import SidebarTopIcon from "@hugeicons/core-free-icons/SidebarTopIcon";
import ExpandParagraphIcon from "@hugeicons/core-free-icons/ExpandParagraphIcon";
import BadgeIcon from "@hugeicons/core-free-icons/BadgeIcon";
import MoreHorizontalCircle01Icon from "@hugeicons/core-free-icons/MoreHorizontalCircle01Icon";
import Route01Icon from "@hugeicons/core-free-icons/Route01Icon";
import MouseLeftClick01Icon from "@hugeicons/core-free-icons/MouseLeftClick01Icon";
import Cards01Icon from "@hugeicons/core-free-icons/Cards01Icon";
import CheckmarkSquare02Icon from "@hugeicons/core-free-icons/CheckmarkSquare02Icon";
import ColorPickerIcon from "@hugeicons/core-free-icons/ColorPickerIcon";
import GridTableIcon from "@hugeicons/core-free-icons/GridTableIcon";
import LayoutTable02Icon from "@hugeicons/core-free-icons/LayoutTable02Icon";
import PanelTopBottomDashedIcon from "@hugeicons/core-free-icons/PanelTopBottomDashedIcon";
import DropdownFieldTypeIcon from "@hugeicons/core-free-icons/DropdownFieldTypeIcon";
import InputTextIcon from "@hugeicons/core-free-icons/InputTextIcon";
import InputLongTextIcon from "@hugeicons/core-free-icons/InputLongTextIcon";
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon";
import KeyboardIcon from "@hugeicons/core-free-icons/KeyboardIcon";
import CursorInWindowIcon from "@hugeicons/core-free-icons/CursorInWindowIcon";
import RadioButtonIcon from "@hugeicons/core-free-icons/RadioButtonIcon";
import Select01Icon from "@hugeicons/core-free-icons/Select01Icon";
import SlidersHorizontalIcon from "@hugeicons/core-free-icons/SlidersHorizontalIcon";
import WorkflowCircle01Icon from "@hugeicons/core-free-icons/WorkflowCircle01Icon";
import ToggleOnIcon from "@hugeicons/core-free-icons/ToggleOnIcon";
import Table01Icon from "@hugeicons/core-free-icons/Table01Icon";
import ViewAgendaIcon from "@hugeicons/core-free-icons/ViewAgendaIcon";
import BubbleChatPreviewIcon from "@hugeicons/core-free-icons/BubbleChatPreviewIcon";
import UserQuestion01Icon from "@hugeicons/core-free-icons/UserQuestion01Icon";
import MessageEdit01Icon from "@hugeicons/core-free-icons/MessageEdit01Icon";
import AiBrain03Icon from "@hugeicons/core-free-icons/AiBrain03Icon";
import LeftToRightListNumberIcon from "@hugeicons/core-free-icons/LeftToRightListNumberIcon";

export interface IconComponentProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  disableSecondaryOpacity?: boolean;
}

export type IconComponent = HugeIconComponent;

export type IconName =
  | "doc-showcase"
  | "doc-introduction"
  | "doc-surfaces"
  | "doc-semantic-tokens"
  | "doc-scrollbars"
  | "doc-motion"
  | "doc-app-shell"
  | "doc-page-layout"
  | "doc-sidebar"
  | "doc-top-nav"
  | "doc-nav-menu"
  | "doc-accordion"
  | "doc-badge"
  | "doc-badge-overflow"
  | "doc-breadcrumb"
  | "doc-button"
  | "doc-card"
  | "doc-checkbox"
  | "doc-checkbox-group"
  | "doc-color-picker"
  | "doc-data-grid"
  | "doc-data-table"
  | "doc-dialog"
  | "doc-dropdown"
  | "doc-input"
  | "doc-input-copy"
  | "doc-input-group"
  | "doc-info-item"
  | "doc-kbd"
  | "doc-popover"
  | "doc-radio-group"
  | "doc-select"
  | "doc-separator"
  | "doc-slider"
  | "doc-stepper"
  | "doc-switch"
  | "doc-table"
  | "doc-tabs"
  | "doc-tooltip"
  | "doc-toast"
  | "doc-ask-user-questions"
  | "doc-chat-message"
  | "doc-input-message"
  | "doc-thinking-indicator"
  | "doc-thinking-steps"
  | "chevron-left" | "chevron-right" | "chevron-down" | "chevron-up"
  | "chevrons-left" | "chevrons-right" | "chevrons-up-down"
  | "circle-plus" | "circle-x" | "eye-off" | "ellipsis"
  | "x" | "copy" | "menu" | "dot"
  | "monitor" | "sun" | "moon" | "rectangle-horizontal" | "circle"
  | "square-library" | "clock" | "star" | "settings"
  | "plus" | "arrow-left" | "arrow-right" | "arrow-up" | "search" | "loader"
  | "users" | "lock" | "mail" | "bell" | "shield" | "palette"
  | "lightbulb" | "rocket" | "heart" | "paintbrush" | "brain"
  | "globe" | "user" | "image" | "link" | "check" | "rotate-ccw"
  | "play" | "pause" | "pipette" | "home" | "message-circle" | "inbox"
  | "pencil" | "skip-forward" | "corner-down-right"
  | "calendar" | "check-square" | "trash" | "eraser" | "scissors" | "upload"
  | "pin" | "pin-off" | "file" | "file-archive" | "file-audio" | "file-image"
  | "file-spreadsheet" | "file-text" | "file-video" | "hash" | "list-checks" | "list"
  | "presentation" | "type" | "baseline" | "folder" | "mic";

export type IconVariant =
  | "stroke-rounded"
  | "stroke-standard"
  | "bulk-rounded"
  | "duotone-rounded";

const iconVariantStorageKey = "zeron-design.icon-variant";
const iconVariantOrder: IconVariant[] = [
  "stroke-rounded",
  "stroke-standard",
  "bulk-rounded",
  "duotone-rounded",
];
const freeIconVariants: IconVariant[] = ["stroke-rounded"];

export const defaultIcons = createIconMap({
  DashboardSquare01Icon,
  BookOpen01Icon,
  Layers01Icon,
  TokenSquareIcon,
  ScrollVerticalIcon,
  Motion01Icon,
  BrowserIcon,
  LayoutThreeColumnIcon,
  SidebarLeftIcon,
  SidebarTopIcon,
  ExpandParagraphIcon,
  BadgeIcon,
  MoreHorizontalCircle01Icon,
  Route01Icon,
  MouseLeftClick01Icon,
  Cards01Icon,
  CheckmarkSquare02Icon,
  ColorPickerIcon,
  GridTableIcon,
  LayoutTable02Icon,
  PanelTopBottomDashedIcon,
  DropdownFieldTypeIcon,
  InputTextIcon,
  InputLongTextIcon,
  InformationCircleIcon,
  KeyboardIcon,
  CursorInWindowIcon,
  RadioButtonIcon,
  Select01Icon,
  SlidersHorizontalIcon,
  WorkflowCircle01Icon,
  ToggleOnIcon,
  Table01Icon,
  ViewAgendaIcon,
  BubbleChatPreviewIcon,
  UserQuestion01Icon,
  MessageEdit01Icon,
  AiBrain03Icon,
  LeftToRightListNumberIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowMoveDownRightIcon,
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  BrainIcon,
  BubbleChatIcon,
  BulbIcon,
  Calendar03Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CircleIcon,
  Clock01Icon,
  ComputerIcon,
  Copy01Icon,
  DashboardCircleIcon,
  Delete02Icon,
  DropperIcon,
  Eraser01Icon,
  FavouriteIcon,
  File01Icon,
  File02Icon,
  FileAudioIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileVideoIcon,
  FileZipIcon,
  Folder01Icon,
  GlobeIcon,
  HashtagIcon,
  Home01Icon,
  Image01Icon,
  InboxIcon,
  LibraryIcon,
  Link01Icon,
  Loading01Icon,
  ListViewIcon,
  LockIcon,
  Mail01Icon,
  Menu01Icon,
  Mic01Icon,
  Moon02Icon,
  MoreHorizontalIcon,
  NextIcon,
  Notification01Icon,
  PaintBrush01Icon,
  PaintBrush02Icon,
  PauseIcon,
  PencilEdit01Icon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  PlusSignCircleIcon,
  PlusSignIcon,
  Presentation01Icon,
  Rocket01Icon,
  Search01Icon,
  Scissor01Icon,
  Settings01Icon,
  Shield01Icon,
  StarIcon,
  Sun01Icon,
  Task01Icon,
  TextAlignLeftIcon,
  Tick02Icon,
  TickDouble01Icon,
  TypeCursorIcon,
  Upload01Icon,
  UserGroupIcon,
  UserIcon,
  ViewOffIcon,
});

function isIconVariant(value: string | null): value is IconVariant {
  return iconVariantOrder.includes(value as IconVariant);
}

export type IconVariantLoader = (
  variant: Exclude<IconVariant, "stroke-rounded">
) => Promise<Record<IconName, IconComponent>>;

interface IconContextValue {
  icons: Record<IconName, IconComponent>;
  variant: IconVariant;
  availableVariants: readonly IconVariant[];
  isVariantLoading: boolean;
  setVariant: (variant: IconVariant) => void;
  cycleVariant: () => void;
}

const IconContext = createContext<IconContextValue | null>(null);

function useIcon(name: IconName): IconComponent {
  return (useContext(IconContext)?.icons ?? defaultIcons)[name];
}

function useIcons(): Record<IconName, IconComponent> {
  return useContext(IconContext)?.icons ?? defaultIcons;
}

/**
 * Creates a component backed by a named slot for code that needs to keep an
 * icon component at module scope (for example, DataGrid column definitions).
 */
function createIconSlot(name: IconName): IconComponent {
  function IconSlot(props: IconComponentProps) {
    const Icon = useIcon(name);
    return <Icon {...props} />;
  }

  IconSlot.displayName = `IconSlot(${name})`;
  return IconSlot;
}

function useIconContext(): IconContextValue {
  const context = useContext(IconContext);
  if (!context) throw new Error("useIconContext must be used within an IconProvider");
  return context;
}

/**
 * Supplies named HugeIcons and loads Pro variants only after the user selects
 * one. Explicit `icons` overrides remain stable across every icon style.
 */
function IconProvider({
  children,
  icons: overrides,
  loadVariant,
  availableVariants = freeIconVariants,
}: {
  children: ReactNode;
  icons?: Partial<Record<IconName, IconComponent>>;
  loadVariant?: IconVariantLoader;
  availableVariants?: readonly IconVariant[];
}) {
  const [baseIcons, setBaseIcons] = useState(defaultIcons);
  const [variant, setVariantState] = useState<IconVariant>("stroke-rounded");
  const [isVariantLoading, setIsVariantLoading] = useState(false);
  const requestRef = useRef(0);
  const hasRestoredPreference = useRef(false);

  const setVariant = useCallback((nextVariant: IconVariant) => {
    const request = ++requestRef.current;

    if (nextVariant === variant) return;

    if (nextVariant === "stroke-rounded") {
      setBaseIcons(defaultIcons);
      setVariantState(nextVariant);
      setIsVariantLoading(false);
      try {
        window.localStorage.setItem(iconVariantStorageKey, nextVariant);
      } catch {
        // Storage is optional; the selected style remains available this session.
      }
      return;
    }

    if (!loadVariant || !availableVariants.includes(nextVariant)) {
      console.error(`HugeIcons ${nextVariant} is not configured for this IconProvider.`);
      return;
    }

    setIsVariantLoading(true);
    void loadVariant(nextVariant)
      .then((nextIcons) => {
        if (request !== requestRef.current) return;
        setBaseIcons(nextIcons);
        setVariantState(nextVariant);
        try {
          window.localStorage.setItem(iconVariantStorageKey, nextVariant);
        } catch {
          // Storage is optional; the selected style remains available this session.
        }
      })
      .catch((error: unknown) => {
        if (request !== requestRef.current) return;
        console.error(`Unable to load HugeIcons ${nextVariant} variant.`, error);
      })
      .finally(() => {
        if (request === requestRef.current) setIsVariantLoading(false);
      });
  }, [availableVariants, loadVariant, variant]);

  useEffect(() => {
    if (hasRestoredPreference.current) return;
    hasRestoredPreference.current = true;
    try {
      const savedVariant = window.localStorage.getItem(iconVariantStorageKey);
      if (isIconVariant(savedVariant) && availableVariants.includes(savedVariant)) {
        setVariant(savedVariant);
      } else if (savedVariant) {
        // A preference selected through ProIconProvider can outlive that
        // provider (for example, when a project returns to the free setup).
        // Discard it rather than attempting an unavailable dynamic import.
        window.localStorage.removeItem(iconVariantStorageKey);
      }
    } catch {
      // A restricted browser can still use the default style and switch manually.
    }
  }, [availableVariants, setVariant]);

  const cycleVariant = useCallback(() => {
    const enabledVariants = iconVariantOrder.filter((candidate) => availableVariants.includes(candidate));
    const nextIndex = (enabledVariants.indexOf(variant) + 1) % enabledVariants.length;
    setVariant(enabledVariants[nextIndex]);
  }, [availableVariants, setVariant, variant]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "i" && event.key !== "I") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      event.preventDefault();
      cycleVariant();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [cycleVariant]);

  const value = useMemo<IconContextValue>(() => ({
    icons: { ...baseIcons, ...overrides },
    variant,
    availableVariants,
    isVariantLoading,
    setVariant,
    cycleVariant,
  }), [availableVariants, baseIcons, cycleVariant, isVariantLoading, overrides, setVariant, variant]);

  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
}

export { createIconSlot, IconProvider, useIcon, useIconContext, useIcons };
