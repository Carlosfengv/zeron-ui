import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";

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

const dialogContentProps: PropDef[] = [
  { name: "size", type: '"sm" | "lg"', default: '"sm"', description: "Width of the dialog." },
  { name: "children", type: "ReactNode", description: "Content inside the dialog." },
];

export default function DialogDoc() {
  return (
    <DocPage
      title="Dialog"
      slug="dialog"
      description="Modal dialog with smooth enter/exit animations and overlay."
    >
      <DocSection title="Small Dialog">
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

      <DocSection title="Large Dialog">
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

      <DocSection title="API Reference — DialogContent">
        <PropsTable props={dialogContentProps} />
      </DocSection>
    </DocPage>
  );
}
