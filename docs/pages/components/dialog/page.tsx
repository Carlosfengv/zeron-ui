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

const dismissalCode = `<Dialog
  disablePointerDismissal
  onOpenChange={(open, eventDetails) => {
    if (!open) console.info(eventDetails.reason);
  }}
>
  <DialogTrigger render={<Button variant="tertiary">Open settings</Button>} />
  <DialogContent showCloseButton={false}>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="ghost">Close settings</Button>} />
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const placementCode = `<Dialog>
  <DialogTrigger render={<Button variant="tertiary">Open side panel</Button>} />
  <DialogContent placement="right" backdropClassName="backdrop-blur-none">
    <DialogHeader>
      <DialogTitle>Side panel</DialogTitle>
      <DialogDescription>Position the dialog at an edge and customize its backdrop.</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`;

const bottomPlacementCode = `<Dialog>
  <DialogTrigger render={<Button variant="tertiary">Open bottom panel</Button>} />
  <DialogContent placement="bottom">
    <DialogHeader>
      <DialogTitle>Bottom panel</DialogTitle>
      <DialogDescription>Use bottom placement for a compact action surface.</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`;

const nestedCode = `<Dialog>
  <DialogTrigger render={<Button>Open parent dialog</Button>} />
  <DialogContent size="lg">
    <DialogTitle>Parent dialog</DialogTitle>
    <Dialog disablePointerDismissal>
      <DialogTrigger render={<Button>Open child dialog</Button>} />
      <DialogContent nestedBackdrop backdropClassName="backdrop-blur-none">
        <DialogTitle>Child dialog</DialogTitle>
        <DialogDescription>Escape closes only this dialog and returns focus to its trigger.</DialogDescription>
      </DialogContent>
    </Dialog>
  </DialogContent>
</Dialog>`;

export default function DialogDoc() {
  const t = useTranslations("dialog");
  const dialogProps: PropDef[] = [
    { name: "open", type: "boolean", description: t("open") },
    { name: "defaultOpen", type: "boolean", default: "false", description: t("defaultOpen") },
    { name: "onOpenChange", type: "(open: boolean, eventDetails: DialogChangeEventDetails) => void", description: t("onOpenChange") },
    { name: "disablePointerDismissal", type: "boolean", default: "false", description: t("disablePointerDismissal") },
    { name: "modal", type: "boolean", default: "true", description: t("modal") },
    { name: "children", type: "ReactNode", description: t("children") },
  ];
  const dialogContentProps: PropDef[] = [
    { name: "size", type: '"sm" | "lg"', default: '"sm"', description: t("size") },
    { name: "placement", type: '"center" | "left" | "right" | "top" | "bottom"', default: '"center"', description: t("placement") },
    { name: "backdropClassName", type: "string", description: t("backdropClassName") },
    { name: "backdropStyle", type: "CSSProperties", description: t("backdropStyle") },
    { name: "nestedBackdrop", type: "boolean", default: "false", description: t("nestedBackdrop") },
    { name: "showCloseButton", type: "boolean", default: "true", description: t("showCloseButton") },
    { name: "closeButtonLabel", type: "string", default: '"Close"', description: t("closeButtonLabel") },
    { name: "closeButtonDisabled", type: "boolean", default: "false", description: t("closeButtonDisabled") },
    { name: "container", type: "HTMLElement | null", description: t("container") },
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

      <DocSection title={t("dismissalAndCloseButton")}>
        <ComponentPreview code={dismissalCode}>
          <Dialog
            disablePointerDismissal
            onOpenChange={(open, eventDetails) => {
              if (!open) console.info(eventDetails.reason);
            }}
          >
            <DialogTrigger render={<Button variant="tertiary">Open settings</Button>} />
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost">Close settings</Button>} />
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("placementAndBackdrop")}>
        <ComponentPreview code={placementCode}>
          <Dialog>
            <DialogTrigger render={<Button variant="tertiary">Open side panel</Button>} />
            <DialogContent placement="right" backdropClassName="backdrop-blur-none">
              <DialogHeader>
                <DialogTitle>Side panel</DialogTitle>
                <DialogDescription>
                  Position the dialog at an edge and customize its backdrop.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
        <ComponentPreview code={bottomPlacementCode}>
          <Dialog>
            <DialogTrigger render={<Button variant="tertiary">Open bottom panel</Button>} />
            <DialogContent placement="bottom">
              <DialogHeader>
                <DialogTitle>Bottom panel</DialogTitle>
                <DialogDescription>
                  Use bottom placement for a compact action surface.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("nestedDialogs")}>
        <p>{t("nestedBackdropDescription")}</p>
        <ComponentPreview code={nestedCode}>
          <Dialog>
            <DialogTrigger render={<Button>{t("openParentDialog")}</Button>} />
            <DialogContent size="lg">
              <DialogTitle>{t("parentDialog")}</DialogTitle>
              <Dialog disablePointerDismissal>
                <DialogTrigger render={<Button>{t("openChildDialog")}</Button>} />
                <DialogContent nestedBackdrop backdropClassName="backdrop-blur-none">
                  <DialogTitle>{t("childDialog")}</DialogTitle>
                  <DialogDescription>{t("nestedDialogHint")}</DialogDescription>
                </DialogContent>
              </Dialog>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title={`${t("apiReference")} — Dialog`}>
        <PropsTable props={dialogProps} />
      </DocSection>

      <DocSection title={`${t("apiReference")} — DialogContent`}>
        <PropsTable props={dialogContentProps} />
      </DocSection>
    </DocPage>
  );
}
