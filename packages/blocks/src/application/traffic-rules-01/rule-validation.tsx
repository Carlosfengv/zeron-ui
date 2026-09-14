"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import { Input } from "@zeron/ui/input";
import { RadioGroup, RadioGroupItem } from "@zeron/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Textarea } from "@zeron/ui/textarea";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import {
  callTypes,
  gatewayModels,
  modelServices,
  principalOptions,
  simulationFacts,
} from "./gateway-policy-data";

const resultTabs = ["生产模型请求转发与内容检测", "MCP 工具调用保护", "A2A 非服务时段拒绝", "审计记录"];
const resultTabDetails: Record<string, { hit: boolean; detail: string }> = {
  "MCP 工具调用保护": { hit: false, detail: "调用类型不是 MCP 调用，本次请求未进入 MCP 工具保护规则。" },
  "A2A 非服务时段拒绝": { hit: false, detail: "调用类型不是 A2A 调用，本次请求未进入 A2A 非服务时段规则。" },
  "审计记录": { hit: true, detail: "已记录本次验证请求，未产生额外的规则改写。" },
};

function SelectField({ ariaLabel, options, value, onChange }: { ariaLabel: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <Select itemDensity="compact" onValueChange={onChange} size="md" value={value}>
      <SelectTrigger aria-label={ariaLabel} className="w-full min-w-0 bg-white" placeholder="请选择" />
      <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function FieldLabel({ children, required = true }: { children: React.ReactNode; required?: boolean }) {
  const Info = useIcon("doc-info-item");
  return <span className="mb-1 flex items-center gap-1 text-[13px] text-black/65"><span>{children}{required ? <span className="ml-0.5 text-[#f73920]">*</span> : null}</span><Info aria-hidden className="size-3.5 text-black/65" /></span>;
}

type PairRow = { id: number; name: string; value: string };

function KeyValueRows({ label, placeholder, rows, onChange }: { label: string; placeholder: string; rows: PairRow[]; onChange: (rows: PairRow[]) => void }) {
  const Plus = useIcon("plus");
  const Trash = useIcon("trash");
  const update = (id: number, patch: Partial<PairRow>) => onChange(rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  return (
    <div>
      <FieldLabel required={false}>{label}</FieldLabel>
      <div className="space-y-2">
        {rows.map((row) => <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-2" key={row.id}>
          <Input aria-label={`${label}名称`} className="bg-white" onChange={(event) => update(row.id, { name: event.target.value })} placeholder={placeholder} size="md" value={row.name} />
          <Input aria-label={`${label}值`} className="bg-white" onChange={(event) => update(row.id, { value: event.target.value })} placeholder="值" size="md" value={row.value} />
          <Button aria-label={`删除${label}`} iconOnly onClick={() => onChange(rows.filter((item) => item.id !== row.id))} size="sm" type="button" variant="ghost"><Trash /></Button>
        </div>)}
      </div>
      <Button className="mt-1 text-[#075fce]" leadingIcon={Plus} onClick={() => onChange([...rows, { id: Date.now(), name: "", value: "" }])} size="sm" type="button" variant="ghost">添加一项</Button>
    </div>
  );
}

function AdditionalFacts({ callType }: { callType: string }) {
  const [defaultRoute, setDefaultRoute] = useState("");
  const [modelService, setModelService] = useState("默认解析");
  const [dataSource, setDataSource] = useState("无");
  const [piiType, setPiiType] = useState("");
  const [queryRows, setQueryRows] = useState<PairRow[]>([{ id: 1, name: "", value: "" }]);
  const [cookieRows, setCookieRows] = useState<PairRow[]>([]);
  const [tagRows, setTagRows] = useState<PairRow[]>([]);
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-black/[0.10] bg-[#f1f3f9]">
      <div className="px-4 py-3 sm:px-5">
        <p className="text-[14px] font-medium">补充请求事实</p>
        <p className="mt-1 text-[12px] leading-5 text-black/50">用于模拟真实流量上下文；系统仍会按实际请求自动判断，结果仅供验证参考。</p>
      </div>
      <div className="grid gap-x-5 gap-y-4 border-t border-black/[0.08] px-4 py-4 sm:px-5 md:grid-cols-2">
        <label><FieldLabel required={false}>默认路由目标</FieldLabel><SelectField ariaLabel="默认路由目标" onChange={setDefaultRoute} options={[...gatewayModels]} value={defaultRoute} /></label>
        <label><FieldLabel required={false}>指定模型服务</FieldLabel><SelectField ariaLabel="指定模型服务" onChange={setModelService} options={["默认解析", ...modelServices]} value={modelService} /><span className="mt-1 block text-[12px] leading-5 text-black/45">仅在模型名可能对应多个服务时需要指定。</span></label>
        <label className="md:col-span-2"><FieldLabel required={false}>意图提示词</FieldLabel><Textarea className="min-h-20 bg-white" defaultValue="" placeholder="粘贴要分类的用户问题或提示词" rows={3} /></label>
        <label><FieldLabel required={false}>客户端 IP</FieldLabel><Input className="bg-white" defaultValue={simulationFacts.clientIp} placeholder="例如 203.0.113.7" size="md" /></label>
        <label><FieldLabel required={false}>声明的调用类型</FieldLabel><Input className="bg-white" readOnly size="md" value={callType} /></label>
      </div>
      <div className="grid gap-x-5 gap-y-4 border-t border-black/[0.08] px-4 py-4 sm:px-5 md:grid-cols-2">
        <div className="md:col-span-2"><KeyValueRows label="查询参数" onChange={setQueryRows} placeholder="参数名" rows={queryRows} /></div>
        <KeyValueRows label="灰度 Cookie" onChange={setCookieRows} placeholder="Cookie 名称" rows={cookieRows} />
        <KeyValueRows label="调用标记" onChange={setTagRows} placeholder="标记名称" rows={tagRows} />
        <label className="md:col-span-2"><FieldLabel required={false}>请求头</FieldLabel><Textarea className="min-h-20 bg-white" defaultValue={simulationFacts.requestHeaders} rows={3} /></label>
      </div>
      <div className="grid gap-x-5 gap-y-4 border-t border-black/[0.08] px-4 py-4 sm:px-5 md:grid-cols-2">
        <div><FieldLabel required={false}>数据来源</FieldLabel><RadioGroup className="flex flex-wrap gap-4" onValueChange={setDataSource} value={dataSource}>{["无", "mcp"].map((source) => <label className="flex cursor-pointer items-center gap-2 text-[13px]" key={source}><RadioGroupItem className="data-checked:border-[#00030a] [&_[data-slot=radio-group-indicator]>span]:bg-[#00030a]" value={source} />{source}</label>)}</RadioGroup></div>
        <label><FieldLabel required={false}>语义 PII 类型</FieldLabel><SelectField ariaLabel="语义 PII 类型" onChange={setPiiType} options={["真实姓名", "家庭住址"]} value={piiType} /></label>
        <label className="flex items-start gap-2 md:col-span-2"><Checkbox className="mt-0.5 data-checked:border-[#00030a] data-checked:bg-[#00030a]" /><span><span className="block text-[13px]">模拟主档失败</span><span className="mt-1 block text-[12px] leading-5 text-black/50">将主档判为失败，检查请求会如何投递到副一档。</span></span></label>
      </div>
    </div>
  );
}

function EvaluationRow({ detail, hit, name }: { detail: string; hit: boolean; name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 py-1">
      <span className={cn("inline-flex h-6 shrink-0 items-center rounded-md px-2 text-[11px] font-medium text-white", hit ? "bg-[#18c964]" : "bg-[#ff416c]")}>{hit ? "命中" : "不匹配"}</span>
      <span className="shrink-0 text-[13px]">{name}</span>
      <span className="truncate text-[11px] text-black/45">{detail}</span>
    </div>
  );
}

function EmptySimulation() {
  return (
    <div className="grid min-h-[260px] place-items-center rounded-lg bg-[#f1f3f9] px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <Image alt="" className="rounded-xl" height={92} src="/figma/traffic-rules-01/empty-rules.png" width={200} />
        <p className="mt-2 text-[14px] font-medium">还没有模拟过请求</p>
      </div>
    </div>
  );
}

function SimulationResult() {
  const More = useIcon("ellipsis");
  const [activeTab, setActiveTab] = useState(resultTabs[0]);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const visibleTabs = resultTabs.slice(0, 3);
  const moreTabs = resultTabs.slice(3);
  useEffect(() => {
    if (!moreOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [moreOpen]);
  return (
    <div className="grid items-stretch gap-5 xl:grid-cols-2">
      <section className="flex min-w-0 flex-col">
        <h2 className="mb-2 text-[14px] font-medium">模拟请求结果</h2>
        <div className="min-h-[396px] flex-1 rounded-lg bg-[#f1f3f9] p-4 sm:p-5">
          <h3 className="text-[13px] text-black/45">选路前求值</h3>
          <div className="mt-2">
            <EvaluationRow detail="路径前缀 /v1/chat/ 与调用主体均匹配" hit name="生产模型请求转发与内容检测" />
            <EvaluationRow detail="调用类型不是 MCP 调用" hit={false} name="MCP 工具调用保护" />
            <EvaluationRow detail="调用类型不是 A2A 调用" hit={false} name="A2A 非服务时段拒绝" />
          </div>
          <div className="mt-5">
            <h3 className="text-[13px] text-black/45">选定目标后复核</h3>
            <p className="mt-2 text-[13px] leading-5">未确定路由目标，选定后复核阶段不再执行。</p>
          </div>
        </div>
      </section>
      <section className="flex min-w-0 flex-col">
        <h2 className="mb-2 text-[14px] font-medium">命中规则后的完整走向</h2>
        <div className="min-h-[396px] flex-1 rounded-lg bg-[#f1f3f9] p-4 sm:p-5">
          <div className="relative flex min-w-0 items-end border-b border-black/[0.10]">
            <div className="flex min-w-0 flex-1">
              {visibleTabs.map((tab) => <button className={cn("h-9 min-w-0 flex-1 truncate border-b-2 border-transparent px-2 text-[12px] text-black/65 outline-none transition-colors hover:text-black focus-visible:ring-1 focus-visible:ring-focus-ring", activeTab === tab && "border-[#0878ff] font-medium text-black")} key={tab} onClick={() => setActiveTab(tab)} type="button">{tab}</button>)}
            </div>
            <div className="relative" ref={moreRef}>
              <Button aria-label="更多结果阶段" active={moreOpen || !visibleTabs.includes(activeTab)} iconOnly onClick={() => setMoreOpen((current) => !current)} size="sm" type="button" variant="ghost"><More /></Button>
              {moreOpen ? <div className="absolute right-0 top-10 z-10 w-44 rounded-lg border border-black/[0.10] bg-white p-1 shadow-[0_10px_28px_rgba(0,0,0,.14)]">{moreTabs.map((tab) => <button className={cn("flex h-8 w-full items-center rounded-md px-2 text-left text-[12px] hover:bg-[#f1f3f9]", activeTab === tab && "bg-[#f1f3f9] font-medium")} key={tab} onClick={() => { setActiveTab(tab); setMoreOpen(false); }} type="button">{tab}</button>)}</div> : null}
            </div>
          </div>
          {activeTab === resultTabs[0] ? <>
            <div className="mt-3 rounded-lg bg-white p-5"><p className="text-[13px] text-[#08783e]">已选定路由</p><p className="mt-3 text-[12px] leading-5 text-black/50">请求命中「生产模型请求转发与内容检测」，按 weightedHash 转发到 gateway-model-general-prod。</p></div>
            <p className="mt-3 text-[13px] text-black/45">条件因子</p>
            <div className="mt-2 rounded-lg bg-white p-5"><p className="text-[12px] text-black/45">已解析事实</p><div className="mt-2 flex flex-wrap gap-1">{["模型调用", "/v1/chat/completions", "service · gateway-router", "gateway-model-general-prod"].map((item) => <span className="rounded-md bg-[#eceef2] px-2 py-0.5 text-[11px]" key={item}>{item}</span>)}</div></div>
            <p className="mt-3 text-[13px] text-black/45">处置动作</p>
            <div className="mt-2 rounded-lg bg-white p-5 text-[13px]">内容检测（通用）→ weightedHash 转发</div>
          </> : <div className="mt-3 rounded-lg bg-white p-5"><div className="flex items-center justify-between gap-3"><p className="text-[13px] font-medium">{activeTab}</p><span className={cn("rounded-md px-2 py-1 text-[11px] font-medium text-white", resultTabDetails[activeTab]?.hit ? "bg-[#18c964]" : "bg-[#ff416c]")}>{resultTabDetails[activeTab]?.hit ? "命中" : "不匹配"}</span></div><p className="mt-3 text-[12px] leading-5 text-black/50">{resultTabDetails[activeTab]?.detail}</p></div>}
        </div>
      </section>
    </div>
  );
}

export function RuleValidation({ onBack }: { onBack: () => void }) {
  const ArrowLeft = useIcon("arrow-left");
  const ChevronDown = useIcon("chevron-down");
  const ChevronUp = useIcon("chevron-up");
  const [callType, setCallType] = useState("模型调用");
  const [ran, setRan] = useState(false);
  const [moreFacts, setMoreFacts] = useState(false);
  const [model, setModel] = useState<string>(simulationFacts.model);
  const [caller, setCaller] = useState<string>(simulationFacts.caller);
  const [credential, setCredential] = useState<string>(simulationFacts.credential);
  const [path, setPath] = useState<string>(simulationFacts.path);
  const [time, setTime] = useState<string>(simulationFacts.time);
  const [body, setBody] = useState<string>(simulationFacts.body);
  return (
    <section className="min-h-[calc(100svh-56px)] overflow-hidden rounded-t-2xl border-[0.5px] border-black/[0.12] bg-white">
      <header className="flex h-14 items-center gap-2 border-b border-black/[0.10] px-4 sm:px-5">
        <Button aria-label="返回规则清单" iconOnly onClick={onBack} size="sm" type="button" variant="secondary"><ArrowLeft /></Button>
        <strong className="text-[14px]">验证规则</strong>
      </header>
      <div className="space-y-5 p-4 sm:p-5">
        <section>
          <h2 className="mb-2 text-[14px] font-medium">调用类型</h2>
          <RadioGroup className="flex flex-wrap gap-2" onValueChange={setCallType} value={callType}>
            {callTypes.map((type) => <label className={cn("flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[13px] transition-colors", callType === type ? "border-[#00030a] bg-white" : "border-black/[0.10] bg-white hover:border-black/25")} key={type}><RadioGroupItem className="data-checked:border-[#00030a] [&_[data-slot=radio-group-indicator]>span]:bg-[#00030a]" value={type} />{type}</label>)}
          </RadioGroup>
          <div className="mt-3 grid gap-x-5 gap-y-3 rounded-lg bg-[#f1f3f9] p-4 sm:p-5 md:grid-cols-2">
            <label><FieldLabel>请求的模型</FieldLabel><SelectField ariaLabel="请求的模型" onChange={setModel} options={[...gatewayModels]} value={model} /></label>
            <label><FieldLabel>调用方</FieldLabel><SelectField ariaLabel="调用方" onChange={setCaller} options={[...principalOptions]} value={caller} /></label>
            <label><FieldLabel>凭据身份</FieldLabel><SelectField ariaLabel="凭据身份" onChange={setCredential} options={["gatewayModelKey · gmkey-prod-cn", "zrApiToken · token-model-gateway", "credential.ref.hash · sha256:4b9f…72e1"]} value={credential} /></label>
            <label><FieldLabel>请求路径</FieldLabel><Input className="bg-white" onChange={(event) => setPath(event.target.value)} size="md" value={path} /></label>
            <label><FieldLabel>请求时间</FieldLabel><Input className="bg-white" onChange={(event) => setTime(event.target.value)} size="md" value={time} /></label>
            <label><FieldLabel>真实文本</FieldLabel><Textarea className="min-h-8 bg-white py-1.5" density="compact" onChange={(event) => setBody(event.target.value)} rows={1} value={body} /></label>
          </div>
          <Button className="mt-1 text-[#0878ff]" leadingIcon={moreFacts ? ChevronUp : ChevronDown} onClick={() => setMoreFacts((current) => !current)} size="sm" type="button" variant="ghost">{moreFacts ? "收起请求事实" : "更多请求事实"}</Button>
          {moreFacts ? <AdditionalFacts callType={callType} /> : null}
        </section>
        <Button onClick={() => setRan(true)} size="md" type="button" variant="neutral">模拟请求</Button>
        <section>
          {ran ? <SimulationResult /> : <><h2 className="mb-2 text-[14px] font-medium">模拟请求结果</h2><EmptySimulation /></>}
        </section>
      </div>
    </section>
  );
}
