import type { ComponentPropsWithoutRef } from "react";

export type TransactionStatus = "approved" | "pending" | "failed" | "canceled";
export type TransactionType = "payout" | "payment" | "refund";
export type TransactionDetailsState = "ready" | "loading" | "empty" | "error" | "stale";
export interface TransactionAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
}
export interface TransactionBilling {
  street?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  email?: string | null;
  phone?: string | null;
}
export interface TransactionDetailsData {
  id: string;
  invoiceNumber: string | null;
  /** Safe integer in the currency's minor unit; null means unknown. */
  amountMinor: number | null;
  currency: string;
  type: TransactionType | null;
  status: TransactionStatus | null;
  sender: { name: string | null; email: string | null; avatarUrl?: string } | null;
  account: { brand: string; last4: string; logoUrl?: string } | null;
  /** ISO timestamp containing a timezone offset or Z. */
  occurredAt: string | null;
  billing?: TransactionBilling | null;
  /** null means unknown; [] is a confirmed empty collection. */
  attachments: readonly TransactionAttachment[] | null;
}
export interface TransactionActionContext { transactionId: string }
export interface TransactionAttachmentContext extends TransactionActionContext { attachmentId: string }
export interface TransactionDetailsActions {
  onDownloadReceipt?: (context: TransactionActionContext) => void | Promise<void>;
  onShare?: (context: TransactionActionContext) => void | Promise<void>;
  onClose?: () => void;
  onRetry?: (context: TransactionActionContext) => void | Promise<void>;
  onOpenAttachment?: (context: TransactionAttachmentContext) => void | Promise<void>;
  onDownloadAttachment?: (context: TransactionAttachmentContext) => void | Promise<void>;
}
export interface TransactionDetailsLabels {
  title: string; amount: string; invoiceNumber: string; type: string; status: string;
  sender: string; senderEmail: string; account: string; date: string; billing: string;
  street: string; city: string; region: string; postalCode: string; email: string; phone: string;
  attachments: string; noAttachments: string; unknown: string; noData: string; loading: string;
  error: string; stale: string; refreshing: string; previousData: string;
  downloadReceipt: string; share: string; close: string; more: string;
  copyId: string; copyInvoice: string; copied: string; copyError: string;
  openAttachment: string; downloadAttachment: string; attachmentActions: string;
  actionError: string; completed: string; retry: string;
  approved: string; pending: string; failed: string; canceled: string;
  payout: string; payment: string; refund: string;
}
export interface TransactionDetailsProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "title"> {
  transactionId: string;
  data: TransactionDetailsData | null;
  state?: TransactionDetailsState;
  refreshing?: boolean;
  /** An error may retain the last matching transaction, explicitly marked as old data. */
  retainDataOnError?: boolean;
  statusMessage?: string;
  locale?: string;
  timeZone?: string;
  labels?: Partial<TransactionDetailsLabels>;
  billingOpen?: boolean;
  defaultBillingOpen?: boolean;
  onBillingOpenChange?: (open: boolean) => void;
  actions?: TransactionDetailsActions;
}
