import { createContext, useContext, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@zeron/ui/select";

const TabOrder = createContext(["A", "B", "C"]);

function OrderControls({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState(["A", "B", "C"]);
  return <TabOrder.Provider value={order}>
    <div className="flex gap-2">
      <button type="button" onClick={() => setOrder(["C", "A", "B"])}>Reorder</button>
      <button type="button" onClick={() => setOrder(current => current.filter(tab => tab !== current[0]))}>Remove first</button>
      <button type="button" onClick={() => setOrder(current => ["D", ...current])}>Insert D</button>
      <button type="button" onClick={() => setOrder(["A", "B", "C"])}>Restore</button>
    </div>
    {children}
  </TabOrder.Provider>;
}

function WrappedTabs() {
  const order = useContext(TabOrder);
  return <>
    {order.map(value => <div className="relative" key={value}>
      <>{value && <TabItem value={value} label={value === "B" ? "B, longer label" : value} />}</>
    </div>)}
  </>;
}

function TabsFixture({ mode }: { mode: "index" | "value" | "uncontrolled" }) {
  const [requestedValue, setRequestedValue] = useState("");
  const [requestedIndex, setRequestedIndex] = useState<number>();
  return <section aria-label={`${mode} tabs`}>
    <OrderControls>
      <Tabs
        selectedIndex={mode === "index" ? 0 : undefined}
        value={mode === "value" ? "A" : undefined}
        onValueChange={setRequestedValue}
        onSelect={setRequestedIndex}
      >
        <TabsList activationMode={mode === "value" ? "manual" : "automatic"}>
          <WrappedTabs />
        </TabsList>
        {["A", "B", "C", "D"].map(value => <TabPanel key={value} value={value}>{`Panel ${value}`}</TabPanel>)}
      </Tabs>
      <output aria-label="Requested tab">{requestedValue}:{requestedIndex}</output>
    </OrderControls>
  </section>;
}

const alpha = { value: "a", label: <strong>Alpha rich</strong>, text: "Alpha" };
const beta = { value: "b", label: "Beta disabled", text: "Beta", disabled: true };
const gamma = { value: "g", label: <strong>Gamma rich</strong>, text: "Xylophone" };
const delta = { value: "d", label: <strong>Delta rich</strong>, text: "Delta" };
type Option = typeof alpha | typeof beta;

function WrappedOptions({ items }: { items: readonly Option[] }) {
  return <SelectGroup className="relative">
    <>{items.map(item => <SelectItem key={item.value} value={item.value} disabled={"disabled" in item && item.disabled} textValue={item.text}>
      {item.label}
    </SelectItem>)}</>
  </SelectGroup>;
}

function SelectFixture() {
  const [filtered, setFiltered] = useState(false);
  const items = filtered ? [gamma, delta, beta] : [alpha, beta, gamma];
  return <section aria-label="Select examples">
    <button type="button" onClick={() => setFiltered(true)}>Filter and reorder</button>
    <Select items={items} defaultValue="a">
      <SelectTrigger aria-label="Wrapped options" />
      <SelectContent animated={false}><WrappedOptions items={items} /></SelectContent>
    </Select>
    <Select defaultValue="plain">
      <SelectTrigger aria-label="Default collection" />
      <SelectContent animated={false}>
        <><SelectItem value="plain">Plain option</SelectItem><SelectItem value="other">Other option</SelectItem></>
      </SelectContent>
    </Select>
  </section>;
}

createRoot(document.getElementById("root")!).render(
  <main className="flex flex-col items-start gap-3 p-4">
    <TabsFixture mode="index" /><TabsFixture mode="value" /><TabsFixture mode="uncontrolled" /><SelectFixture />
  </main>,
);
