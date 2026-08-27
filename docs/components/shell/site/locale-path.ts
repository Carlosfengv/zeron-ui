export function localePrefixFromPathname(pathname: string) {
  const normalized = pathname.toLowerCase();
  return normalized === "/en" || normalized.startsWith("/en/") ? "/en" : "";
}

export function internalPathname(pathname: string) {
  const normalized = pathname.toLowerCase();
  const prefix = normalized === "/en" || normalized.startsWith("/en/")
    ? "/en"
    : normalized === "/zh-cn" || normalized.startsWith("/zh-cn/")
      ? "/zh-CN"
      : "";
  return prefix ? pathname.slice(prefix.length) || "/" : pathname;
}

export function localizePathname(pathname: string, prefix: string) {
  return prefix ? `${prefix}${pathname === "/" ? "" : pathname}` : pathname;
}
