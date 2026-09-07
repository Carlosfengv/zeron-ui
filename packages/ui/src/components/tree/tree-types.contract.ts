import type { FileTreeProps } from "../file-tree";
import type { MemberTreeProps } from "../member-tree";
import type { TreeProps } from "./tree-types";

const genericSingle: TreeProps<{ id: string }> = {
  "aria-label": "Choose one",
  items: [{ key: "one", label: "One", data: { id: "one" } }],
  selectionMode: "single",
  onSelectionChange: (_keys, details) => {
    const entityId: string | undefined = details.selectedNodes[0]?.data?.id;
    void entityId;
  },
};
void genericSingle;

// @ts-expect-error Checkbox selection is a multiple-selection affordance.
const invalidGeneric: TreeProps = { "aria-label": "Invalid", items: [], selectionMode: "single", selectionIndicator: "checkbox" };
void invalidGeneric;

const memberDefault: MemberTreeProps = { "aria-label": "Members", items: [] };
void memberDefault;

// @ts-expect-error Department entity selection cannot use member cascade semantics.
const invalidMemberCascade: MemberTreeProps = { "aria-label": "Members", items: [], selectionMode: "multiple", selectionIndicator: "checkbox", checkStrategy: "cascade", selectableTypes: ["department"] };
void invalidMemberCascade;

const fileDefault: FileTreeProps = { "aria-label": "Files", items: [] };
void fileDefault;

// @ts-expect-error Folder entity selection cannot use file cascade semantics.
const invalidFileCascade: FileTreeProps = { "aria-label": "Files", items: [], selectionMode: "multiple", selectionIndicator: "checkbox", checkStrategy: "cascade", selectableTypes: ["folder"] };
void invalidFileCascade;
