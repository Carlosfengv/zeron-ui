"use client";

import { Button } from "@zeron/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@zeron/ui/dialog";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import {
  Button, Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogFooter, DialogTitle,
  DialogDescription, DialogClose,
} from "./components";

<Dialog>
  <DialogTrigger render={<Button variant="tertiary">Open dialog</Button>} />
  <DialogContent size="sm">
    <DialogHeader>
      <DialogTitle>Create teamspace</DialogTitle>
      <DialogDescription>
        Add a new teamspace to organize your projects.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="ghost">Cancel</Button>} />
      <Button>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const largeCode = `<Dialog>
  <DialogTrigger render={<Button variant="ghost">Open large dialog</Button>} />
  <DialogContent size="lg">
    <DialogHeader>
      <DialogTitle>Confirm action</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="ghost">Cancel</Button>} />
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

export default function DialogDoc() {
  const t = useTranslations("dialog");
  const dialogContentProps: PropDef[] = [
    { name: "size", type: '"sm" | "lg"', default: '"sm"', description: t("size") },
    { name: "children", type: "ReactNode", description: t("children") },
  ];
  return (
    <DocPage
      title="Dialog"
      slug="dialog"
      description="Modal dialog with smooth enter/exit animations and overlay."
    >
      <DocSection title="Playground">
        <VariantPlayground
          minHeightClass="min-h-[180px]"
          variants={[
            {
              value: "small",
              label: "Small",
              code: basicCode,
              preview: <Dialog><DialogTrigger render={<Button variant="tertiary">Open small dialog</Button>} /><DialogContent size="sm"><DialogHeader><DialogTitle>Create teamspace</DialogTitle><DialogDescription>Add a new teamspace to organize your projects.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="ghost">Cancel</Button>} /><Button>Create</Button></DialogFooter></DialogContent></Dialog>,
            },
            {
              value: "large",
              label: "Large",
              code: largeCode,
              preview: <Dialog><DialogTrigger render={<Button variant="ghost">Open large dialog</Button>} /><DialogContent size="lg"><DialogHeader><DialogTitle>Confirm action</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="ghost">Cancel</Button>} /><Button>Confirm</Button></DialogFooter></DialogContent></Dialog>,
            },
          ]}
        />
      </DocSection>

      <DocSection title={t("small")}>
        <ComponentPreview code={basicCode}>
          <Dialog>
            <DialogTrigger render={<Button variant="tertiary">Open small dialog</Button>} />
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Create teamspace</DialogTitle>
                <DialogDescription>
                  Add a new teamspace to organize your projects and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost">Cancel</Button>} />
                <Button>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("large")}>
        <ComponentPreview code={largeCode}>
          <Dialog>
            <DialogTrigger render={<Button variant="ghost">Open large dialog</Button>} />
            <DialogContent size="lg">
              <DialogHeader>
                <DialogTitle>Confirm action</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Are you sure you want to continue?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost">Cancel</Button>} />
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — DialogContent`}>
        <PropsTable props={dialogContentProps} />
      </DocSection>
    </DocPage>
  );
}
