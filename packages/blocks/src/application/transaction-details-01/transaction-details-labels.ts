import type { TransactionDetailsLabels } from "./transaction-details-types";

const en: TransactionDetailsLabels = {
  title: "Transaction details", amount: "Amount", invoiceNumber: "Invoice no.", type: "Transaction type", status: "Status",
  sender: "Sender", senderEmail: "Sender email", account: "Account", date: "Date", billing: "Billing information",
  street: "Street address", city: "City", region: "State", postalCode: "Zip code", email: "Email", phone: "Mobile number",
  attachments: "Attachments", noAttachments: "No attachments", unknown: "—", noData: "No transaction found", loading: "Loading transaction",
  error: "Unable to load transaction", stale: "This transaction may be out of date.", refreshing: "Refreshing transaction…", previousData: "Showing the last available transaction.",
  downloadReceipt: "Download receipt", share: "Share transaction", close: "Close", more: "More actions",
  copyId: "Copy transaction ID", copyInvoice: "Copy invoice number", copied: "Copied", copyError: "Unable to copy. Please try again.",
  openAttachment: "Open attachment", downloadAttachment: "Download attachment", attachmentActions: "Attachment actions",
  actionError: "This action failed. Please try again.", completed: "Action completed", retry: "Retry",
  approved: "Approved", pending: "Pending", failed: "Failed", canceled: "Canceled", payout: "Payout", payment: "Payment", refund: "Refund",
};
const zh: TransactionDetailsLabels = {
  title: "交易详情", amount: "金额", invoiceNumber: "发票编号", type: "交易类型", status: "状态",
  sender: "付款人", senderEmail: "付款人邮箱", account: "付款账户", date: "日期", billing: "账单信息",
  street: "街道地址", city: "城市", region: "州 / 省", postalCode: "邮政编码", email: "邮箱", phone: "手机号码",
  attachments: "附件", noAttachments: "暂无附件", unknown: "—", noData: "未找到交易", loading: "正在加载交易",
  error: "无法加载交易", stale: "交易信息可能已过期。", refreshing: "正在更新交易…", previousData: "当前显示上次获取的交易。",
  downloadReceipt: "下载收据", share: "分享交易", close: "关闭", more: "更多操作",
  copyId: "复制交易编号", copyInvoice: "复制发票编号", copied: "已复制", copyError: "复制失败，请重试。",
  openAttachment: "打开附件", downloadAttachment: "下载附件", attachmentActions: "附件操作",
  actionError: "操作失败，请重试。", completed: "操作已完成", retry: "重试",
  approved: "已批准", pending: "处理中", failed: "失败", canceled: "已取消", payout: "出款", payment: "付款", refund: "退款",
};
export function transactionDetailsLabels(locale: string): TransactionDetailsLabels {
  return locale.toLowerCase().startsWith("zh") ? zh : en;
}
