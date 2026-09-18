"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useIcon } from "@zeron/icons/context";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerHeader } from "@zeron/ui/container";
import { Input } from "@zeron/ui/input";
import { Switch } from "@zeron/ui/switch";
import { PageColumns, PagePrimary, PageAside } from "@zeron/ui/page-layout";

export function HomePreview() {
  const t = useTranslations("home.showcase");
  const prefix = useLocale() === "en" ? "/en" : "";
  const id = useId();
  const [name, setName] = useState("Zeron Workspace");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const ArrowRight = useIcon("arrow-right");
  const Layers = useIcon("square-library");
  const Layout = useIcon("monitor");
  const Agent = useIcon("brain");

  return (
    <section aria-label={t("title")}>
      <Container>
        <ContainerHeader>
          <div className="flex items-center gap-2 py-2"><span className="text-body font-semibold text-fg-default">Zeron</span><span className="text-label text-fg-subtle">/ {t("title")}</span></div>
          <Badge variant="dot" color="green" size="sm">{t("live")}</Badge>
        </ContainerHeader>
        <ContainerBody>
          <div className="p-2 sm:p-6">
            <PageColumns asideWidth="24rem">
              <PagePrimary>
                <div className="flex max-w-md flex-col gap-6 py-2">
                  <div className="flex flex-col gap-3">
                    <h2 className="text-heading font-semibold text-fg-default">{t("heading")}</h2>
                    <p className="text-body leading-relaxed text-fg-muted">{t("description")}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      { Icon: Layers, label: t("components"), href: `${prefix}/docs/components` },
                      { Icon: Layout, label: t("layouts"), href: `${prefix}/docs/blocks` },
                      { Icon: Agent, label: t("agents"), href: "#skills" },
                    ].map(({ Icon, label, href }) => (
                      <Link key={href} href={href} className="flex items-center gap-3 rounded-lg py-3 text-body text-fg-muted outline-none transition-colors duration-fast hover:text-fg-brand focus-visible:ring-1 focus-visible:ring-focus-ring">
                        <Icon aria-hidden="true" size={18} /><span className="flex-1">{label}</span><ArrowRight aria-hidden="true" size={16} />
                      </Link>
                    ))}
                  </div>
                </div>
              </PagePrimary>
              <PageAside>
                <form className="flex flex-col gap-5 rounded-2xl border-hairline border-border-subtle p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>
                  <div className="flex items-center justify-between gap-2"><h3 className="text-title font-medium text-fg-default">{t("settings")}</h3><Badge size="sm">{t("demo")}</Badge></div>
                  <div className="flex flex-col gap-2"><label htmlFor={id} className="text-body text-fg-muted">{t("name")}</label><Input id={id} value={name} maxLength={48} required onChange={(event) => { setName(event.target.value); setSaved(false); }} /></div>
                  <div className="flex items-center justify-between gap-3 border-y-hairline border-border-subtle py-4"><Switch label={t("notifications")} checked={notifications} onCheckedChange={(checked) => { setNotifications(checked); setSaved(false); }} /><Badge size="sm" color={notifications ? "green" : "gray"}>{notifications ? t("on") : t("off")}</Badge></div>
                  <div className="flex flex-wrap gap-2"><Button type="submit">{t("save")}</Button><Button type="button" variant="ghost" onClick={() => { setName("Zeron Workspace"); setNotifications(true); setSaved(false); }}>{t("reset")}</Button></div>
                  <p role="status" aria-live="polite" className="min-h-10 text-label leading-relaxed text-fg-muted">{saved ? t("saved", { name }) : t("local")}</p>
                </form>
              </PageAside>
            </PageColumns>
          </div>
        </ContainerBody>
      </Container>
    </section>
  );
}
