"use client";

import { Alert, AlertTitle, AlertDescription, AlertAction } from "@zeron/ui/alert";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import Share08Icon from "@hugeicons/core-free-icons/Share08Icon";
import CreditCardIcon from "@hugeicons/core-free-icons/CreditCardIcon";
import Tag01Icon from "@hugeicons/core-free-icons/Tag01Icon";
import Download04Icon from "@hugeicons/core-free-icons/Download04Icon";
import { Container, ContainerHeader, ContainerBody } from "@zeron/ui/container";
import { DetailList, DetailListItem, DetailListLabel, DetailListValue } from "@zeron/ui/detail-list";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@zeron/ui/accordion";
import { Avatar, AvatarImage, AvatarFallback } from "@zeron/ui/avatar";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { DropdownMenu, DropdownTrigger, DropdownContent } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { InfoItemGroup, InfoItem, InfoItemLeading, InfoItemContent, InfoItemTitle, InfoItemTrailing } from "@zeron/ui/info-item";
import { Tooltip } from "@zeron/ui/tooltip";
import { Skeleton } from "@zeron/ui/skeleton";
import { Empty, EmptyHeader, EmptyTitle } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent, InlineNoticeAction } from "@zeron/ui/inline-notice";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { transactionAmountParts, transactionDate, transactionFileSize, transactionInitials } from "./transaction-details-format";
import { transactionDetailsLabels } from "./transaction-details-labels";
import type { TransactionDetailsProps, TransactionStatus } from "./transaction-details-types";

const tones = { approved: "success", pending: "warning", failed: "danger", canceled: "neutral" } as const satisfies Record<TransactionStatus, "success" | "warning" | "danger" | "neutral">;
const pillClass = "inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border-hairline border-border px-2 py-0.5 text-body text-fg-default break-all";

function Fact({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return <DetailListItem className="grid grid-cols-1 items-start gap-1 py-1 @sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @sm:items-center @sm:gap-3">
    <DetailListLabel className="flex min-w-0 items-center gap-2 font-normal text-fg-muted">{icon && <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">{icon}</span>}{label}</DetailListLabel>
    <DetailListValue className="ml-0 max-w-none text-left text-fg-default">{children}</DetailListValue>
  </DetailListItem>;
}

function AccountLogo({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt="" className="h-4 w-6 object-contain" onError={() => setFailed(true)} />
    : <HugeiconsIcon icon={CreditCardIcon} size={16} strokeWidth={1.5} />;
}

/** The host owns requests and overlays. A new transaction resets local feedback and disclosure. */
export function TransactionDetails(props: TransactionDetailsProps) {
  return <TransactionDetailsContent key={props.transactionId} {...props} />;
}

function TransactionDetailsContent({ transactionId, data, state = "ready", refreshing = false, retainDataOnError = true,
  statusMessage, locale = "zh-CN", timeZone = "Asia/Shanghai", labels: overrides, billingOpen, defaultBillingOpen = true,
  onBillingOpenChange, actions, className, ...props }: TransactionDetailsProps) {
  const labels = { ...transactionDetailsLabels(locale), ...overrides };
  const typeLabels = { payout: labels.payout, payment: labels.payment, refund: labels.refund };
  const titleId = useId();
  const mounted = useRef(false);
  const guards = useRef(new Set<string>());
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, { message: string; error: boolean }>>({});
  const [localOpen, setLocalOpen] = useState(defaultBillingOpen);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const More = useIcon("ellipsis"), Close = useIcon("x"), Hash = useIcon("hash"),
    Circle = useIcon("circle"), User = useIcon("user"), Mail = useIcon("mail"), Calendar = useIcon("calendar"), Check = useIcon("check"), File = useIcon("file-text");
  const matching = data?.id === transactionId ? data : null;
  const loading = state === "loading" || (!matching && (refreshing || (data !== null && state !== "error" && state !== "empty")));
  const visible = !loading && state !== "empty" && (state !== "error" || retainDataOnError) ? matching : null;
  const date = transactionDate(visible?.occurredAt ?? null, locale, timeZone);
  const amount = visible ? transactionAmountParts(visible.amountMinor, visible.currency, locale) : null;
  const empty = (value: string | null | undefined) => value?.trim() || labels.unknown;
  const context = { transactionId };
  const actionLabels: Record<string, string> = { receipt: labels.downloadReceipt, share: labels.share, retry: labels.retry, "copy-id": labels.copyId, "copy-invoice": labels.copyInvoice };

  async function run(key: string, callback: () => void | Promise<void>, success: string = labels.completed, failure: string = labels.actionError) {
    if (guards.current.has(key)) return;
    guards.current.add(key);
    setPending(new Set(guards.current));
    setFeedback((current) => { const next = { ...current }; delete next[key]; return next; });
    try {
      await callback();
      if (mounted.current) setFeedback((current) => ({ ...current, [key]: { message: success, error: false } }));
    } catch {
      if (mounted.current) setFeedback((current) => ({ ...current, [key]: { message: failure, error: true } }));
    } finally {
      guards.current.delete(key);
      if (mounted.current) setPending(new Set(guards.current));
    }
  }
  function copy(key: string, value: string) { void run(key, () => navigator.clipboard.writeText(value), labels.copied, labels.copyError); }
  const retry = actions?.onRetry ? <Button variant="secondary" size="sm" loading={pending.has("retry")} onClick={() => void run("retry", () => actions.onRetry!(context))}>{labels.retry}</Button> : undefined;
  const isOpen = billingOpen ?? localOpen;
  const icons = { type: <HugeiconsIcon icon={Tag01Icon} size={16} strokeWidth={1.5} />, account: <HugeiconsIcon icon={CreditCardIcon} size={16} strokeWidth={1.5} /> };

  return <Container {...props} data-block="transaction-details" data-state={state} aria-labelledby={titleId} aria-busy={loading || refreshing || undefined} className={cn("@container w-full max-w-md", className)}>
    <ContainerHeader className="py-1.5">
      <h2 id={titleId} className="min-w-0 break-words text-body font-medium text-fg-default">{labels.title}</h2>
      <div className="flex flex-wrap items-center gap-1">
        {visible && actions?.onDownloadReceipt && <Tooltip content={labels.downloadReceipt}><Button variant="ghost" size="sm" iconOnly aria-label={labels.downloadReceipt} loading={pending.has("receipt")} onClick={() => void run("receipt", () => actions.onDownloadReceipt!(context))}><HugeiconsIcon icon={Download04Icon} size={16} strokeWidth={1.5} aria-hidden /></Button></Tooltip>}
        {visible && actions?.onShare && <Tooltip content={labels.share}><Button variant="ghost" size="sm" iconOnly aria-label={labels.share} loading={pending.has("share")} onClick={() => void run("share", () => actions.onShare!(context))}><HugeiconsIcon icon={Share08Icon} aria-hidden size={16} strokeWidth={1.5} /></Button></Tooltip>}
        {visible && <DropdownMenu><DropdownTrigger render={<Button variant="ghost" size="sm" iconOnly aria-label={labels.more}><More aria-hidden /></Button>} /><DropdownContent align="end">
          <MenuItem index={0} label={labels.copyId} disabled={pending.has("copy-id")} onSelect={() => copy("copy-id", transactionId)} />
          {visible.invoiceNumber && <MenuItem index={1} label={labels.copyInvoice} disabled={pending.has("copy-invoice")} onSelect={() => copy("copy-invoice", visible.invoiceNumber!)} />}
        </DropdownContent></DropdownMenu>}
        {actions?.onClose && <><span aria-hidden="true" className="mx-1 h-4 border-l-hairline border-border" /><Tooltip content={labels.close}><Button variant="ghost" size="sm" iconOnly aria-label={labels.close} onClick={actions.onClose}><Close aria-hidden /></Button></Tooltip></>}
      </div>
    </ContainerHeader>
    <ContainerBody>
      {loading ? <div role="status" className="flex flex-col gap-5"><span className="sr-only">{labels.loading}</span><Skeleton className="h-12 w-48 max-w-full" /><Skeleton className="h-56 w-full" /><Skeleton className="h-60 w-full" /><Skeleton className="h-14 w-full" /></div>
        : state === "error" && !visible ? <div className="flex min-w-0 w-full items-center justify-center min-h-60 px-4 py-8"><Alert status="danger" role="group" className="w-full max-w-xl"><AlertTitle>{labels.error}</AlertTitle><AlertDescription>{statusMessage}</AlertDescription><AlertAction>{retry}</AlertAction></Alert></div>
          : !visible ? <Empty reason="no-data" scope="section"><EmptyHeader><EmptyTitle>{labels.noData}</EmptyTitle></EmptyHeader></Empty>
            : <div className="flex min-w-0 flex-col gap-5">
              {state === "stale" && <InlineNotice variant="emphasized" tone="warning"><InlineNoticeContent>{statusMessage ?? labels.stale}</InlineNoticeContent></InlineNotice>}
              {refreshing && <InlineNotice variant="emphasized" tone="info"><InlineNoticeContent>{labels.refreshing} {labels.previousData}</InlineNoticeContent></InlineNotice>}
              {state === "error" && <InlineNotice variant="emphasized" tone="danger"><InlineNoticeContent>{statusMessage ?? labels.error} {labels.previousData}</InlineNoticeContent>{retry && <InlineNoticeAction>{retry}</InlineNoticeAction>}</InlineNotice>}
              <div><p className="text-body text-fg-muted">{labels.amount}</p><p data-slot="transaction-amount" className="mt-1 break-words text-heading font-medium tabular-nums text-fg-default @sm:text-display">
                {amount ? amount.map((part, index) => <span key={index} className={part.type === "decimal" || part.type === "fraction" ? "text-title font-normal text-fg-subtle" : undefined}>{part.value}</span>) : labels.unknown}
              </p></div>
              <DetailList aria-label={labels.title} className="gap-2 rounded-none border-0 p-0">
                <Fact label={labels.invoiceNumber} icon={<Hash size={16} />}>{empty(visible.invoiceNumber)}</Fact>
                <Fact label={labels.type} icon={icons.type}>{visible.type && Object.hasOwn(typeLabels, visible.type) ? typeLabels[visible.type] : labels.unknown}</Fact>
                <Fact label={labels.status} icon={<Circle size={16} />}>{visible.status && Object.hasOwn(tones, visible.status) ? <Badge status={tones[visible.status]} size="md"><span className="flex items-center gap-1.5">{visible.status === "approved" && <Check size={14} aria-hidden />}{labels[visible.status]}</span></Badge> : labels.unknown}</Fact>
                <Fact label={labels.sender} icon={<User size={16} />}>{visible.sender?.name ? <span className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full text-body text-fg-default break-all"><Avatar size="sm">{visible.sender.avatarUrl && <AvatarImage src={visible.sender.avatarUrl} alt="" />}<AvatarFallback>{transactionInitials(visible.sender.name)}</AvatarFallback></Avatar><span className="min-w-0 break-words">{visible.sender.name}</span></span> : labels.unknown}</Fact>
                <Fact label={labels.senderEmail} icon={<Mail size={16} />}>{visible.sender?.email ? <span className="break-all">{visible.sender.email}</span> : labels.unknown}</Fact>
                <Fact label={labels.account} icon={icons.account}>{visible.account && /^\d{4}$/.test(visible.account.last4) ? <span className={pillClass}><span className="sr-only">{visible.account.brand}</span><Tooltip content={visible.account.brand}><span className="flex shrink-0 items-center" aria-hidden="true"><AccountLogo key={visible.account.logoUrl} src={visible.account.logoUrl} /></span></Tooltip><span className="text-fg-subtle">••••</span><span>{visible.account.last4}</span></span> : labels.unknown}</Fact>
                <Fact label={labels.date} icon={<Calendar size={16} />}>{date ? <span className="flex flex-wrap items-center gap-2"><time dateTime={visible.occurredAt!}>{date.text}</time><span className={pillClass}>{date.zone}</span></span> : labels.unknown}</Fact>
              </DetailList>
              {visible.billing && <section aria-label={labels.billing} className="rounded-xl border-hairline border-border"><Accordion className="w-full" type="single" collapsible value={isOpen ? "billing" : ""} onValueChange={(value: string) => { const next = value === "billing"; if (billingOpen === undefined) setLocalOpen(next); onBillingOpenChange?.(next); }}><AccordionItem value="billing"><AccordionTrigger>{labels.billing}</AccordionTrigger><AccordionContent>
                <DetailList aria-label={labels.billing} className="gap-1 rounded-none border-0 border-t-hairline border-border-subtle bg-inherit p-0 pt-3">
                  <Fact label={labels.street}>{empty(visible.billing.street)}</Fact><Fact label={labels.city}>{empty(visible.billing.city)}</Fact>
                  <Fact label={labels.region}>{empty(visible.billing.region)}</Fact><Fact label={labels.postalCode}>{empty(visible.billing.postalCode)}</Fact>
                  <Fact label={labels.email}>{empty(visible.billing.email)}</Fact><Fact label={labels.phone}>{empty(visible.billing.phone)}</Fact>
                </DetailList>
              </AccordionContent></AccordionItem></Accordion></section>}
              <section aria-label={labels.attachments}><h3 className="mb-2 text-label font-normal text-fg-muted">{labels.attachments}</h3>
                {visible.attachments?.length ? <InfoItemGroup>{visible.attachments.map((attachment) => {
                  const openKey = `open:${attachment.id}`, downloadKey = `download:${attachment.id}`;
                  return <InfoItem key={attachment.id}>
                    <InfoItemLeading>{attachment.mimeType === "application/pdf" ? <span className="text-label font-medium">PDF</span> : <File size={20} aria-hidden />}</InfoItemLeading>
                    <InfoItemContent><InfoItemTitle className="font-normal">{actions?.onOpenAttachment ? <Button variant="ghost" size="sm" contentSized className="w-full min-w-0 justify-start" loading={pending.has(openKey)} aria-label={`${labels.openAttachment}: ${attachment.name}`} onClick={() => void run(openKey, () => actions.onOpenAttachment!({ transactionId, attachmentId: attachment.id }))}><span className="block max-w-full truncate" title={attachment.name}>{attachment.name}</span></Button> : <span className="block truncate" title={attachment.name}>{attachment.name}</span>}</InfoItemTitle></InfoItemContent>
                    <InfoItemTrailing className="flex-wrap gap-2"><span className="text-label text-fg-subtle">{transactionFileSize(attachment.sizeBytes, locale) ?? labels.unknown}</span>
                      {(actions?.onOpenAttachment || actions?.onDownloadAttachment) && <DropdownMenu><DropdownTrigger render={<Button variant="ghost" size="sm" iconOnly loading={pending.has(openKey) || pending.has(downloadKey)} aria-label={`${labels.attachmentActions}: ${attachment.name}`}><More aria-hidden /></Button>} /><DropdownContent align="end">
                        {actions.onOpenAttachment && <MenuItem index={0} label={labels.openAttachment} disabled={pending.has(openKey)} onSelect={() => void run(openKey, () => actions.onOpenAttachment!({ transactionId, attachmentId: attachment.id }))} />}
                        {actions.onDownloadAttachment && <MenuItem index={actions.onOpenAttachment ? 1 : 0} label={labels.downloadAttachment} disabled={pending.has(downloadKey)} onSelect={() => void run(downloadKey, () => actions.onDownloadAttachment!({ transactionId, attachmentId: attachment.id }))} />}
                      </DropdownContent></DropdownMenu>}
                    </InfoItemTrailing>
                  </InfoItem>;
                })}</InfoItemGroup> : <p className="text-body text-fg-subtle">{visible.attachments === null ? labels.unknown : labels.noAttachments}</p>}
              </section>
            </div>}
      <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-1">{Object.entries(feedback).map(([key, item]) => <p key={key} className={cn("mt-2 text-label", item.error ? "text-fg-danger" : "text-fg-muted")}><span>{actionLabels[key] ?? (key.startsWith("open:") ? labels.openAttachment : labels.downloadAttachment)}: </span><span>{item.message}</span></p>)}</div>
    </ContainerBody>
  </Container>;
}
