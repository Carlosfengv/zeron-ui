import ArrowDown04Icon from "@hugeicons/core-free-icons/ArrowDown04Icon";
import ArrowUp04Icon from "@hugeicons/core-free-icons/ArrowUp04Icon";
import { createHugeIcon } from "@zeron/ui/system/huge-icon";

// Reordering uses full arrows so it stays distinct from the node's disclosure triangle.
export const WorkflowMoveUpIcon = createHugeIcon(ArrowUp04Icon, { adjustableStrokeWidth: false });
export const WorkflowMoveDownIcon = createHugeIcon(ArrowDown04Icon, { adjustableStrokeWidth: false });
