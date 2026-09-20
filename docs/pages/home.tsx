"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useIcon } from "@zeron/icons/context";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerHeader } from "@zeron/ui/container";
import { PageLayout, PageColumns, PagePrimary, PageAside } from "@zeron/ui/page-layout";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { InstallCommand } from "@docs/components/content/InstallCommand";
import { CopyPrompt } from "@docs/components/content/CopyPrompt";
import { HomePreview } from "@docs/components/content/HomePreview";
import type { NpmRelease } from "@docs/lib/npm-release.server";
import styles from "./home.module.css";

export default function HomeContent({ release }: { release: NpmRelease | null }) {
  const t = useTranslations("home");
  const skills = useTranslations("introduction.skills");
  const locale = useLocale();
  const prefix = locale === "en" ? "/en" : "";
  const ArrowRight = useIcon("arrow-right");
  const Check = useIcon("check");
  const cli = `npx zeron-ui@${release?.version ?? "latest"}`;
  const publishedAt = release?.publishedAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(release.publishedAt)) : null;

  return (
    <PageLayout size="lg" gutter="default">
      <div className="min-w-0 px-3 sm:px-5">
        <header className="mx-auto flex max-w-4xl flex-col items-center gap-7 pb-12 pt-16 text-center sm:pb-16 sm:pt-24">
          <a href="https://www.npmjs.com/package/zeron-ui" target="_blank" rel="noreferrer" className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border-hairline border-border px-3 py-1.5 text-label text-fg-muted outline-none transition-colors duration-fast hover:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring">
            <Badge size="sm" color="blue">{release ? `v${release.version}` : "npm"}</Badge>
            <span>{release ? release.prerelease ? t("release.prerelease") : t("release.title") : t("release.unavailable")}</span>
            <ArrowRight size={14} aria-hidden="true" />
          </a>
          <div className="flex flex-col items-center gap-5">
            <h1 className={`${styles.heroTitle} whitespace-pre-line font-semibold tracking-tight text-fg-default`}>{t("title")}</h1>
            <p className="max-w-2xl text-body leading-relaxed text-fg-muted sm:text-title">{t("description")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" trailingIcon={ArrowRight}><a href="#install">{t("getStarted")}</a></Button>
            <Button asChild size="lg" variant="secondary"><a href="#skills">{t("useSkills")}</a></Button>
          </div>
          <p className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-label text-fg-subtle"><span>React 19</span><span>Tailwind CSS 4</span><span>shadcn Registry</span><span>{t("openSource")}</span></p>
        </header>

        <HomePreview />

        <section aria-label={t("release.title")} className="flex flex-col gap-3 border-b-hairline border-border-subtle px-2 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-fg-muted">
            <span className="font-medium text-fg-default">zeron-ui <span className="font-normal text-fg-muted">/ npm latest</span></span>
            {release && <span>{release.version}</span>}
            {publishedAt && <span>{t("release.published")} <time dateTime={release?.publishedAt ?? undefined}>{publishedAt}</time></span>}
            {release?.node && <span>Node.js {release.node}</span>}
          </div>
          <Button asChild variant="ghost" size="sm" trailingIcon={ArrowRight}><Link href={`${prefix}/updates`}>{t("release.updates")}</Link></Button>
        </section>
        <p className="px-2 pt-3 text-label text-fg-subtle">{release ? t("release.source") : t("release.fallback")}</p>

        <section id="install" aria-labelledby="install-title" className="scroll-mt-32 py-16 sm:scroll-mt-20 sm:py-24">
          <PageColumns asideWidth="34rem">
            <PagePrimary>
              <div className="flex max-w-md flex-col items-start gap-5 py-3 lg:pr-8">
                <span className="text-label font-medium text-fg-brand">{t("install.eyebrow")}</span>
                <h2 id="install-title" className={`${styles.sectionTitle} font-semibold tracking-tight text-fg-default`}>{t("install.title")}</h2>
                <p className="text-body leading-relaxed text-fg-muted">{t("install.description")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary"><Link href={`${prefix}/docs/components`}>{t("install.components")}</Link></Button>
                  <Button asChild variant="ghost" trailingIcon={ArrowRight}><Link href={`${prefix}/docs`}>{t("install.docs")}</Link></Button>
                </div>
              </div>
            </PagePrimary>
            <PageAside>
              <Container>
                <ContainerHeader><h3 className="py-1 text-body font-medium text-fg-default">{t("install.terminal")}</h3><Badge size="sm" variant="dot">CLI</Badge></ContainerHeader>
                <ContainerBody>
                  <ol className="flex min-w-0 flex-col gap-6 p-1 sm:p-2">
                    <li className="flex min-w-0 flex-col gap-3"><h4 className="text-body font-medium text-fg-default">{t("install.initialize")}</h4><p className="text-label text-fg-muted">{t("install.initializeHint")}</p><InstallCommand value={`${cli} init`} /></li>
                    <li className="flex min-w-0 flex-col gap-3 border-t-hairline border-border-subtle pt-6"><h4 className="text-body font-medium text-fg-default">{t("install.add")}</h4><InstallCommand value={`${cli} add button`} /><p className="text-label leading-relaxed text-fg-muted">{t("install.addHint")}</p></li>
                  </ol>
                </ContainerBody>
              </Container>
            </PageAside>
          </PageColumns>
        </section>

        <section aria-labelledby="capabilities-title" className="border-t-hairline border-border-subtle py-16 sm:py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 pb-10 text-center">
            <span className="text-label font-medium text-fg-brand">{t("skillsSection")}</span>
            <h2 id="capabilities-title" className={`${styles.sectionTitle} font-semibold tracking-tight text-fg-default`}>{t("capabilities.title")}</h2>
            <p className="text-body leading-relaxed text-fg-muted">{t("capabilities.description")}</p>
          </div>
          <Tabs defaultValue="builder" variant="segment" color="default">
            <div className="flex justify-center pb-8"><TabsList aria-label={t("capabilities.eyebrow")}><TabItem value="builder" label="Zeron Page Builder" /><TabItem value="migration" label="Swap to Zeron UI" /></TabsList></div>
            {(["builder", "migration"] as const).map((skill) => (
              <TabPanel value={skill} key={skill}>
                <Container>
                  <ContainerBody>
                    <div className="grid items-center gap-8 p-2 sm:p-6 lg:grid-cols-2 lg:gap-12">
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2"><h3 className="text-heading font-semibold text-fg-default">{skill === "builder" ? "Zeron Page Builder" : "Swap to Zeron UI"}</h3><p className="text-body text-fg-muted">{t(`capabilities.${skill}.description`)}</p></div>
                        <ul className="flex flex-col gap-4">
                          {(["first", "second", "third"] as const).map((item) => <li className="flex items-start gap-3 text-body leading-relaxed text-fg-muted" key={item}><Check size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-fg-brand" /><span>{t(`capabilities.${skill}.${item}`)}</span></li>)}
                        </ul>
                      </div>
                      <div className="flex min-w-0 flex-col gap-3"><p className="text-label font-medium text-fg-subtle">{t("tryPrompt")}</p><CopyPrompt value={t(`capabilities.${skill}.prompt`)} label={t(`capabilities.${skill}.copy`)} /></div>
                    </div>
                  </ContainerBody>
                </Container>
              </TabPanel>
            ))}
          </Tabs>
          <p className="mx-auto max-w-3xl pt-5 text-center text-label leading-relaxed text-fg-subtle">{t("capabilities.boundary")}</p>
        </section>

        <section id="skills" aria-labelledby="skills-title" className="scroll-mt-32 border-t-hairline border-border-subtle py-16 sm:scroll-mt-20 sm:py-24">
          <PageColumns asideWidth="34rem">
            <PagePrimary>
              <div className="flex max-w-md flex-col items-start gap-5 py-2 lg:pr-8">
                <Badge color="blue">Agent Skills</Badge>
                <h2 id="skills-title" className={`${styles.sectionTitle} font-semibold tracking-tight text-fg-default`}>{skills("title")}</h2>
                <p className="text-body leading-relaxed text-fg-muted">{skills("description")}</p>
                <p className="text-label leading-relaxed text-fg-subtle">{skills("hint")}</p>
              </div>
            </PagePrimary>
            <PageAside>
              <CopyPrompt value={skills("prompt", { url: "https://zeron-ui.vercel.app/skills/install.md" })} label={skills("copy")}>
                <Button variant="secondary" asChild><a href="/skills/zeron-skills.zip" download>{skills("download")}</a></Button>
                <Button variant="ghost" asChild><a href="/skills/install.md">{skills("guide")}</a></Button>
              </CopyPrompt>
              <p className="mt-4 text-label leading-relaxed text-fg-muted">{skills("next")}</p>
            </PageAside>
          </PageColumns>
          <section id="ai-docs" aria-labelledby="ai-docs-title" className="mt-10 scroll-mt-32 border-t-hairline border-border-subtle pt-8 sm:scroll-mt-20">
            <PageColumns asideWidth="34rem">
              <PagePrimary>
                <div className="flex max-w-md flex-col items-start gap-3 lg:pr-8">
                  <h3 id="ai-docs-title" className="text-heading font-semibold text-fg-default">{t("aiDocs.title")}</h3>
                  <p className="text-body leading-relaxed text-fg-muted">{t("aiDocs.description")}</p>
                </div>
              </PagePrimary>
              <PageAside>
                <CopyPrompt value={t("aiDocs.prompt", { url: "https://zeron-ui.vercel.app/llms.txt" })} label={t("aiDocs.copy")}>
                  <Button variant="secondary" asChild trailingIcon={ArrowRight}><a href="/llms.txt">{t("aiDocs.open")}</a></Button>
                </CopyPrompt>
              </PageAside>
            </PageColumns>
          </section>
        </section>

        <section className="flex flex-col items-center gap-5 rounded-3xl bg-surface-raised px-6 py-12 text-center sm:py-16">
          <h2 className={`${styles.sectionTitle} font-semibold tracking-tight text-fg-default`}>{t("closing.title")}</h2>
          <p className="max-w-xl text-body text-fg-muted">{t("closing.description")}</p>
          <div className="flex flex-wrap justify-center gap-3"><Button asChild size="lg" trailingIcon={ArrowRight}><a href="#install">{t("getStarted")}</a></Button><Button asChild size="lg" variant="secondary"><Link href={`${prefix}/docs/blocks`}>{t("browseBlocks")}</Link></Button></div>
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-4 py-8 text-label text-fg-muted">
          <Link href={prefix || "/"} className="text-body font-semibold text-fg-default">Zeron Design</Link><span>{t("footer")}</span>
          <div className="flex gap-4"><Link href={`${prefix}/docs`}>{t("install.docs")}</Link><a href="https://github.com/Carlosfengv/zeron-ui" target="_blank" rel="noreferrer">GitHub</a></div>
        </footer>
      </div>
    </PageLayout>
  );
}
