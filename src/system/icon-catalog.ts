import { createHugeIcon, type CreateHugeIconOptions } from "@/lib/huge-icon";
import type { IconComponent, IconName } from "@/lib/icon-context";

/**
 * The underlying HugeIcons definitions shared by every supported style.
 * Keeping this list central guarantees that a style change never changes the
 * public `useIcon()` slot API.
 */
export interface IconDefinitions {
  ArrowDown01Icon: unknown;
  ArrowLeft01Icon: unknown;
  ArrowLeftDoubleIcon: unknown;
  ArrowMoveDownRightIcon: unknown;
  ArrowReloadHorizontalIcon: unknown;
  ArrowRight01Icon: unknown;
  ArrowRightDoubleIcon: unknown;
  ArrowUp01Icon: unknown;
  ArrowUpDownIcon: unknown;
  BrainIcon: unknown;
  BubbleChatIcon: unknown;
  BulbIcon: unknown;
  Calendar03Icon: unknown;
  Cancel01Icon: unknown;
  CancelCircleIcon: unknown;
  CircleIcon: unknown;
  Clock01Icon: unknown;
  ComputerIcon: unknown;
  Copy01Icon: unknown;
  DashboardCircleIcon: unknown;
  Delete02Icon: unknown;
  DropperIcon: unknown;
  Eraser01Icon: unknown;
  FavouriteIcon: unknown;
  File01Icon: unknown;
  File02Icon: unknown;
  FileAudioIcon: unknown;
  FileImageIcon: unknown;
  FileSpreadsheetIcon: unknown;
  FileVideoIcon: unknown;
  FileZipIcon: unknown;
  GlobeIcon: unknown;
  HashtagIcon: unknown;
  Home01Icon: unknown;
  Image01Icon: unknown;
  InboxIcon: unknown;
  LibraryIcon: unknown;
  Link01Icon: unknown;
  Loading01Icon: unknown;
  ListViewIcon: unknown;
  LockIcon: unknown;
  Mail01Icon: unknown;
  Menu01Icon: unknown;
  Moon02Icon: unknown;
  MoreHorizontalIcon: unknown;
  NextIcon: unknown;
  Notification01Icon: unknown;
  PaintBrush01Icon: unknown;
  PaintBrush02Icon: unknown;
  PauseIcon: unknown;
  PencilEdit01Icon: unknown;
  PinIcon: unknown;
  PinOffIcon: unknown;
  PlayIcon: unknown;
  PlusSignCircleIcon: unknown;
  PlusSignIcon: unknown;
  Presentation01Icon: unknown;
  Rocket01Icon: unknown;
  Search01Icon: unknown;
  Scissor01Icon: unknown;
  Settings01Icon: unknown;
  Shield01Icon: unknown;
  StarIcon: unknown;
  Sun01Icon: unknown;
  Task01Icon: unknown;
  TextAlignLeftIcon: unknown;
  Tick02Icon: unknown;
  TickDouble01Icon: unknown;
  TypeCursorIcon: unknown;
  Upload01Icon: unknown;
  UserGroupIcon: unknown;
  UserIcon: unknown;
  ViewOffIcon: unknown;
}

/** Build the stable UI slot map from one HugeIcons style package. */
export function createIconMap(
  icons: IconDefinitions,
  options?: CreateHugeIconOptions
): Record<IconName, IconComponent> {
  return {
    "chevron-left": createHugeIcon(icons.ArrowLeft01Icon, options),
    "chevron-right": createHugeIcon(icons.ArrowRight01Icon, options),
    "chevron-down": createHugeIcon(icons.ArrowDown01Icon, options),
    "chevron-up": createHugeIcon(icons.ArrowUp01Icon, options),
    "chevrons-left": createHugeIcon(icons.ArrowLeftDoubleIcon, options),
    "chevrons-right": createHugeIcon(icons.ArrowRightDoubleIcon, options),
    "chevrons-up-down": createHugeIcon(icons.ArrowUpDownIcon, options),
    "circle-plus": createHugeIcon(icons.PlusSignCircleIcon, options),
    "circle-x": createHugeIcon(icons.CancelCircleIcon, options),
    "eye-off": createHugeIcon(icons.ViewOffIcon, options),
    ellipsis: createHugeIcon(icons.MoreHorizontalIcon, options),
    pipette: createHugeIcon(icons.DropperIcon, options),
    x: createHugeIcon(icons.Cancel01Icon, options),
    copy: createHugeIcon(icons.Copy01Icon, options),
    menu: createHugeIcon(icons.Menu01Icon, options),
    dot: createHugeIcon(icons.CircleIcon, options),
    monitor: createHugeIcon(icons.ComputerIcon, options),
    sun: createHugeIcon(icons.Sun01Icon, options),
    moon: createHugeIcon(icons.Moon02Icon, options),
    "rectangle-horizontal": createHugeIcon(icons.DashboardCircleIcon, options),
    circle: createHugeIcon(icons.CircleIcon, options),
    "square-library": createHugeIcon(icons.LibraryIcon, options),
    clock: createHugeIcon(icons.Clock01Icon, options),
    star: createHugeIcon(icons.StarIcon, options),
    settings: createHugeIcon(icons.Settings01Icon, options),
    plus: createHugeIcon(icons.PlusSignIcon, options),
    "arrow-left": createHugeIcon(icons.ArrowLeft01Icon, options),
    "arrow-right": createHugeIcon(icons.ArrowRight01Icon, options),
    "arrow-up": createHugeIcon(icons.ArrowUp01Icon, options),
    search: createHugeIcon(icons.Search01Icon, options),
    loader: createHugeIcon(icons.Loading01Icon, options),
    users: createHugeIcon(icons.UserGroupIcon, options),
    lock: createHugeIcon(icons.LockIcon, options),
    mail: createHugeIcon(icons.Mail01Icon, options),
    bell: createHugeIcon(icons.Notification01Icon, options),
    shield: createHugeIcon(icons.Shield01Icon, options),
    palette: createHugeIcon(icons.PaintBrush01Icon, options),
    lightbulb: createHugeIcon(icons.BulbIcon, options),
    rocket: createHugeIcon(icons.Rocket01Icon, options),
    heart: createHugeIcon(icons.FavouriteIcon, options),
    paintbrush: createHugeIcon(icons.PaintBrush02Icon, options),
    brain: createHugeIcon(icons.BrainIcon, options),
    globe: createHugeIcon(icons.GlobeIcon, options),
    user: createHugeIcon(icons.UserIcon, options),
    image: createHugeIcon(icons.Image01Icon, options),
    link: createHugeIcon(icons.Link01Icon, options),
    check: createHugeIcon(icons.Tick02Icon, options),
    "rotate-ccw": createHugeIcon(icons.ArrowReloadHorizontalIcon, options),
    play: createHugeIcon(icons.PlayIcon, options),
    pause: createHugeIcon(icons.PauseIcon, options),
    home: createHugeIcon(icons.Home01Icon, options),
    "message-circle": createHugeIcon(icons.BubbleChatIcon, options),
    inbox: createHugeIcon(icons.InboxIcon, options),
    pencil: createHugeIcon(icons.PencilEdit01Icon, options),
    "skip-forward": createHugeIcon(icons.NextIcon, options),
    "corner-down-right": createHugeIcon(icons.ArrowMoveDownRightIcon, options),
    calendar: createHugeIcon(icons.Calendar03Icon, options),
    "check-square": createHugeIcon(icons.TickDouble01Icon, options),
    trash: createHugeIcon(icons.Delete02Icon, options),
    eraser: createHugeIcon(icons.Eraser01Icon, options),
    scissors: createHugeIcon(icons.Scissor01Icon, options),
    upload: createHugeIcon(icons.Upload01Icon, options),
    pin: createHugeIcon(icons.PinIcon, options),
    "pin-off": createHugeIcon(icons.PinOffIcon, options),
    file: createHugeIcon(icons.File01Icon, options),
    "file-archive": createHugeIcon(icons.FileZipIcon, options),
    "file-audio": createHugeIcon(icons.FileAudioIcon, options),
    "file-image": createHugeIcon(icons.FileImageIcon, options),
    "file-spreadsheet": createHugeIcon(icons.FileSpreadsheetIcon, options),
    "file-text": createHugeIcon(icons.File02Icon, options),
    "file-video": createHugeIcon(icons.FileVideoIcon, options),
    hash: createHugeIcon(icons.HashtagIcon, options),
    "list-checks": createHugeIcon(icons.Task01Icon, options),
    list: createHugeIcon(icons.ListViewIcon, options),
    presentation: createHugeIcon(icons.Presentation01Icon, options),
    type: createHugeIcon(icons.TypeCursorIcon, options),
    baseline: createHugeIcon(icons.TextAlignLeftIcon, options),
  };
}
