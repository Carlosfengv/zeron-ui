import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";

const basicCode = `import { Kbd } from "./components";

<Kbd>K</Kbd>`;

const groupsCode = `import { Kbd, KbdGroup } from "./components";

<KbdGroup aria-label="Command K">
  <Kbd aria-label="Command">⌘</Kbd>
  <Kbd>K</Kbd>
</KbdGroup>

<KbdGroup aria-label="Control Shift P">
  <Kbd>Ctrl</Kbd>
  <Kbd>Shift</Kbd>
  <Kbd>P</Kbd>
</KbdGroup>`;

const contextCode = `<div className="flex items-center justify-between">
  <span>Open command palette</span>
  <KbdGroup aria-label="Command K">
    <Kbd aria-label="Command">⌘</Kbd>
    <Kbd>K</Kbd>
  </KbdGroup>
</div>`;

const symbolsCode = `<Kbd>↵</Kbd>
<Kbd>⌫</Kbd>
<Kbd>Esc</Kbd>
<Kbd>↑</Kbd>
<Kbd>↓</Kbd>`;

const kbdProps: PropDef[] = [
  {
    name: "children",
    type: "ReactNode",
    description: "Key label, symbol, or short key name.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the keycap.",
  },
];

const groupProps: PropDef[] = [
  {
    name: "children",
    type: "ReactNode",
    description: "Two or more Kbd elements forming one shortcut.",
  },
  {
    name: "className",
    type: "string",
    description: "Additional classes applied to the shortcut group.",
  },
];

export default function KbdDoc() {
  return (
    <DocPage
      title="Kbd"
      slug="kbd"
      description="Compact keycaps for keyboard shortcuts, commands, and interaction hints."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <Kbd>K</Kbd>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Shortcut Groups">
        <ComponentPreview code={groupsCode}>
          <div className="flex flex-wrap items-center gap-4">
            <KbdGroup aria-label="Command K">
              <Kbd aria-label="Command">⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
            <KbdGroup aria-label="Control Shift P">
              <Kbd>Ctrl</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>P</Kbd>
            </KbdGroup>
            <KbdGroup aria-label="Option Enter">
              <Kbd aria-label="Option">⌥</Kbd>
              <Kbd aria-label="Enter">↵</Kbd>
            </KbdGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="In Context">
        <ComponentPreview code={contextCode}>
          <div className="flex w-80 max-w-full items-center justify-between gap-6 border border-border/60 bg-muted/30 px-3 py-2 rounded-xl">
            <span className="text-body-sm text-foreground">Open command palette</span>
            <KbdGroup aria-label="Command K">
              <Kbd aria-label="Command">⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Symbols">
        <ComponentPreview code={symbolsCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Kbd aria-label="Enter">↵</Kbd>
            <Kbd aria-label="Backspace">⌫</Kbd>
            <Kbd>Esc</Kbd>
            <Kbd aria-label="Arrow up">↑</Kbd>
            <Kbd aria-label="Arrow down">↓</Kbd>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">Kbd</h3>
            <PropsTable props={kbdProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">KbdGroup</h3>
            <PropsTable props={groupProps} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
