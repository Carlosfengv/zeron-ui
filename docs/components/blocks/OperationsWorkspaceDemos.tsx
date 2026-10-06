"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { defaultOperationsNavigation, defaultOperationsServiceNavigation, type OperationsWorkspaceOptions } from "@zeron/blocks/operations-workspace-shell-01";
import { ClusterEnvironmentDetail } from "@zeron/blocks/cluster-environment-detail-01";
import { InspectionReportList } from "@zeron/blocks/inspection-report-list-01";
import { ServiceManagement, type ServiceManagementView } from "@zeron/blocks/service-management-01";
import { useThemeContext } from "@zeron/ui/system/theme-context";
import { DemoSettingsMenu } from "./DemoSettingsMenu";
import { internalPathname, localizePathname } from "@docs/components/shell/site/locale-path";

/** All framework-specific links and preferences stay in documentation adapters. */
export function useOperationsDemoWorkspace(): OperationsWorkspaceOptions {
  const locale = useLocale(); const pathname = usePathname(); const router = useRouter();
  const { theme, setTheme } = useThemeContext();
  const prefix = locale === "en" ? "/en" : pathname.startsWith("/zh-CN/") ? "/zh-CN" : "";
  return {
    navigation: defaultOperationsNavigation.map(item => ({ ...item, href: item.href ? localizePathname(item.href, prefix) : undefined })),
    serviceNavigation: defaultOperationsServiceNavigation.map(item => ({ ...item, href: `${localizePathname("/block-demo/service-management-01", prefix)}#${item.value}` })),
    renderLink: props => <Link {...props} />,
    account: {
      user: { name: "Carlos", email: "carlos@example.com" }, theme, onThemeChange: setTheme,
      locale, localeOptions: [{ value: "zh-CN", label: "简体中文" }, { value: "en", label: "English" }],
      onLocaleChange: next => router.replace(`${localizePathname(internalPathname(pathname), next === "en" ? "/en" : "")}${window.location.search}${window.location.hash}`),
    },
  };
}

export function ClusterEnvironmentDetailDemo({ className = "h-full" }: { className?: string }) {
  const workspace = useOperationsDemoWorkspace();
  const zh = useLocale().startsWith("zh");
  const [scenario, setScenario] = useState<"ready" | "empty">("ready");
  return <><DemoSettingsMenu value={scenario} onChange={setScenario} options={[{ value: "ready", label: zh ? "正常" : "Ready" }, { value: "empty", label: zh ? "无巡检报告" : "No reports" }]} /><ClusterEnvironmentDetail workspace={workspace} className={className} reports={scenario === "empty" ? [] : undefined} onRunInspection={scenario === "empty" ? () => setScenario("ready") : undefined} /></>;
}
export function InspectionReportListDemo({ className = "h-full min-h-0" }: { className?: string }) {
  const workspace = useOperationsDemoWorkspace();
  return <InspectionReportList workspace={workspace} className={className} />;
}
export function ServiceManagementDemo({ className = "h-full min-h-0" }: { className?: string }) {
  const workspace = useOperationsDemoWorkspace();
  const [view, setView] = useState<ServiceManagementView>("service-progress");
  useEffect(() => {
    const sync = () => { const next = window.location.hash.slice(1); if (next === "service-progress" || next === "service-authorizations" || next === "operation-history") setView(next); };
    sync(); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync);
  }, []);
  const changeView = (next: ServiceManagementView) => { setView(next); window.history.replaceState(window.history.state, "", `#${next}`); };
  return <ServiceManagement workspace={workspace} className={className} view={view} onViewChange={changeView} />;
}
