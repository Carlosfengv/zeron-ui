import type { Metadata } from "next";
import { WorkflowEditor } from "./_components/workflow-editor";

export const metadata: Metadata = {
  title: "工作流编辑器 · Zeron",
  description: "使用 Zeron 组件与主题变量构建的独立工作流编辑器。",
};

export default function WorkflowPage() {
  return <WorkflowEditor />;
}
