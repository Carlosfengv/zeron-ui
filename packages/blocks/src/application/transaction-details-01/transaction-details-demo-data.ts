import type { TransactionDetailsData } from "./transaction-details-types";

export const transactionDetailsDemoData: TransactionDetailsData = {
  id: "txn-1430", invoiceNumber: "INV-1430", amountMinor: 2300000, currency: "USD", type: "payout", status: "approved",
  sender: { name: "Lily Hayes", email: "lilyhaydes124@gmail.com" },
  account: { brand: "Mastercard", last4: "1638" }, occurredAt: "2025-12-15T20:32:00Z",
  billing: { street: "842 Pinecrest Drive", city: "Redwood City", region: "California", postalCode: "94063", email: "lilyhaydes124@gmail.com", phone: "415-982-7614" },
  attachments: [{ id: "invoice-1430", name: "INV-1430.pdf", mimeType: "application/pdf", sizeBytes: 347000 }],
};
