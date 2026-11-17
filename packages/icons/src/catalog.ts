import { defaultIcons, type IconName } from "./icon-context";

/** Generated from the actual free provider keys, so docs never own a second name list. */
export const iconCatalog = Object.keys(defaultIcons).sort() as IconName[];
