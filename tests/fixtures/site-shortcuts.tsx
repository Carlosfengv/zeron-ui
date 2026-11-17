import { createRoot } from "react-dom/client";
import { defaultIcons, IconProvider, useIconContext } from "@zeron/icons/context";
import { ThemeProvider } from "@zeron/ui/system/theme-context";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { SiteShortcuts } from "@docs/components/shell/site/site-shortcuts";

const choices = ["Archive", "Drafts", "Inbox"];

function ShortcutPreview() {
  const { variant } = useIconContext();
  return (
    <main>
      <SiteShortcuts />
      <output aria-label="Icon style">{variant}</output>
      <Select defaultValue="Archive">
        <SelectTrigger aria-label="Folder" />
        <SelectContent animated={false}>
          {choices.map((label) => <SelectItem key={label} value={label}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownTrigger>Open folder menu</DropdownTrigger>
        <DropdownContent>
          {choices.map((label, index) => <MenuItem key={label} index={index} label={label} />)}
        </DropdownContent>
      </DropdownMenu>
      <input aria-label="Text input" />
      <div contentEditable role="textbox" aria-label="Editable text" />
    </main>
  );
}

createRoot(document.body).render(
  <ThemeProvider defaultTheme="light">
    <IconProvider availableVariants={["stroke-rounded", "stroke-standard"]} loadVariant={async () => defaultIcons}>
      <ShortcutPreview />
    </IconProvider>
  </ThemeProvider>,
);
