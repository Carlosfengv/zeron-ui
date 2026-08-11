import { ScrollArea } from "@/components/ui/scroll-area";

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
      <table className="w-full min-w-[520px] text-[13px] border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th
              className="px-3 py-2 text-left text-foreground font-semibold"
            >
              Prop
            </th>
            <th
              className="px-3 py-2 text-left text-foreground font-semibold"
            >
              Type
            </th>
            {showDefault && (
              <th
                className="px-3 py-2 text-left text-foreground font-semibold"
              >
                Default
              </th>
            )}
            <th
              className="px-3 py-2 text-left text-foreground font-semibold"
            >
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-border/40">
              <td className="px-3 py-2 text-foreground font-mono text-[12px]">
                {prop.name}
              </td>
              <td className="px-3 py-2 text-muted-foreground font-mono text-[12px]">
                {prop.type}
              </td>
              {showDefault && (
                <td className="px-3 py-2 text-muted-foreground font-mono text-[12px]">
                  {prop.default ?? "—"}
                </td>
              )}
              <td className="px-3 py-2 text-muted-foreground">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}
