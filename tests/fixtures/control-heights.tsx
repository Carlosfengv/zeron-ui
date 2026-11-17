import { createRoot } from "react-dom/client";
import { Button } from "@zeron/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";

const richLabel = (
  <>
    <span className="block">First line</span>
    <span className="block">Second line</span>
    <span className="block">Third line</span>
  </>
);

createRoot(document.getElementById("root")!).render(
  <main className="flex flex-col items-start gap-3 p-4">
    <Button>Fixed button</Button>
    <Button aria-label="Content button" contentSized>{richLabel}</Button>
    <Button size="xs" contentSized className="min-h-0">Short button</Button>
    <Button asChild size="xl" variant="link"><a href="#destination">Link button</a></Button>
    <Select defaultValue="standard">
      <SelectTrigger aria-label="Fixed select" />
      <SelectContent><SelectItem value="standard">Standard option</SelectItem></SelectContent>
    </Select>
    <Select defaultValue="rich">
      <SelectTrigger aria-label="Content select" contentSized />
      <SelectContent><SelectItem value="rich" label={richLabel}>{richLabel}</SelectItem></SelectContent>
    </Select>
  </main>,
);
