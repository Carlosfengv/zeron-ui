import "server-only";

import type { ComponentType } from "react";
import type { AppLocale } from "@/app/_i18n/routing";

export type DocPageModule = { default: ComponentType<{ locale: AppLocale }> };
export type DocPageLoader = () => Promise<DocPageModule>;
