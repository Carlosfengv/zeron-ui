import { describe, expect, it } from "vitest";
import { transactionAmountParts, transactionDate, transactionFileSize } from "../packages/blocks/src/application/transaction-details-01/transaction-details-format";
import { createTransactionDemoPdf } from "../docs/components/blocks/transaction-demo-pdf";

const money = (value: number | null, currency = "USD", locale = "en-US") => transactionAmountParts(value, currency, locale)?.map((part) => part.value).join("");
describe("transaction formatting", () => {
  it("uses currency precision, preserves signs and grouping", () => {
    expect(money(2300000)).toBe("$23,000.00");
    expect(money(0)).toBe("$0.00"); expect(money(-123)).toBe("-$1.23");
    expect(money(23000, "JPY")).toBe("¥23,000"); expect(money(1234, "KWD")).toBe("KWD 1.234");
    expect(money(12345, "EUR", "de-DE")).toBe("123,45 €");
    expect(money(Number.MAX_SAFE_INTEGER)).toBe("$90,071,992,547,409.91");
  });
  it("never renders missing or invalid amounts as zero", () => {
    for (const value of [null, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) expect(transactionAmountParts(value, "USD", "en-US")).toBeNull();
    expect(transactionAmountParts(100, "bad", "en-US")).toBeNull();
    expect(transactionAmountParts(100, "USD", "invalid_locale")).toBeNull();
  });
  it("gets the timezone label from the timestamp including daylight saving", () => {
    const winter = transactionDate("2025-12-15T20:32:00Z", "en-US", "America/New_York");
    expect(winter?.text).toContain("3:32 PM"); expect(winter?.zone).toBe("EST");
    expect(transactionDate("2025-07-15T20:32:00Z", "en-US", "America/New_York")?.zone).toBe("EDT");
    for (const value of [null, "garbage", "2025-12-15T20:32:00"]) expect(transactionDate(value, "en-US", "UTC")).toBeNull();
    expect(transactionDate("2025-12-15T20:32:00Z", "en-US", "invalid-zone")).toBeNull();
  });
  it("rejects nonexistent calendar dates and non-ISO timestamps instead of silently correcting them", () => {
    for (const value of ["2025-02-29T20:32:00Z", "2025-02-30T20:32:00Z", "2025-04-31T20:32:00+08:00", "15 Dec 2025 20:32:00Z"]) {
      expect(transactionDate(value, "en-US", "UTC")).toBeNull();
    }
    expect(transactionDate("2024-02-29T20:32:00Z", "en-US", "UTC")).not.toBeNull();
  });
  it("distinguishes unknown size from zero bytes", () => {
    expect(transactionFileSize(null, "en-US")).toBeNull(); expect(transactionFileSize(-1, "en-US")).toBeNull();
    expect(transactionFileSize(0, "en-US")).toBe("0 B"); expect(transactionFileSize(347000, "en-US")).toBe("347 KB");
  });
  it("creates a valid PDF structure with correct xref offsets and advertised size", () => {
    const bytes = createTransactionDemoPdf();
    const source = new TextDecoder().decode(bytes);
    expect(bytes.length).toBe(347000); expect(source.startsWith("%PDF-1.4")).toBe(true); expect(source.endsWith("%%EOF\n")).toBe(true);
    const xref = Number(source.match(/startxref\n(\d+)/)?.[1]); expect(source.slice(xref, xref + 4)).toBe("xref");
    const offsets = [...source.matchAll(/(\d{10}) 00000 n /g)].map((match) => Number(match[1]));
    expect(offsets).toHaveLength(5); offsets.forEach((offset, index) => expect(source.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true));
  });
});
