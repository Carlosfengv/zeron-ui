import { ScrollArea } from "@zeron/ui/scroll-area";
import { useTranslations } from "next-intl";

export interface PropDef {
  name: string;
  type: string;
  default?: string;
  description: string;
}

interface PropsTableProps {
  props: PropDef[];
}

export function PropsTable({ props }: PropsTableProps) {
  const t = useTranslations("propsTable");
  // Horizontal ScrollArea gives narrow viewports the shape-system scrollbar +
  // a scroll-fade-x edge; min-w keeps columns legible before it scrolls.
  // Drop the Default column when nothing has a default (e.g. token references,
  // or a table where every prop is required) — an all-"—" column is noise.
  const showDefault = props.some((prop) => prop.default !== undefined);

  return (
    <ScrollArea
      orientation="horizontal"
      viewportClassName="scroll-fade-x"
      className="w-full"
    >
      <table className="w-full min-w-[520px] text-label border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th
              className="px-3 py-2 text-left text-fg-default font-semibold"
            >
              {t("prop")}
            </th>
            <th
              className="px-3 py-2 text-left text-fg-default font-semibold"
            >
              {t("type")}
            </th>
            {showDefault && (
              <th
                className="px-3 py-2 text-left text-fg-default font-semibold"
              >
                {t("default")}
              </th>
            )}
            <th
              className="px-3 py-2 text-left text-fg-default font-semibold"
            >
              {t("description")}
            </th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-border/40">
              <td className="px-3 py-2 text-fg-default font-mono text-label">
                {prop.name}
              </td>
              <td className="px-3 py-2 text-fg-muted font-mono text-label">
                {prop.type}
              </td>
              {showDefault && (
                <td className="px-3 py-2 text-fg-muted font-mono text-label">
                  {prop.default ?? "—"}
                </td>
              )}
              <td className="px-3 py-2 text-fg-muted">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}
