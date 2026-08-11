export function localePrefixFromPathname(pathname: string) {
  return pathname === "/zh-cn" || pathname.startsWith("/zh-cn/") ? "/zh-cn" : "";
}

export function internalPathname(pathname: string) {
  const prefix = localePrefixFromPathname(pathname);
  if (!prefix) return pathname;
  return pathname.slice(prefix.length) || "/";
}

export function localizePathname(pathname: string, prefix: string) {
  return prefix ? `${prefix}${pathname === "/" ? "" : pathname}` : pathname;
}
