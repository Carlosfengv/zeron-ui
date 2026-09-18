# shadcn-style and locally modified React sources

This is a semantic mapping guide, not a universal codemod or version guarantee. Inspect the old implementation and the installed Zeron source. Same filenames and theme compatibility do not imply API compatibility.

| Family | Mapping obligations |
| --- | --- |
| Button | Choose target variant by hierarchy; Zeron uses primary/neutral/secondary/tertiary/ghost/link/destructive. Sizes use xs/sm/md/lg/xl and iconOnly. Preserve type, loading and accessible name. Check asChild support per component rather than assuming it everywhere. |
| Input/Textarea/Field | Preserve id/name/ref, controlled values, label association and error descriptions. Keep the existing form library; use public field/control APIs. |
| Checkbox/Switch | Check value vs checked, indeterminate handling and callback signatures. Zeron Switch needs label; onCheckedChange receives a boolean. |
| Select/Combobox | Select is a string-valued compound root/trigger/content/items. Size belongs on the root. Evaluate Combobox for multiple/remote values; verify its actual API. Preserve serialized IDs and required/name. |
| Dialog/Popover/Dropdown | Rebuild only the required compound structure, preserve controlled open and event semantics, verify trigger composition, nested overlays, portal theme and focus recovery. |
| Tabs | Preserve value/route synchronization and mounted panel state. Inspect target exports and defaults. |
| Table/DataTable | Preserve record IDs, server/client mode, sort/filter query semantics, selection, pagination, loading/error states. Do not replace a backend with demo arrays. |
| Tooltip/Toast | Inspect provider and imperative/controlled APIs; maintain lifecycle, dismissal, accessibility and error messages. |
| AppShell/PageLayout/Sidebar/TopNav | Migrate layout implementation once while keeping routes, permissions and navigation state. Verify direct rendered children and scroll owner. |

For every family record the exact exported types used and at least one behavior check. Existing custom props should become explicit project adapters if they represent domain behavior; never drop them silently. Remove old CSS overrides only after their intended states are accounted for.
