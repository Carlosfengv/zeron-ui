"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@zeron/ui/button";
import { InputCopy } from "@zeron/ui/input-copy";
import { PageLayout, PageHeader, PageHeaderContent, PageTitle, PageDescription } from "@zeron/ui/page-layout";
import { CopyPrompt } from "@docs/components/content/CopyPrompt";
import type messages from "@docs/content/en/docs/ai.json";
import { checkMcpConnection } from "@docs/lib/mcp-connection";

export default function AiContent({ text, mode }: { text: typeof messages; mode: "development" | "release" }) {
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [connection, setConnection] = useState<"idle" | "checking" | "passed" | "failed">("idle");
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    setEndpoint(`${window.location.origin}/api/mcp`);
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, []);
  async function checkConnection() {
    if (!endpoint || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setConnection("checking");
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      await checkMcpConnection(endpoint, controller.signal);
      if (request.current === controller) setConnection(controller.signal.aborted ? "failed" : "passed");
    } catch {
      if (request.current === controller) setConnection("failed");
    } finally {
      clearTimeout(timeout);
      request.current = null;
    }
  }
  const isLocal = endpoint && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(endpoint).hostname);
  const prompts = [
    { title: text.prompts.listTitle, value: text.prompts.list },
    { title: text.prompts.detailTitle, value: text.prompts.detail },
    { title: text.prompts.settingsTitle, value: text.prompts.settings },
  ];
  const troubleshooting = [
    [text.troubleshooting.connectionTitle, text.troubleshooting.connection],
    [text.troubleshooting.versionTitle, text.troubleshooting.version],
    [text.troubleshooting.installTitle, text.troubleshooting.install],
    [text.troubleshooting.languageTitle, text.troubleshooting.language],
    [text.troubleshooting.sourceTitle, text.troubleshooting.source],
  ];
  return (
    <PageLayout size="md" gutter="default" className="h-auto gap-10 py-12 sm:py-20">
      <PageHeader>
        <PageHeaderContent>
          <div className="min-w-0">
            <PageTitle className="font-semibold">{text.title}</PageTitle>
            <PageDescription>{text.description}</PageDescription>
          </div>
        </PageHeaderContent>
      </PageHeader>
      <div className="flex min-w-0 flex-col gap-10 px-3">
        <div className="flex flex-col gap-2 border-l-hairline border-border-subtle pl-4">
          <p className="text-body font-medium text-fg-default">{mode === "development" ? text.development : text.release}</p>
          {mode === "development" && <p className="text-label text-fg-muted">{text.installBoundary}</p>}
        </div>
        <section aria-labelledby="ai-connect-title" className="flex min-w-0 flex-col gap-4">
          <h2 id="ai-connect-title" className="text-title font-semibold text-fg-default">{text.connectTitle}</h2>
          <p className="text-body text-fg-muted">{text.connectBody}</p>
          <InputCopy label={text.endpointLabel} value={endpoint ?? "/api/mcp"} disabled={!endpoint} />
          {isLocal && <p className="text-label text-fg-muted">{text.localNotice}</p>}
          <div><Button variant="secondary" onClick={checkConnection} disabled={!endpoint || connection === "checking"}>{connection === "checking" ? text.checkingConnection : text.checkConnection}</Button></div>
          <p role="status" aria-live="polite" className="text-body text-fg-muted">
            {connection === "passed" ? text.connectionPassed : connection === "failed" ? text.connectionFailed : null}
          </p>
          <p className="text-label text-fg-subtle">{text.clientStatus}</p>
          <h3 className="text-body font-medium text-fg-default">{text.clientSetupTitle}</h3>
          <details className="min-w-0">
            <summary className="cursor-pointer text-body font-medium text-fg-default">Codex</summary>
            <div className="flex min-w-0 flex-col gap-3 pt-3">
              <p className="text-body text-fg-muted">{text.codexSetup}</p>
              <InputCopy label={text.codexCommand} value={endpoint ? `codex mcp add zeron --url ${endpoint}` : ""} disabled={!endpoint} />
              <a className="text-body text-brand underline" href="https://developers.openai.com/learn/docs-mcp">{text.clientDocs}</a>
            </div>
          </details>
          <details className="min-w-0">
            <summary className="cursor-pointer text-body font-medium text-fg-default">Cursor</summary>
            <div className="flex min-w-0 flex-col gap-3 pt-3">
              <p className="text-body text-fg-muted">{text.cursorSetup}</p>
              <pre className="overflow-x-auto rounded-lg bg-surface-raised p-4 text-body text-fg-default"><code>{JSON.stringify({ mcpServers: { zeron: { url: endpoint ?? "/api/mcp" } } }, null, 2)}</code></pre>
              <InputCopy label={text.cursorConfig} value={endpoint ? JSON.stringify({ mcpServers: { zeron: { url: endpoint } } }, null, 2) : ""} disabled={!endpoint} />
              <a className="text-body text-brand underline" href="https://cursor.com/docs/mcp">{text.clientDocs}</a>
            </div>
          </details>
        </section>
        <section aria-labelledby="ai-skills-title" className="flex flex-col gap-4">
          <h2 id="ai-skills-title" className="text-title font-semibold text-fg-default">{text.skillsTitle}</h2>
          <p className="text-body text-fg-muted">{text.skillsBody}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary"><a href="/skills/install.md">{text.skillGuide}</a></Button>
            <Button asChild variant="ghost"><a href="/skills/zeron-skills.zip" download>{text.download}</a></Button>
          </div>
        </section>
        <section aria-labelledby="ai-docs-title" className="flex flex-col gap-4">
          <h2 id="ai-docs-title" className="text-title font-semibold text-fg-default">{text.docsTitle}</h2>
          <p className="text-body text-fg-muted">{text.docsBody}</p>
          <div className="flex flex-wrap gap-2">
            {[{ href: "/llms-small.txt", label: text.shortIndex }, { href: "/ai/catalog.json", label: text.catalog }, { href: "/llms-full.txt", label: text.fullContext }, { href: "/ai/instructions.md", label: text.rules }].map((link) => <Button key={link.href} asChild variant="secondary"><a href={link.href}>{link.label}</a></Button>)}
          </div>
        </section>
        <section aria-labelledby="ai-prompts-title" className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 id="ai-prompts-title" className="text-title font-semibold text-fg-default">{text.promptsTitle}</h2>
            <p className="text-body text-fg-muted">{text.promptsBody}</p>
          </div>
          {prompts.map((prompt) => <div key={prompt.title} className="flex min-w-0 flex-col gap-3"><h3 className="text-body font-medium text-fg-default">{prompt.title}</h3><CopyPrompt value={prompt.value} label={text.copyPrompt} /></div>)}
        </section>
        <section aria-labelledby="ai-help-title" className="flex flex-col gap-4 border-t-hairline border-border-subtle pt-8">
          <h2 id="ai-help-title" className="text-title font-semibold text-fg-default">{text.troubleshootingTitle}</h2>
          <dl className="flex flex-col gap-5">{troubleshooting.map(([title, body]) => <div key={title} className="flex flex-col gap-1"><dt className="text-body font-medium text-fg-default">{title}</dt><dd className="text-body text-fg-muted">{body}</dd></div>)}</dl>
        </section>
      </div>
    </PageLayout>
  );
}
