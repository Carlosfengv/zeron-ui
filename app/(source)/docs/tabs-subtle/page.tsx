import { redirect } from "next/navigation";

/** Legacy route retained for existing links. TabsSubtle is now Tabs' segment variant. */
export default function TabsSubtleDoc() {
  redirect("/docs/tabs");
}
