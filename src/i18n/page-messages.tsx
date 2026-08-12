import { NextIntlClientProvider } from "next-intl";
import type { AppLocale } from "./routing";

type Messages = Record<string, unknown>;
type Loader = () => Promise<{ default: Messages }>;

const commonLoaders: Record<AppLocale, Loader> = {
  en: () => import("../../messages/en/common-slim.json"),
  "zh-CN": () => import("../../messages/zh-CN/common-slim.json"),
};

const pageLoaders: Record<AppLocale, Record<string, Loader>> = {
  en: {
    home: () => import("../../messages/en/home.json"),
    "docs/introduction": () => import("../../messages/en/docs/introduction.json"),
    "docs/button": () => import("../../messages/en/docs/button.json"),
    "docs/data-grid": () => import("../../messages/en/docs/data-grid.json"),
    "docs/accordion": () => import("../../messages/en/docs/accordion.json"),
    "docs/switch": () => import("../../messages/en/docs/switch.json"),
    "docs/table": () => import("../../messages/en/docs/table.json"),
    "docs/thinking-indicator": () => import("../../messages/en/docs/thinking-indicator.json"),
    "docs/checkbox-group": () => import("../../messages/en/docs/checkbox-group.json"),
    "docs/checkbox": () => import("../../messages/en/docs/checkbox.json"),
    "docs/dialog": () => import("../../messages/en/docs/dialog.json"),
    "docs/badge": () => import("../../messages/en/docs/badge.json"),
    "docs/kbd": () => import("../../messages/en/docs/kbd.json"),
    "docs/input": () => import("../../messages/en/docs/input.json"),
    "docs/tooltip": () => import("../../messages/en/docs/tooltip.json"),
    "docs/input-copy": () => import("../../messages/en/docs/input-copy.json"),
    "docs/input-message": () => import("../../messages/en/docs/input-message.json"),
    "docs/data-table": () => import("../../messages/en/docs/data-table.json"),
    "docs/badge-overflow": () => import("../../messages/en/docs/badge-overflow.json"),
    "docs/radio-group": () => import("../../messages/en/docs/radio-group.json"),
    "docs/color-picker": () => import("../../messages/en/docs/color-picker.json"),
    "docs/popover": () => import("../../messages/en/docs/popover.json"),
    "docs/dropdown": () => import("../../messages/en/docs/dropdown.json"),
    "docs/breadcrumb": () => import("../../messages/en/docs/breadcrumb.json"),
    "docs/stepper": () => import("../../messages/en/docs/stepper.json"),
    "docs/chat-message": () => import("../../messages/en/docs/chat-message.json"),
    "docs/surfaces": () => import("../../messages/en/docs/surfaces.json"),
    "docs/motion": () => import("../../messages/en/docs/motion.json"),
    "docs/semantic-tokens": () => import("../../messages/en/docs/semantic-tokens.json"),
    "docs/scrollbars": () => import("../../messages/en/docs/scrollbars.json"),
    "docs/input-group": () => import("../../messages/en/docs/input-group.json"),
    "docs/info-item": () => import("../../messages/en/docs/info-item.json"),
    "docs/select": () => import("../../messages/en/docs/select.json"),
    "docs/slider": () => import("../../messages/en/docs/slider.json"),
    "docs/tabs": () => import("../../messages/en/docs/tabs.json"),
    "docs/card": () => import("../../messages/en/docs/card.json"),
    "docs/thinking-steps": () => import("../../messages/en/docs/thinking-steps.json"),
    "docs/ask-user-questions": () => import("../../messages/en/docs/ask-user-questions.json"),
  },
  "zh-CN": {
    home: () => import("../../messages/zh-CN/home.json"),
    "docs/introduction": () => import("../../messages/zh-CN/docs/introduction.json"),
    "docs/button": () => import("../../messages/zh-CN/docs/button.json"),
    "docs/data-grid": () => import("../../messages/zh-CN/docs/data-grid.json"),
    "docs/accordion": () => import("../../messages/zh-CN/docs/accordion.json"),
    "docs/switch": () => import("../../messages/zh-CN/docs/switch.json"),
    "docs/table": () => import("../../messages/zh-CN/docs/table.json"),
    "docs/thinking-indicator": () => import("../../messages/zh-CN/docs/thinking-indicator.json"),
    "docs/checkbox-group": () => import("../../messages/zh-CN/docs/checkbox-group.json"),
    "docs/checkbox": () => import("../../messages/zh-CN/docs/checkbox.json"),
    "docs/dialog": () => import("../../messages/zh-CN/docs/dialog.json"),
    "docs/badge": () => import("../../messages/zh-CN/docs/badge.json"),
    "docs/kbd": () => import("../../messages/zh-CN/docs/kbd.json"),
    "docs/input": () => import("../../messages/zh-CN/docs/input.json"),
    "docs/tooltip": () => import("../../messages/zh-CN/docs/tooltip.json"),
    "docs/input-copy": () => import("../../messages/zh-CN/docs/input-copy.json"),
    "docs/input-message": () => import("../../messages/zh-CN/docs/input-message.json"),
    "docs/data-table": () => import("../../messages/zh-CN/docs/data-table.json"),
    "docs/badge-overflow": () => import("../../messages/zh-CN/docs/badge-overflow.json"),
    "docs/radio-group": () => import("../../messages/zh-CN/docs/radio-group.json"),
    "docs/color-picker": () => import("../../messages/zh-CN/docs/color-picker.json"),
    "docs/popover": () => import("../../messages/zh-CN/docs/popover.json"),
    "docs/dropdown": () => import("../../messages/zh-CN/docs/dropdown.json"),
    "docs/breadcrumb": () => import("../../messages/zh-CN/docs/breadcrumb.json"),
    "docs/stepper": () => import("../../messages/zh-CN/docs/stepper.json"),
    "docs/chat-message": () => import("../../messages/zh-CN/docs/chat-message.json"),
    "docs/surfaces": () => import("../../messages/zh-CN/docs/surfaces.json"),
    "docs/motion": () => import("../../messages/zh-CN/docs/motion.json"),
    "docs/semantic-tokens": () => import("../../messages/zh-CN/docs/semantic-tokens.json"),
    "docs/scrollbars": () => import("../../messages/zh-CN/docs/scrollbars.json"),
    "docs/input-group": () => import("../../messages/zh-CN/docs/input-group.json"),
    "docs/info-item": () => import("../../messages/zh-CN/docs/info-item.json"),
    "docs/select": () => import("../../messages/zh-CN/docs/select.json"),
    "docs/slider": () => import("../../messages/zh-CN/docs/slider.json"),
    "docs/tabs": () => import("../../messages/zh-CN/docs/tabs.json"),
    "docs/card": () => import("../../messages/zh-CN/docs/card.json"),
    "docs/thinking-steps": () => import("../../messages/zh-CN/docs/thinking-steps.json"),
    "docs/ask-user-questions": () => import("../../messages/zh-CN/docs/ask-user-questions.json"),
  },
};

export async function loadPageMessages(locale: AppLocale, namespace: string) {
  const common = (await commonLoaders[locale]()).default;
  const page = pageLoaders[locale][namespace]
    ? (await pageLoaders[locale][namespace]()).default
    : {};
  const slug = namespace.startsWith("docs/") ? namespace.slice("docs/".length) : null;
  const fullCommon = (await (
    locale === "en"
      ? import("../../messages/en/common.json")
      : import("../../messages/zh-CN/common.json")
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

export async function PageMessages({
  locale,
  namespace,
  children,
}: {
  locale: AppLocale;
  namespace: string;
  children: React.ReactNode;
}) {
  const messages = await loadPageMessages(locale, namespace);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
