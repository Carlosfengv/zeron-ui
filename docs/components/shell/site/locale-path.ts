export function localePrefixFromPathname(pathname: string) {
  const normalized = pathname.toLowerCase();
  return normalized === "/en" || normalized.startsWith("/en/") ? "/en" : "";
}

export function internalPathname(pathname: string) {
  const prefix = localePrefixFromPathname(pathname);
  if (!prefix) return pathname;
  return pathname.slice(prefix.length) || "/";
}

export function localizePathname(pathname: string, prefix: string) {
  return prefix ? `${prefix}${pathname === "/" ? "" : pathname}` : pathname;
}
