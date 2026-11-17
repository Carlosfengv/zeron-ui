import { useIcons, type IconName } from "@zeron/icons/context";
import { createHugeIcon } from "@zeron/icons/huge-icon";
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
import Menu01Icon from "@hugeicons/core-free-icons/Menu01Icon";
import ExpandParagraphIcon from "@hugeicons/core-free-icons/ExpandParagraphIcon";
import BadgeIcon from "@hugeicons/core-free-icons/BadgeIcon";
import MoreHorizontalCircle01Icon from "@hugeicons/core-free-icons/MoreHorizontalCircle01Icon";
import Route01Icon from "@hugeicons/core-free-icons/Route01Icon";
import MouseLeftClick01Icon from "@hugeicons/core-free-icons/MouseLeftClick01Icon";
import Cards01Icon from "@hugeicons/core-free-icons/Cards01Icon";
import CheckmarkSquare02Icon from "@hugeicons/core-free-icons/CheckmarkSquare02Icon";
import Task01Icon from "@hugeicons/core-free-icons/Task01Icon";
import ColorPickerIcon from "@hugeicons/core-free-icons/ColorPickerIcon";
import GridTableIcon from "@hugeicons/core-free-icons/GridTableIcon";
import LayoutTable02Icon from "@hugeicons/core-free-icons/LayoutTable02Icon";
import PanelTopBottomDashedIcon from "@hugeicons/core-free-icons/PanelTopBottomDashedIcon";
import DropdownFieldTypeIcon from "@hugeicons/core-free-icons/DropdownFieldTypeIcon";
import InputTextIcon from "@hugeicons/core-free-icons/InputTextIcon";
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon";
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
import Notification01Icon from "@hugeicons/core-free-icons/Notification01Icon";
import UserQuestion01Icon from "@hugeicons/core-free-icons/UserQuestion01Icon";
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon";
import MessageEdit01Icon from "@hugeicons/core-free-icons/MessageEdit01Icon";
import AiBrain03Icon from "@hugeicons/core-free-icons/AiBrain03Icon";
import LeftToRightListNumberIcon from "@hugeicons/core-free-icons/LeftToRightListNumberIcon";

const docIcons = {
  "doc-showcase": createHugeIcon(DashboardSquare01Icon),
  "doc-introduction": createHugeIcon(BookOpen01Icon),
  "doc-surfaces": createHugeIcon(Layers01Icon),
  "doc-semantic-tokens": createHugeIcon(TokenSquareIcon),
  "doc-scrollbars": createHugeIcon(ScrollVerticalIcon),
  "doc-motion": createHugeIcon(Motion01Icon),
  "doc-app-shell": createHugeIcon(BrowserIcon),
  "doc-page-layout": createHugeIcon(LayoutThreeColumnIcon),
  "doc-sidebar": createHugeIcon(SidebarLeftIcon),
  "doc-top-nav": createHugeIcon(SidebarTopIcon),
  "doc-nav-menu": createHugeIcon(Menu01Icon),
  "doc-accordion": createHugeIcon(ExpandParagraphIcon),
  "doc-badge": createHugeIcon(BadgeIcon),
  "doc-badge-overflow": createHugeIcon(MoreHorizontalCircle01Icon),
  "doc-breadcrumb": createHugeIcon(Route01Icon),
  "doc-button": createHugeIcon(MouseLeftClick01Icon),
  "doc-card": createHugeIcon(Cards01Icon),
  "doc-checkbox": createHugeIcon(CheckmarkSquare02Icon),
  "doc-checkbox-group": createHugeIcon(Task01Icon),
  "doc-color-picker": createHugeIcon(ColorPickerIcon),
  "doc-data-grid": createHugeIcon(GridTableIcon),
  "doc-data-table": createHugeIcon(LayoutTable02Icon),
  "doc-dialog": createHugeIcon(PanelTopBottomDashedIcon),
  "doc-dropdown": createHugeIcon(DropdownFieldTypeIcon),
  "doc-input": createHugeIcon(InputTextIcon),
  "doc-input-copy": createHugeIcon(Copy01Icon),
  "doc-input-group": createHugeIcon(InputLongTextIcon),
  "doc-info-item": createHugeIcon(InformationCircleIcon),
  "doc-kbd": createHugeIcon(KeyboardIcon),
  "doc-popover": createHugeIcon(CursorInWindowIcon),
  "doc-radio-group": createHugeIcon(RadioButtonIcon),
  "doc-select": createHugeIcon(Select01Icon),
  "doc-separator": createHugeIcon(PanelTopBottomDashedIcon),
  "doc-slider": createHugeIcon(SlidersHorizontalIcon),
  "doc-stepper": createHugeIcon(WorkflowCircle01Icon),
  "doc-switch": createHugeIcon(ToggleOnIcon),
  "doc-table": createHugeIcon(Table01Icon),
  "doc-tabs": createHugeIcon(ViewAgendaIcon),
  "doc-tooltip": createHugeIcon(BubbleChatPreviewIcon),
  "doc-toast": createHugeIcon(Notification01Icon),
  "doc-ask-user-questions": createHugeIcon(UserQuestion01Icon),
  "doc-chat-message": createHugeIcon(BubbleChatIcon),
  "doc-input-message": createHugeIcon(MessageEdit01Icon),
  "doc-thinking-indicator": createHugeIcon(AiBrain03Icon),
  "doc-thinking-steps": createHugeIcon(LeftToRightListNumberIcon),
};

export type DocIconName = keyof typeof docIcons;

function isDocIconName(name: DocIconName | IconName): name is DocIconName {
  return Object.hasOwn(docIcons, name);
}

export function useDocIcon(name: DocIconName | IconName) {
  const icons = useIcons();
  return isDocIconName(name) ? docIcons[name] : icons[name];
}
