import "server-only";

import type { AppLocale } from "@/app/_i18n/routing";

type Messages = Record<string, unknown>;
type Loader = () => Promise<{ default: Messages }>;

const commonLoaders: Record<AppLocale, Loader> = {
  en: () => import("@docs/content/en/common-slim.json"),
  "zh-CN": () => import("@docs/content/zh-CN/common-slim.json"),
};

const pageLoaders: Record<AppLocale, Record<string, Loader>> = {
  en: {
    home: () => import("@docs/content/en/home.json"),
    "docs/introduction": () => import("@docs/content/en/components/introduction.json"),
    "components/button": () => import("@docs/content/en/components/button.json"),
    "components/button-group": () => import("@docs/content/en/components/button-group.json"),
    "components/data-grid": () => import("@docs/content/en/components/data-grid.json"),
    "components/accordion": () => import("@docs/content/en/components/accordion.json"),
    "components/alert": () => import("@docs/content/en/components/alert.json"),
    "components/switch": () => import("@docs/content/en/components/switch.json"),
    "components/table": () => import("@docs/content/en/components/table.json"),
    "components/thinking-indicator": () => import("@docs/content/en/components/thinking-indicator.json"),
    "components/checkbox-group": () => import("@docs/content/en/components/checkbox-group.json"),
    "components/checkbox": () => import("@docs/content/en/components/checkbox.json"),
    "components/dialog": () => import("@docs/content/en/components/dialog.json"),
    "components/badge": () => import("@docs/content/en/components/badge.json"),
    "components/kbd": () => import("@docs/content/en/components/kbd.json"),
    "components/input": () => import("@docs/content/en/components/input.json"),
    "components/tooltip": () => import("@docs/content/en/components/tooltip.json"),
    "components/toast": () => import("@docs/content/en/components/toast.json"),
    "components/input-copy": () => import("@docs/content/en/components/input-copy.json"),
    "components/input-message": () => import("@docs/content/en/components/input-message.json"),
    "components/data-table": () => import("@docs/content/en/components/data-table.json"),
    "components/detail-list": () => import("@docs/content/en/components/detail-list.json"),
    "components/metric-card": () => import("@docs/content/en/components/metric-card.json"),
    "components/badge-overflow": () => import("@docs/content/en/components/badge-overflow.json"),
    "components/radio-group": () => import("@docs/content/en/components/radio-group.json"),
    "components/color-picker": () => import("@docs/content/en/components/color-picker.json"),
    "components/popover": () => import("@docs/content/en/components/popover.json"),
    "components/dropdown": () => import("@docs/content/en/components/dropdown.json"),
    "components/field": () => import("@docs/content/en/components/field.json"),
    "components/breadcrumb": () => import("@docs/content/en/components/breadcrumb.json"),
    "components/stepper": () => import("@docs/content/en/components/stepper.json"),
    "components/chat-message": () => import("@docs/content/en/components/chat-message.json"),
    "components/surfaces": () => import("@docs/content/en/components/surfaces.json"),
    "components/motion": () => import("@docs/content/en/components/motion.json"),
    "components/semantic-tokens": () => import("@docs/content/en/components/semantic-tokens.json"),
    "components/scrollbars": () => import("@docs/content/en/components/scrollbars.json"),
    "components/input-group": () => import("@docs/content/en/components/input-group.json"),
    "components/info-item": () => import("@docs/content/en/components/info-item.json"),
    "components/select": () => import("@docs/content/en/components/select.json"),
    "components/slider": () => import("@docs/content/en/components/slider.json"),
    "components/tabs": () => import("@docs/content/en/components/tabs.json"),
    "components/textarea": () => import("@docs/content/en/components/textarea.json"),
    "components/card": () => import("@docs/content/en/components/card.json"),
    "components/container": () => import("@docs/content/en/components/container.json"),
    "components/thinking-steps": () => import("@docs/content/en/components/thinking-steps.json"),
    "components/ask-user-questions": () => import("@docs/content/en/components/ask-user-questions.json"),
    "blocks/provider-create-form-01": () => import("@docs/content/en/blocks/provider-create-form-01.json"),
    "blocks/resource-details-01": () => import("@docs/content/en/blocks/resource-details-01.json"),
    "blocks/resource-list-table-01": () => import("@docs/content/en/blocks/resource-list-table-01.json"),
    "blocks/resource-metric-list-01": () => import("@docs/content/en/blocks/resource-metric-list-01.json"),
    "blocks/resource-status-all-01": () => import("@docs/content/en/blocks/resource-status-all-01.json"),
    "blocks/top-nav-app-shell-01": () => import("@docs/content/en/blocks/top-nav-app-shell-01.json"),
    "blocks/zaiops-operations-01": () => import("@docs/content/en/blocks/zaiops-operations-01.json"),
    "icons/overview": () => import("@docs/content/en/icons/overview.json"),
    "icons/usage": () => import("@docs/content/en/icons/usage.json"),
    "icons/catalog": () => import("@docs/content/en/icons/catalog.json"),
    "icons/providers": () => import("@docs/content/en/icons/providers.json"),
  },
  "zh-CN": {
    home: () => import("@docs/content/zh-CN/home.json"),
    "docs/introduction": () => import("@docs/content/zh-CN/components/introduction.json"),
    "components/button": () => import("@docs/content/zh-CN/components/button.json"),
    "components/button-group": () => import("@docs/content/zh-CN/components/button-group.json"),
    "components/data-grid": () => import("@docs/content/zh-CN/components/data-grid.json"),
    "components/accordion": () => import("@docs/content/zh-CN/components/accordion.json"),
    "components/alert": () => import("@docs/content/zh-CN/components/alert.json"),
    "components/switch": () => import("@docs/content/zh-CN/components/switch.json"),
    "components/table": () => import("@docs/content/zh-CN/components/table.json"),
    "components/thinking-indicator": () => import("@docs/content/zh-CN/components/thinking-indicator.json"),
    "components/checkbox-group": () => import("@docs/content/zh-CN/components/checkbox-group.json"),
    "components/checkbox": () => import("@docs/content/zh-CN/components/checkbox.json"),
    "components/dialog": () => import("@docs/content/zh-CN/components/dialog.json"),
    "components/badge": () => import("@docs/content/zh-CN/components/badge.json"),
    "components/kbd": () => import("@docs/content/zh-CN/components/kbd.json"),
    "components/input": () => import("@docs/content/zh-CN/components/input.json"),
    "components/tooltip": () => import("@docs/content/zh-CN/components/tooltip.json"),
    "components/toast": () => import("@docs/content/zh-CN/components/toast.json"),
    "components/input-copy": () => import("@docs/content/zh-CN/components/input-copy.json"),
    "components/input-message": () => import("@docs/content/zh-CN/components/input-message.json"),
    "components/data-table": () => import("@docs/content/zh-CN/components/data-table.json"),
    "components/detail-list": () => import("@docs/content/zh-CN/components/detail-list.json"),
    "components/metric-card": () => import("@docs/content/zh-CN/components/metric-card.json"),
    "components/badge-overflow": () => import("@docs/content/zh-CN/components/badge-overflow.json"),
    "components/radio-group": () => import("@docs/content/zh-CN/components/radio-group.json"),
    "components/color-picker": () => import("@docs/content/zh-CN/components/color-picker.json"),
    "components/popover": () => import("@docs/content/zh-CN/components/popover.json"),
    "components/dropdown": () => import("@docs/content/zh-CN/components/dropdown.json"),
    "components/field": () => import("@docs/content/zh-CN/components/field.json"),
    "components/breadcrumb": () => import("@docs/content/zh-CN/components/breadcrumb.json"),
    "components/stepper": () => import("@docs/content/zh-CN/components/stepper.json"),
    "components/chat-message": () => import("@docs/content/zh-CN/components/chat-message.json"),
    "components/surfaces": () => import("@docs/content/zh-CN/components/surfaces.json"),
    "components/motion": () => import("@docs/content/zh-CN/components/motion.json"),
    "components/semantic-tokens": () => import("@docs/content/zh-CN/components/semantic-tokens.json"),
    "components/scrollbars": () => import("@docs/content/zh-CN/components/scrollbars.json"),
    "components/input-group": () => import("@docs/content/zh-CN/components/input-group.json"),
    "components/info-item": () => import("@docs/content/zh-CN/components/info-item.json"),
    "components/select": () => import("@docs/content/zh-CN/components/select.json"),
    "components/slider": () => import("@docs/content/zh-CN/components/slider.json"),
    "components/tabs": () => import("@docs/content/zh-CN/components/tabs.json"),
    "components/textarea": () => import("@docs/content/zh-CN/components/textarea.json"),
    "components/card": () => import("@docs/content/zh-CN/components/card.json"),
    "components/container": () => import("@docs/content/zh-CN/components/container.json"),
    "components/thinking-steps": () => import("@docs/content/zh-CN/components/thinking-steps.json"),
    "components/ask-user-questions": () => import("@docs/content/zh-CN/components/ask-user-questions.json"),
    "blocks/provider-create-form-01": () => import("@docs/content/zh-CN/blocks/provider-create-form-01.json"),
    "blocks/resource-details-01": () => import("@docs/content/zh-CN/blocks/resource-details-01.json"),
    "blocks/resource-list-table-01": () => import("@docs/content/zh-CN/blocks/resource-list-table-01.json"),
    "blocks/resource-metric-list-01": () => import("@docs/content/zh-CN/blocks/resource-metric-list-01.json"),
    "blocks/resource-status-all-01": () => import("@docs/content/zh-CN/blocks/resource-status-all-01.json"),
    "blocks/top-nav-app-shell-01": () => import("@docs/content/zh-CN/blocks/top-nav-app-shell-01.json"),
    "blocks/zaiops-operations-01": () => import("@docs/content/zh-CN/blocks/zaiops-operations-01.json"),
    "icons/overview": () => import("@docs/content/zh-CN/icons/overview.json"),
    "icons/usage": () => import("@docs/content/zh-CN/icons/usage.json"),
    "icons/catalog": () => import("@docs/content/zh-CN/icons/catalog.json"),
    "icons/providers": () => import("@docs/content/zh-CN/icons/providers.json"),
  },
};

export async function loadPageMessages(locale: AppLocale, namespace: string) {
  const common = (await commonLoaders[locale]()).default;
  const page = pageLoaders[locale][namespace]
    ? (await pageLoaders[locale][namespace]()).default
    : {};
  const slug = namespace.includes("/") ? namespace.slice(namespace.lastIndexOf("/") + 1) : null;
  const fullCommon = (await (
    locale === "en"
      ? import("@docs/content/en/common.json")
      : import("@docs/content/zh-CN/common.json")
  )).default as { docMeta?: { descriptions?: Record<string, string> } };
  const description = slug ? fullCommon.docMeta?.descriptions?.[slug] : undefined;

  return {
    ...common,
    ...page,
    docMeta: {
      descriptions: description && slug ? { [slug]: description } : {},
    },
  };
}
