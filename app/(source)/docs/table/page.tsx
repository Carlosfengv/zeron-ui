import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "./components";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Role</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow index={0}>
      <TableCell>Alice</TableCell>
      <TableCell>Engineer</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
    <TableRow index={1}>
      <TableCell>Bob</TableCell>
      <TableCell>Designer</TableCell>
      <TableCell>Away</TableCell>
    </TableRow>
    <TableRow index={2}>
      <TableCell>Carol</TableCell>
      <TableCell>Manager</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

export default function TableDoc() {
  const t = useTranslations("tableDoc");
  const tableProps: PropDef[] = [
    { name: "children", type: "ReactNode", description: t("tableChildren") },
  ];
  const rowProps: PropDef[] = [
    { name: "index", type: "number", description: t("rowIndex") },
    { name: "children", type: "ReactNode", description: t("rowChildren") },
  ];
  return (
    <DocPage
      title="Table"
      slug="table"
      description="Data table with row hover effects and semantic markup."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow index={0}>
                  <TableCell>Alice</TableCell>
                  <TableCell>Engineer</TableCell>
                  <TableCell>Active</TableCell>
                </TableRow>
                <TableRow index={1}>
                  <TableCell>Bob</TableCell>
                  <TableCell>Designer</TableCell>
                  <TableCell>Away</TableCell>
                </TableRow>
                <TableRow index={2}>
                  <TableCell>Carol</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Active</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — Table`}>
        <PropsTable props={tableProps} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — TableRow`}>
        <PropsTable props={rowProps} />
      </DocSection>
    </DocPage>
  );
}
