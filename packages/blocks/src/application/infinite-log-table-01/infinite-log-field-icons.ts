import {
  createIconSlot,
  type IconComponent,
} from "@zeron/ui/system/icon-context";

type InfiniteLogFieldIconId =
  | "query"
  | "timestamp"
  | "timeRange"
  | "outcome"
  | "status"
  | "method"
  | "host"
  | "pathname"
  | "region"
  | "latency"
  | "timing"
  | "timing.dns"
  | "timing.connection"
  | "timing.tls"
  | "timing.ttfb"
  | "timing.transfer"
  | "id";

const Search = createIconSlot("search");
const Calendar = createIconSlot("calendar");
const Outcome = createIconSlot("circle");
const Status = createIconSlot("hash");
const Method = createIconSlot("type");
const Host = createIconSlot("globe");
const Pathname = createIconSlot("link");
const Region = createIconSlot("pin");
const Duration = createIconSlot("clock");
const Timing = createIconSlot("list-checks");

export const infiniteLogFieldIcons = {
  query: Search,
  timestamp: Calendar,
  timeRange: Calendar,
  outcome: Outcome,
  status: Status,
  method: Method,
  host: Host,
  pathname: Pathname,
  region: Region,
  latency: Duration,
  timing: Timing,
  "timing.dns": Duration,
  "timing.connection": Duration,
  "timing.tls": Duration,
  "timing.ttfb": Duration,
  "timing.transfer": Duration,
  id: Status,
} satisfies Record<InfiniteLogFieldIconId, IconComponent>;
