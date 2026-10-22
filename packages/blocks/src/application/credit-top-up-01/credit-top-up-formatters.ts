/** Resolve locale and time-zone fallbacks independently, and reuse quote formatters. */
export function createCreditTopUpFormatters(locale: string, timeZone: string) {
  let number: Intl.NumberFormat;
  try {
    number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  } catch {
    number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
  }
  const resolvedLocale = number.resolvedOptions().locale;
  const dateOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  let date: Intl.DateTimeFormat;
  try {
    date = new Intl.DateTimeFormat(resolvedLocale, { ...dateOptions, timeZone });
  } catch {
    date = new Intl.DateTimeFormat(resolvedLocale, { ...dateOptions, timeZone: "UTC" });
  }
  const currencies = new Map<string, Intl.NumberFormat>();
  return {
    number: number.format,
    date: date.format,
    money(value: number, currency: string) {
      const whole = Number.isInteger(value);
      const key = `${currency}:${whole}`;
      let formatter = currencies.get(key);
      if (!formatter) {
        formatter = new Intl.NumberFormat(resolvedLocale, {
          style: "currency",
          currency,
          maximumFractionDigits: 20,
          ...(whole ? { minimumFractionDigits: 0 } : {}),
        });
        currencies.set(key, formatter);
      }
      return formatter.format(value);
    },
  };
}
