"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@zeron/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@zeron/ui/avatar";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemTitle } from "@zeron/ui/info-item";
import { MenuItem } from "@zeron/ui/menu-item";
import { useIcon } from "@zeron/ui/system/icon-context";
import { formatCount, formatUpdated } from "./support-analytics-data";
import type { SupportAnalyticsLabels, SupportTicket } from "./support-analytics-types";

export function RecentTickets({ tickets, expanded, onExpandedChange, labels, locale, timeZone, contextLabel, pending, errors, onOpen, onResolve, now }: {
  tickets: readonly SupportTicket[]; expanded: boolean; onExpandedChange: (value: boolean) => void;
  labels: SupportAnalyticsLabels; locale: string; timeZone: string; contextLabel: string;
  pending: ReadonlySet<string>; errors: Record<string, string>;
  onOpen?: (ticket: SupportTicket) => void; onResolve?: (ticket: SupportTicket) => void; now?: number;
}) {
  const More = useIcon("ellipsis");
  return <Accordion type="single" collapsible value={expanded ? "recent" : ""} onValueChange={(value: string) => onExpandedChange(value === "recent")} className="w-full">
    <AccordionItem value="recent">
      <AccordionTrigger><span className="flex min-w-0 flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2">{labels.recent}<Badge size="sm">{formatCount(tickets.length, locale)}</Badge></span><span className="text-label font-normal text-fg-subtle">{contextLabel}</span></span></AccordionTrigger>
      <AccordionContent>
        {!tickets.length ? <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.noTickets}</EmptyDescription></Empty> : <div className="divide-y divide-border-subtle">{tickets.map((ticket) => <div key={ticket.id}>
          <InfoItem className="flex-wrap px-0">
            <Avatar size="sm">{ticket.avatarUrl && <AvatarImage src={ticket.avatarUrl} alt="" />}<AvatarFallback>{ticket.customer.split(/\s+/).map((word) => word[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
            <InfoItemContent><InfoItemTitle className="break-words">{ticket.customer}</InfoItemTitle><InfoItemDescription><span className="flex flex-wrap items-center gap-1"><Badge size="sm" status={ticket.status === "resolved" ? "success" : "warning"}>{labels[ticket.status]}</Badge><span>{labels[ticket.priority]} · {labels[ticket.channel]}</span></span></InfoItemDescription></InfoItemContent>
            <div className="min-w-0 text-right text-label text-fg-subtle"><p>{formatUpdated(ticket.createdAt, locale, timeZone, now)}</p><p>{ticket.number}</p></div>
            {(onOpen || (onResolve && ticket.status === "open" && ticket.canResolve !== false)) && <DropdownMenu><DropdownTrigger render={<Button iconOnly variant="ghost" size="sm" loading={pending.has(`resolve:${ticket.id}`) || pending.has(`open:${ticket.id}`)} aria-label={`${labels.more} · ${ticket.number}`}><More aria-hidden /></Button>} /><DropdownContent>
              {onOpen && <MenuItem index={0} label={labels.details} disabled={pending.has(`open:${ticket.id}`)} onClick={() => onOpen(ticket)} />}
              {onResolve && ticket.status === "open" && ticket.canResolve !== false && <MenuItem index={1} label={labels.resolve} disabled={pending.has(`resolve:${ticket.id}`)} onClick={() => onResolve(ticket)} />}
            </DropdownContent></DropdownMenu>}
          </InfoItem>
          {(errors[`resolve:${ticket.id}`] || errors[`open:${ticket.id}`]) && <p role="alert" className="text-label text-fg-danger">{labels.actionError}{onResolve && errors[`resolve:${ticket.id}`] && <Button variant="link" size="sm" onClick={() => onResolve(ticket)}>{labels.retry}</Button>}</p>}
        </div>)}</div>}
      </AccordionContent>
    </AccordionItem>
  </Accordion>;
}
