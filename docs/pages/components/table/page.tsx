import {
  Table,
  TableHeader,
  TableBody,
  TableSkeletonBody,
  TableRow,
  TableHead,
  TableCell,
} from "@zeron/ui/table";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
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

const loadingCode = `import {
  Table, TableHeader, TableSkeletonBody,
  TableRow, TableHead,
} from "@zeron/ui/table";

<div>
  <span aria-atomic="true" className="sr-only" role="status">
    Loading table data
  </span>
  <Table aria-busy="true">
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableSkeletonBody columns={3} rows={5} />
  </Table>
</div>`;

export default function TableDoc() {
  const t = useTranslations("tableDoc");
  const tableProps: PropDef[] = [
    { name: "children", type: "ReactNode", description: t("tableChildren") },
  ];
  const rowProps: PropDef[] = [
    { name: "index", type: "number", description: t("rowIndex") },
    { name: "children", type: "ReactNode", description: t("rowChildren") },
  ];
  const skeletonBodyProps: PropDef[] = [
    { name: "columns", type: "number", description: t("skeletonColumns") },
    { name: "rows", type: "number", default: "5", description: t("skeletonRows") },
    { name: "cellClassName", type: "string", description: t("skeletonCellClassName") },
    { name: "getCellProps", type: "(rowIndex, columnIndex) => td props", description: t("skeletonGetCellProps") },
    { name: "renderCell", type: "(rowIndex, columnIndex) => ReactNode", description: t("skeletonRenderCell") },
  ];
  return (
    <DocPage
      title="Table"
      slug="table"
      description="Data table with row hover effects and semantic markup."
    >
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "directory",
              label: "Directory",
              code: basicCode,
              preview: <div className="w-full"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody><TableRow index={0}><TableCell>Alice</TableCell><TableCell>Engineer</TableCell><TableCell>Active</TableCell></TableRow><TableRow index={1}><TableCell>Bob</TableCell><TableCell>Designer</TableCell><TableCell>Away</TableCell></TableRow></TableBody></Table></div>,
            },
            {
              value: "compact",
              label: "Compact",
              code: `<Table><TableHeader><TableRow><TableHead>Environment</TableHead><TableHead>State</TableHead></TableRow></TableHeader><TableBody><TableRow index={0}><TableCell>Production</TableCell><TableCell>Healthy</TableCell></TableRow></TableBody></Table>`,
              preview: <div className="w-full max-w-md"><Table><TableHeader><TableRow><TableHead>Environment</TableHead><TableHead>State</TableHead></TableRow></TableHeader><TableBody><TableRow index={0}><TableCell>Production</TableCell><TableCell>Healthy</TableCell></TableRow></TableBody></Table></div>,
            },
          ]}
        />
      </DocSection>

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

      <DocSection title={t("loading")}>
        <p className="mb-3 max-w-3xl text-body leading-6 text-fg-muted">
          {t("loadingDescription")}
        </p>
        <ComponentPreview code={loadingCode}>
          <div className="w-full">
            <span aria-atomic="true" className="sr-only" role="status">
              {t("loadingMessage")}
            </span>
            <Table aria-busy="true">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableSkeletonBody columns={3} rows={5} />
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

      <DocSection title={`${t("apiReference")} — TableSkeletonBody`}>
        <PropsTable props={skeletonBodyProps} />
      </DocSection>
    </DocPage>
  );
}
