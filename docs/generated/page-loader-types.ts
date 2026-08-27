import "server-only";

import type { ComponentType } from "react";

export type DocPageModule = { default: ComponentType };
export type DocPageLoader = () => Promise<DocPageModule>;
