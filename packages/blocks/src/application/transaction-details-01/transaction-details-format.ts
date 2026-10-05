/** Preserve currency placement, grouping and signs; callers only de-emphasize decimal/fraction parts. */
export function transactionAmountParts(amountMinor: number | null, currency: string, locale: string): Intl.NumberFormatPart[] | null {
  if (amountMinor === null || !Number.isSafeInteger(amountMinor) || !/^[A-Z]{3}$/.test(currency)) return null;
  try {
    const format = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" });
    const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
    // Formatting a decimal string preserves minor units close to MAX_SAFE_INTEGER.
    const absolute = String(Math.abs(amountMinor)).padStart(digits + 1, "0");
    const decimal = `${amountMinor < 0 ? "-" : ""}${digits ? `${absolute.slice(0, -digits)}.${absolute.slice(-digits)}` : absolute}`;
    return format.formatToParts(decimal as unknown as number);
  } catch { return null; }
}

export function transactionDate(value: string | null, locale: string, timeZone: string): { text: string; zone: string } | null {
  if (!value) return null;
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/i);
  if (!parts) return null;
  const year = Number(parts[1]), month = Number(parts[2]), day = Number(parts[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  // Date.parse can silently normalize an impossible day into the next month.
  if (!daysInMonth || day < 1 || day > daysInMonth || !Number.isFinite(Date.parse(value))) return null;
  try {
    const date = new Date(value);
    const text = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone }).format(date);
    const zone = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? timeZone;
    return { text, zone };
  } catch { return null; }
}

export function transactionFileSize(bytes: number | null, locale: string): string | null {
  if (bytes === null || !Number.isSafeInteger(bytes) || bytes < 0) return null;
  const index = bytes >= 1e9 ? 3 : bytes >= 1e6 ? 2 : bytes >= 1e3 ? 1 : 0;
  try { return `${new Intl.NumberFormat(locale, { maximumFractionDigits: index ? 1 : 0 }).format(bytes / 1000 ** index)} ${["B", "KB", "MB", "GB"][index]}`; }
  catch { return null; }
}

export function transactionInitials(name: string | null): string {
  return name?.trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join("") || "?";
}
