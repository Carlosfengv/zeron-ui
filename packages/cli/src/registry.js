export const DEFAULT_REGISTRY_URL = "https://www.zerondesign.com/r";

const COMPONENT_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function normalizeRegistryUrl(value = DEFAULT_REGISTRY_URL) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`invalid Registry URL "${value}"`);
  }

  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocalhost && url.protocol === "http:")) {
    throw new Error("Registry URL must use HTTPS, except for localhost development");
  }

  return url.toString().replace(/\/$/, "");
}

export function validateComponentName(name) {
  if (!COMPONENT_NAME_PATTERN.test(name)) {
    throw new Error(
      `invalid component name "${name}"; use lowercase letters, numbers, and hyphens`,
    );
  }

  return name;
}

export function componentUrl(name, registryUrl = DEFAULT_REGISTRY_URL) {
  const validName = validateComponentName(name);
  return `${normalizeRegistryUrl(registryUrl)}/${encodeURIComponent(validName)}.json`;
}

export async function fetchCatalog(registryUrl = DEFAULT_REGISTRY_URL, fetchImpl = fetch) {
  const url = `${normalizeRegistryUrl(registryUrl)}/registry.json`;
  const response = await fetchImpl(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Registry request failed (${response.status}) at ${url}`);
  }

  const catalog = await response.json();
  if (!Array.isArray(catalog.items)) {
    throw new Error(`Registry response at ${url} is missing an items array`);
  }

  return catalog;
}
