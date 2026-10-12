"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileType, fileTypeFamilies,
  type FileTypeSize, type FileTypeVariant,
} from "@zeron/ui/file-type";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import {
  InfoItem, InfoItemContent, InfoItemDescription, InfoItemGroup,
  InfoItemTitle, InfoItemTrailing, InfoItemValue,
} from "@zeron/ui/info-item";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@zeron/ui/table";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";

const variants = ["outline", "solid", "light", "mono"] as const;
const sizes: { size: FileTypeSize; pixels: number }[] = [
  { size: "mini", pixels: 18 }, { size: "xs", pixels: 24 },
  { size: "sm", pixels: 32 }, { size: "default", pixels: 40 },
  { size: "lg", pixels: 48 }, { size: "xl", pixels: 56 },
];
const families = Object.entries(fileTypeFamilies);
const extensionCount = families.reduce((count, [, extensions]) => count + extensions.length, 0);
const demoFiles = [
  { fileName: "Quarterly report.pdf", type: "PDF", size: "2.4 MB", description: "report" },
  { fileName: "Revenue forecast.xlsx", type: "XLSX", size: "864 KB", description: "spreadsheet" },
  { fileName: "Product mockups.fig", type: "FIG", size: "8.6 MB", description: "design" },
  { fileName: "Brand assets.zip", type: "ZIP", size: "12.8 MB", description: "archive" },
  { fileName: "Project notes.md", type: "MD", size: "18 KB", description: "notes" },
] as const;

const infoItemCode = `import { FileType } from "@zeron/ui/file-type";
import {
  InfoItem, InfoItemContent, InfoItemDescription, InfoItemGroup,
  InfoItemTitle, InfoItemTrailing, InfoItemValue,
} from "@zeron/ui/info-item";

<InfoItemGroup className="w-full max-w-lg">
  <InfoItem>
    <FileType fileName="Quarterly report.pdf" size="sm" aria-hidden="true" />
    <InfoItemContent>
      <InfoItemTitle className="truncate" title="Quarterly report.pdf">
        Quarterly report.pdf
      </InfoItemTitle>
      <InfoItemDescription>PDF document</InfoItemDescription>
    </InfoItemContent>
    <InfoItemTrailing>
      <InfoItemValue>2.4 MB</InfoItemValue>
    </InfoItemTrailing>
  </InfoItem>
</InfoItemGroup>`;

const tableCode = `import { FileType } from "@zeron/ui/file-type";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@zeron/ui/table";

const files = ${JSON.stringify(demoFiles.map(({ fileName, type, size }) => ({ fileName, type, size })), null, 2)};

<Table className="table-fixed" aria-label="File table">
  <TableHeader>
    <TableRow>
      <TableHead scope="col">File name</TableHead>
      <TableHead scope="col" className="w-16">Type</TableHead>
      <TableHead scope="col" className="w-24 text-right">Size</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {files.map((file, index) => (
      <TableRow key={file.fileName} index={index}>
        <TableCell>
          <div className="flex min-w-0 items-center gap-2">
            <FileType fileName={file.fileName} size="mini" aria-hidden="true" />
            <span className="truncate" title={file.fileName}>{file.fileName}</span>
          </div>
        </TableCell>
        <TableCell>{file.type}</TableCell>
        <TableCell className="whitespace-nowrap text-right tabular-nums">
          {file.size}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`;

const sizesCode = `import { FileType } from "@zeron/ui/file-type";

<FileType extension="pdf" size="mini" />    {/* 18px */}
<FileType extension="pdf" size="xs" />      {/* 24px */}
<FileType extension="pdf" size="sm" />      {/* 32px */}
<FileType extension="pdf" />                {/* 40px */}
<FileType extension="pdf" size="lg" />      {/* 48px */}
<FileType extension="pdf" size="xl" />      {/* 56px */}`;

const detectionCode = `import { FileType } from "@zeron/ui/file-type";

<FileType fileName="Quarterly report.PDF" />
<FileType fileName="data.csv" />
<FileType fileName="archive.tar.gz" />
<FileType fileName="README" />
<FileType fileName="invoice#final.pdf" />
<FileType fileName="budget?approved.xlsx" />
<FileType extension="safetensors" />

{/* Use a decorative icon next to the file name. */}
<div className="flex items-center gap-3">
  <FileType fileName="Quarterly report.pdf" aria-hidden="true" />
  <span>Quarterly report.pdf</span>
</div>`;

export default function FileTypeDoc() {
  const t = useTranslations("fileType");
  const [variant, setVariant] = useState<FileTypeVariant>("outline");
  const props: PropDef[] = [
    { name: "extension", type: "string", description: t("extension") },
    { name: "fileName", type: "string", description: t("fileName") },
    { name: "variant", type: '"outline" | "solid" | "light" | "mono"', default: '"outline"', description: t("variant") },
    { name: "size", type: '"mini" | "xs" | "sm" | "default" | "lg" | "xl"', default: '"default"', description: t("size") },
    { name: "aria-label", type: "string", description: t("ariaLabel") },
    { name: "aria-hidden", type: "boolean", default: "false", description: t("ariaHidden") },
    { name: "className", type: "string", description: t("className") },
    { name: "ref", type: "Ref<SVGSVGElement>", description: t("ref") },
  ];

  return (
    <DocPage title="File Type" slug="file-type" description={t("description")}>
      <DocSection title="Playground">
        <VariantPlayground
          variants={variants.map((value) => ({
            value,
            label: t(value),
            code: `import { FileType } from "@zeron/ui/file-type";\n\n${["pdf", "docx", "xlsx", "png", "mp3", "fig"].map((extension) => `<FileType extension="${extension}" variant="${value}" />`).join("\n")}`,
            preview: (
              <div className="flex flex-wrap items-center gap-6">
                {["pdf", "docx", "xlsx", "png", "mp3", "fig"].map((extension) => (
                  <FileType key={extension} extension={extension} variant={value} />
                ))}
              </div>
            ),
          }))}
        />
      </DocSection>

      <DocSection title={t("sizes")}>
        <ComponentPreview code={sizesCode}>
          <div className="flex flex-wrap items-end justify-center gap-6 sm:gap-8">
            {sizes.map(({ size, pixels }) => (
              <div key={size} className="flex w-14 flex-col items-center gap-3">
                <FileType extension="pdf" size={size} />
                <div className="text-center text-body">
                  <div className="font-medium">{size}</div>
                  <div className="text-fg-muted">{pixels}px</div>
                </div>
              </div>
            ))}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("catalog")}>
        <ComponentPreview
          code={`import { FileType } from "@zeron/ui/file-type";\n\n<FileType extension="pdf" variant="${variant}" />\n<FileType extension="xlsx" variant="${variant}" />\n<FileType extension="fig" variant="${variant}" />`}
          padding="compact"
          preservePreview
        >
          <Tabs
            value={variant}
            onValueChange={(value) => setVariant(value as FileTypeVariant)}
            variant="segment"
            color="default"
            className="w-full"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <TabsList aria-label={t("variantSelector")}>
                {variants.map((value) => <TabItem key={value} value={value} label={t(value)} />)}
              </TabsList>
              <span className="text-label text-fg-muted">
                {t("count", { extensions: extensionCount, families: families.length })}
              </span>
            </div>
            {variants.map((value) => (
              <TabPanel key={value} value={value}>
                <div className="flex flex-col">
                  {families.map(([family, extensions]) => (
                    <div key={family} className="grid grid-cols-1 gap-4 border-b-hairline border-border py-5 last:border-0 sm:grid-cols-[10rem_1fr] sm:items-center">
                      <div className="flex items-center gap-2 text-body">
                        <span className="font-medium">{t(`families.${family}`)}</span>
                        <span className="text-label text-fg-subtle">{extensions.length}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        {extensions.map((extension) => (
                          <FileType key={extension} extension={extension} variant={value} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabPanel>
            ))}
          </Tabs>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("detection")}>
        <ComponentPreview code={detectionCode}>
          <div className="flex w-full flex-col gap-4">
            {["Quarterly report.PDF", "data.csv", "archive.tar.gz", "README", "invoice#final.pdf", "budget?approved.xlsx", "model.safetensors"].map((fileName) => (
              <div key={fileName} className="flex min-w-0 items-center gap-3">
                <FileType fileName={fileName} aria-hidden="true" />
                <span className="truncate text-body">{fileName}</span>
              </div>
            ))}
          </div>
        </ComponentPreview>
        <p className="text-body text-fg-muted">{t("fallbackNote")}</p>
      </DocSection>

      <DocSection title={t("infoItemDemo")}>
        <p className="text-body text-fg-muted">{t("infoItemDemoDescription")}</p>
        <ComponentPreview code={infoItemCode} padding="compact">
          <InfoItemGroup className="w-full max-w-lg">
            {demoFiles.slice(0, 3).map((file) => (
              <InfoItem key={file.fileName}>
                <FileType fileName={file.fileName} size="sm" aria-hidden="true" />
                <InfoItemContent>
                  <InfoItemTitle className="truncate" title={file.fileName}>
                    {file.fileName}
                  </InfoItemTitle>
                  <InfoItemDescription>{t(`demoDescriptions.${file.description}`)}</InfoItemDescription>
                </InfoItemContent>
                <InfoItemTrailing>
                  <InfoItemValue>{file.size}</InfoItemValue>
                </InfoItemTrailing>
              </InfoItem>
            ))}
          </InfoItemGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("tableDemo")}>
        <p className="text-body text-fg-muted">{t("tableDemoDescription")}</p>
        <ComponentPreview code={tableCode} padding="none">
          <div className="w-full">
            <Table className="table-fixed" aria-label={t("tableDemo")}>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{t("fileNameColumn")}</TableHead>
                  <TableHead scope="col" className="w-16">{t("typeColumn")}</TableHead>
                  <TableHead scope="col" className="w-24 text-right">{t("sizeColumn")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoFiles.map((file, index) => (
                  <TableRow key={file.fileName} index={index}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2">
                        <FileType fileName={file.fileName} size="mini" aria-hidden="true" />
                        <span className="truncate" title={file.fileName}>{file.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {file.size}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={props} />
        <p className="text-body text-fg-muted">{t("helpers")}</p>
      </DocSection>
    </DocPage>
  );
}
