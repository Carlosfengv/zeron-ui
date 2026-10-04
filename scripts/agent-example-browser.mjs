/** Real browser observations only. This worker cannot declare a published release successful. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { exampleDeclarationsSchema, exampleStateCases } from "./agent-example-sources.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

const pages = { "resource-list": "list", "resource-detail": "detail", settings: "settings" };
const operations = { "resource-list": "list", "resource-detail": "detail", settings: "settings" };
const labels = { "resource-list": "Search resources", "resource-detail": "Resource name", settings: "Notification email" };
const loading = { "resource-list": "Loading resources", "resource-detail": "Loading resource", settings: "Loading settings" };
const mutation = id => id === "resource-detail" ? "rename" : "saveSettings";
const saveLabel = id => id === "resource-detail" ? "Save resource" : "Save settings";
const savedLabel = id => id === "resource-detail" ? "Resource saved." : "Settings saved.";
const draft = id => id === "resource-detail" ? "Browser renamed resource" : "browser@example.com";
const baseline = id => id === "resource-detail" ? "Resource 01" : "ops@example.com";
export function browserOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || !url.port || url.origin !== value) throw new Error("Browser worker requires a loopback origin");
  return value;
}

async function waitUntil(read, predicate, message) {
  const end = Date.now() + 8000;
  do {
    const value = await read();
    if (predicate(value)) return value;
    await new Promise(resolve => setTimeout(resolve, 30));
  } while (Date.now() < end);
  throw new Error(message);
}
const observations = page => page.evaluate(() => window.__zeronExampleObservations?.() ?? null);
const waitCalls = (page, predicate) => waitUntil(() => observations(page), value => Array.isArray(value) && predicate(value), "API observation did not reach its expected state");
const visible = (page, text) => page.getByText(text, { exact: true }).waitFor({ state: "visible" });
const absent = async locator => assert.equal(await locator.count(), 0);
const inputEquals = async (input, expected) => {
  await waitUntil(() => input.inputValue(), value => value === expected, "Input did not match the observed operation");
};
async function ready(page, id) {
  await waitCalls(page, calls => calls.some(call => call.operation === operations[id] && call.status === "fulfilled"));
  if (id === "resource-list") await page.getByRole("button", { name: "Resource 01", exact: true }).waitFor();
  else await page.getByLabel(labels[id], { exact: true }).waitFor();
}
async function open(page, origin, id, scenario = "success") {
  const url = new URL(origin);
  url.searchParams.set("example", pages[id]); url.searchParams.set("scenario", scenario); url.searchParams.set("observe", "1");
  const response = await page.goto(url.href, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200);
  await page.getByRole("main", { name: "Example content" }).waitFor();
  await waitCalls(page, calls => calls.length > 0);
}
async function assertSuccess(page, id) {
  if (id === "resource-list") {
    await visible(page, "Page 1 of 3");
    assert.equal(await page.getByRole("button", { name: /^Resource \d\d$/ }).count(), 10);
  } else {
    await inputEquals(page.getByLabel(labels[id], { exact: true }), baseline(id));
    assert.equal(await page.getByRole("button", { name: saveLabel(id), exact: true }).isDisabled(), true);
  }
}
async function edit(page, id, value = draft(id)) {
  await page.getByLabel(labels[id], { exact: true }).fill(value);
  assert.equal(await page.getByRole("button", { name: saveLabel(id), exact: true }).isEnabled(), true);
}
async function save(page, id) { await page.getByRole("button", { name: saveLabel(id), exact: true }).click(); }
async function assertSaved(page, id) {
  await visible(page, savedLabel(id));
  await inputEquals(page.getByLabel(labels[id], { exact: true }), draft(id));
  assert.equal(await page.getByRole("button", { name: saveLabel(id), exact: true }).isDisabled(), true);
}
async function contextReturn(page) {
  await ready(page, "resource-list");
  await page.getByLabel("Search resources", { exact: true }).fill("2");
  await waitCalls(page, calls => calls.some(call => call.operation === "list" && call.input.search === "2" && call.status === "fulfilled"));
  await page.getByRole("button", { name: "Resource 02", exact: true }).click();
  await page.getByLabel("Resource name", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Back to resources", exact: true }).click();
  await visible(page, "Page 1 of 1");
  await inputEquals(page.getByLabel("Search resources", { exact: true }), "2");
  assert.equal(await page.getByRole("main", { name: "Example content" }).evaluate(node => node === document.activeElement), true);
}

/** Case assertions are added only after the corresponding actual UI and service checks pass. */
async function stateCase(page, origin, id, caseId) {
  const result = [];
  const record = name => result.push({ name, passed: true });
  if (caseId === "navigation-context") {
    await open(page, origin, "resource-list"); await contextReturn(page);
    record("query-and-navigation-focus-preserved"); return result;
  }
  if (caseId === "stale-read") {
    await open(page, origin, id, "race");
    if (id === "resource-list") {
      await page.getByLabel("Search resources", { exact: true }).fill("26");
      await page.getByRole("button", { name: "Resource 26", exact: true }).waitFor();
      await waitCalls(page, calls => calls[0]?.status === "fulfilled" && calls[0].aborted && calls.some(call => call.input?.search === "26" && call.status === "fulfilled"));
      assert.equal(await page.getByRole("button", { name: /^Resource \d\d$/ }).count(), 1);
      await absent(page.getByRole("button", { name: "Resource 01", exact: true }));
    } else {
      await page.getByRole("button", { name: "Back to resources", exact: true }).click();
      await ready(page, "resource-list");
      await page.getByRole("button", { name: "Resource 02", exact: true }).click();
      await inputEquals(page.getByLabel("Resource name", { exact: true }), "Resource 02");
      await waitCalls(page, calls => calls[0]?.status === "fulfilled" && calls[0].aborted && calls.some(call => call.operation === "detail" && call.input === "resource-2" && call.status === "fulfilled"));
      await inputEquals(page.getByLabel("Resource name", { exact: true }), "Resource 02");
    }
    // Read the DOM after the ignored-abort response and a browser paint, not before its completion.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    if (id === "resource-list") assert.equal(await page.getByRole("button", { name: /^Resource \d\d$/ }).count(), 1);
    else await inputEquals(page.getByLabel("Resource name", { exact: true }), "Resource 02");
    record("old-response-settled-without-overwriting-current-view"); return result;
  }
  const scenarios = { loading: "slow", error: "error", forbidden: "forbidden", empty: "empty", "not-found": "missing",
    saving: "saving", "save-error": "save-error", "save-forbidden": "save-forbidden", readonly: "readonly", "duplicate-submit": "saving" };
  await open(page, origin, id, scenarios[caseId] ?? "success");
  if (caseId === "loading") {
    await visible(page, loading[id]);
    assert.equal((await observations(page)).find(call => call.operation === operations[id]).status, "pending");
    await ready(page, id); await assertSuccess(page, id); record("pending-indicator-and-success-transition");
  } else if (caseId === "error" || caseId === "forbidden" || caseId === "not-found") {
    await visible(page, caseId === "error" ? "Request failed" : caseId === "forbidden" ? "Access denied" : "Resource not found");
    await waitCalls(page, calls => calls[0]?.status === "rejected");
    if (id === "resource-list") await absent(page.getByRole("button", { name: /^Resource \d\d$/ }));
    else await absent(page.getByLabel(labels[id], { exact: true }));
    record("failed-or-forbidden-read-hides-sensitive-content");
    if (caseId === "error") {
      await page.getByRole("button", { name: "Retry", exact: true }).click();
      await ready(page, id); await assertSuccess(page, id);
      assert.equal((await observations(page)).filter(call => call.operation === operations[id]).length, 2);
      record("retry-performs-new-read-and-recovers");
    }
  } else if (caseId === "empty") {
    await visible(page, "No resources");
    await absent(page.getByRole("button", { name: /^Resource \d\d$/ }));
    await waitCalls(page, calls => calls[0]?.status === "fulfilled"); record("confirmed-empty-inventory");
  } else {
    await ready(page, id);
    if (caseId === "success") { await assertSuccess(page, id); record("service-result-renders-and-clean-form-is-not-submittable"); }
    else if (caseId === "readonly") {
      await visible(page, "You have read-only access.");
      assert.equal(await page.getByLabel(labels[id], { exact: true }).isDisabled(), true);
      assert.equal(await page.getByRole("button", { name: saveLabel(id), exact: true }).isDisabled(), true);
      assert.equal((await observations(page)).filter(call => call.operation === mutation(id)).length, 0); record("readonly-prevents-mutation");
    } else if (["saving", "save-error", "save-forbidden", "duplicate-submit"].includes(caseId)) {
      await edit(page, id); await save(page, id);
      if (caseId === "saving" || caseId === "duplicate-submit") {
        await waitCalls(page, calls => calls.some(call => call.operation === mutation(id) && call.status === "pending"));
        assert.equal(await page.getByLabel(labels[id], { exact: true }).isDisabled(), true);
        assert.equal(await page.getByRole("button", { name: saveLabel(id), exact: true }).isDisabled(), true);
        // Exercise the form handler twice even though the native disabled button blocks clicks.
        await page.getByLabel(labels[id], { exact: true }).evaluate(node => { node.form.requestSubmit(); node.form.requestSubmit(); });
        await assertSaved(page, id);
        assert.equal((await observations(page)).filter(call => call.operation === mutation(id)).length, 1);
        record("pending-disables-editing-and-two-extra-submissions-do-not-duplicate-mutation");
      } else {
        await visible(page, caseId === "save-error" ? "Request failed" : "Access denied");
        await inputEquals(page.getByLabel(labels[id], { exact: true }), draft(id));
        await waitCalls(page, calls => calls.some(call => call.operation === mutation(id) && call.status === "rejected"));
        record("failed-save-preserves-draft");
        if (caseId === "save-error") {
          await save(page, id); await assertSaved(page, id);
          assert.equal((await observations(page)).filter(call => call.operation === mutation(id)).length, 2); record("second-save-recovers-without-losing-draft");
        } else {
          assert.equal(await page.getByLabel(labels[id], { exact: true }).isDisabled(), true);
          assert.equal(await page.getByRole("button", { name: saveLabel(id), exact: true }).isDisabled(), true);
          await page.getByLabel(labels[id], { exact: true }).evaluate(node => node.form.requestSubmit());
          assert.equal((await observations(page)).filter(call => call.operation === mutation(id)).length, 1); record("permission-denial-prevents-further-mutation");
        }
      }
    } else if (caseId === "validation") {
      await edit(page, id, "invalid"); await page.getByLabel("Retention days", { exact: true }).fill("0"); await save(page, id);
      await visible(page, "Enter a valid notification email."); await visible(page, "Use a whole number from 1 to 365.");
      assert.equal(await page.getByLabel(labels[id], { exact: true }).getAttribute("aria-invalid"), "true");
      assert.equal((await observations(page)).filter(call => call.operation === mutation(id)).length, 0); record("field-validation-prevents-service-mutation");
    } else if (caseId === "dirty-reset") {
      await edit(page, id); await visible(page, "You have unsaved changes.");
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await inputEquals(page.getByLabel(labels[id], { exact: true }), baseline(id)); await visible(page, "All changes saved.");
      assert.equal((await observations(page)).filter(call => call.operation === mutation(id)).length, 0); record("reset-restores-baseline-without-saving");
    } else if (["pagination", "filter-reset", "sort-reset"].includes(caseId)) {
      await page.getByRole("button", { name: "Go to next page", exact: true }).click(); await visible(page, "Page 2 of 3");
      await page.getByRole("button", { name: "Resource 11", exact: true }).waitFor();
      await waitCalls(page, calls => calls.at(-1)?.operation === "list" && calls.at(-1).input.pageIndex === 1 && calls.at(-1).status === "fulfilled");
      if (caseId === "pagination") {
        await page.getByRole("button", { name: "Go to previous page", exact: true }).click(); await visible(page, "Page 1 of 3");
        await page.getByRole("button", { name: "Resource 01", exact: true }).waitFor();
        await waitCalls(page, calls => calls.at(-1)?.operation === "list" && calls.at(-1).input.pageIndex === 0 && calls.at(-1).status === "fulfilled");
        record("page-navigation-changes-service-query-and-rows");
      } else if (caseId === "filter-reset") {
        await page.getByLabel("Search resources", { exact: true }).fill("26");
        await page.getByRole("button", { name: "Resource 26", exact: true }).waitFor(); await visible(page, "Page 1 of 1");
        await waitCalls(page, calls => calls.some(call => call.input?.search === "26" && call.input.pageIndex === 0 && call.status === "fulfilled"));
        assert.equal(await page.getByRole("button", { name: /^Resource \d\d$/ }).count(), 1); record("filter-resets-pagination-before-service-read");
      } else {
        await page.getByRole("button", { name: "Name", exact: true }).click();
        await page.getByRole("menuitemradio", { name: "Descending", exact: true }).click(); await visible(page, "Page 1 of 3");
        await waitCalls(page, calls => calls.some(call => call.input?.direction === "desc" && call.input.pageIndex === 0 && call.status === "fulfilled"));
        assert.equal(await page.getByRole("button", { name: /^Resource \d\d$/ }).first().textContent(), "Resource 27"); record("sort-resets-pagination-and-orders-server-results");
      }
    } else throw new Error("No implemented state case");
  }
  assert.ok(result.length); return result;
}

async function activeTarget(page) {
  return page.evaluate(() => {
    const node = document.activeElement;
    return (node?.getAttribute("aria-label") || node?.labels?.[0]?.textContent || node?.textContent || node?.tagName || "unknown").trim().slice(0, 256);
  });
}
async function key(page, value, steps) {
  const target = await activeTarget(page);
  await page.keyboard.press(value); steps.push({ key: value, target });
}
async function tabTo(page, locator, steps) {
  await locator.waitFor();
  for (let count = 0; count < 64; count++) {
    if (await locator.evaluate(node => node === document.activeElement)) return;
    await key(page, "Tab", steps);
  }
  throw new Error("Target is not reachable using Tab");
}
async function typeFocused(page, text) { await page.keyboard.press("ControlOrMeta+A"); await page.keyboard.type(text); }
async function keyboardCheck(page, origin, id, browser) {
  const steps = [], assertions = [];
  await open(page, origin, id); await ready(page, id);
  await tabTo(page, page.getByLabel(labels[id], { exact: true }), steps);
  if (id === "resource-list") {
    await typeFocused(page, "2"); await visible(page, "Page 1 of 1");
    await inputEquals(page.getByLabel(labels[id], { exact: true }), "2");
    // Exercise the installed select using its keyboard interface as well as the search input.
    await tabTo(page, page.getByRole("combobox", { name: "Status", exact: true }), steps); await key(page, "Space", steps);
    await key(page, "ArrowDown", steps); await key(page, "Enter", steps);
    await waitCalls(page, calls => calls.some(call => call.operation === "list" && call.input.search === "2" && call.input.status !== "all" && call.status === "fulfilled"));
    assertions.push({ name: "filter", passed: true });
    const row = page.getByRole("button", { name: /^Resource \d\d$/ }).first();
    const name = (await row.textContent()).trim();
    await tabTo(page, row, steps); await key(page, "Enter", steps);
    await inputEquals(page.getByLabel("Resource name", { exact: true }), name); assertions.push({ name: "open-detail", passed: true });
    await tabTo(page, page.getByRole("button", { name: "Back to resources", exact: true }), steps); await key(page, "Enter", steps);
    await inputEquals(page.getByLabel("Search resources", { exact: true }), "2");
    assert.equal(await page.getByRole("main", { name: "Example content" }).evaluate(node => node === document.activeElement), true);
    assertions.push({ name: "return-context", passed: true });
  } else {
    await typeFocused(page, draft(id)); await inputEquals(page.getByLabel(labels[id], { exact: true }), draft(id));
    assertions.push({ name: "edit", passed: true });
    await tabTo(page, page.getByRole("button", { name: saveLabel(id), exact: true }), steps); await key(page, "Enter", steps);
    await assertSaved(page, id); assertions.push({ name: "save", passed: true });
    if (id === "resource-detail") {
      await tabTo(page, page.getByRole("button", { name: "Back to resources", exact: true }), steps); await key(page, "Enter", steps);
      await page.getByLabel("Search resources", { exact: true }).waitFor(); assertions.push({ name: "back", passed: true });
    } else {
      await tabTo(page, page.getByLabel(labels[id], { exact: true }), steps); await typeFocused(page, "reset@example.com");
      await tabTo(page, page.getByRole("button", { name: "Reset", exact: true }), steps); await key(page, "Enter", steps);
      await inputEquals(page.getByLabel(labels[id], { exact: true }), draft(id)); assertions.push({ name: "reset", passed: true });
    }
  }
  return { browser, steps, assertions };
}
async function viewportCheck(page, origin, id, browser, width, output) {
  await open(page, origin, id); await ready(page, id);
  const target = page.getByLabel(labels[id], { exact: true });
  const steps = [];
  await tabTo(page, target, steps);
  const geometry = await target.evaluate(node => {
    const style = getComputedStyle(node), box = node.getBoundingClientRect();
    return { focused: node === document.activeElement && node.matches(":focus-visible"),
      indicator: (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== "none",
      reachable: box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0 && box.right <= innerWidth && box.bottom <= innerHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth || document.body.scrollWidth > innerWidth,
      width: innerWidth, height: innerHeight };
  });
  assert.equal(geometry.width, width); assert.equal(geometry.focused, true); assert.equal(geometry.indicator, true);
  assert.equal(geometry.reachable, true); assert.equal(geometry.horizontalOverflow, false);
  if (id !== "resource-list") {
    await typeFocused(page, draft(id)); await tabTo(page, page.getByRole("button", { name: saveLabel(id), exact: true }), steps);
    const box = await page.getByRole("button", { name: saveLabel(id), exact: true }).boundingBox();
    assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= geometry.height);
  }
  const png = await page.screenshot({ type: "png", fullPage: false, animations: "disabled" });
  const filename = `${id}-${width}.png`;
  await writeFile(path.join(output, filename), png, { flag: "wx" });
  return { browser, width, height: geometry.height, horizontalOverflow: false, focusVisible: true,
    screenshot: { path: filename, bytes: png.length, sha256: sha256(png) }, assertions: [{ name: "keyboard-target-reachable-with-visible-focus-and-no-page-overflow", passed: true }] };
}

/** All contexts, images and outcomes come from this run; no injectable browser or success callback. */
export async function runExampleBrowserChecks(origin, declarations, output, { timeoutMs = 240000 } = {}) {
  origin = browserOrigin(origin); declarations = exampleDeclarationsSchema.parse(declarations);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000) throw new Error("Invalid browser worker budget");
  await mkdir(output, { mode: 0o700 });
  let server, browser, current = null;
  const results = [], logs = [];
  const killOwnedBrowser = () => {
    const child = server?.process();
    if (child && child.exitCode === null) {
      try { if (process.platform === "win32") child.kill("SIGKILL"); else process.kill(-child.pid, "SIGKILL"); } catch { /* Already closed. */ }
    }
  };
  const deadline = setTimeout(() => { killOwnedBrowser(); }, timeoutMs);
  try {
    server = await chromium.launchServer({ headless: true, timeout: Math.min(30000, timeoutMs), env: { ...process.env, TZ: "UTC" } });
    browser = await chromium.connect(server.wsEndpoint());
    const browserInfo = { name: "chromium", version: browser.version() };
    const execute = async (id, name, action, width = 1440) => {
      current = { exampleId: id, check: name };
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale: "en-US", timezoneId: "UTC", colorScheme: "light", reducedMotion: "reduce" });
      const page = await context.newPage(); page.setDefaultTimeout(8000); page.setDefaultNavigationTimeout(12000);
      const pageErrors = []; page.on("pageerror", error => pageErrors.push(error.message));
      try {
        const value = await action(page);
        assert.equal(pageErrors.length, 0, "Uncaught page errors");
        logs.push({ ...current, status: "passed", observations: await observations(page), pageErrors });
        return value;
      } catch (error) {
        const name = `${id}-${current.check.replace(/[^a-z0-9-]/g, "-")}-failure.png`;
        try { await page.screenshot({ path: path.join(output, name), type: "png", timeout: 1000 }); } catch { /* Closed/failed browser cannot capture. */ }
        logs.push({ ...current, status: "failed", observations: await observations(page).catch(() => null), pageErrors });
        throw error;
      } finally { await context.close(); }
    };
    for (const declaration of declarations.examples) {
      const id = declaration.exampleId, cases = [];
      for (const caseId of exampleStateCases[id]) {
        if (declaration.notApplicable[caseId]) cases.push({ caseId, status: "not-applicable", reason: declaration.notApplicable[caseId] });
        else cases.push({ caseId, status: "passed", assertions: await execute(id, caseId, page => stateCase(page, origin, id, caseId)) });
      }
      const keyboard = await execute(id, "keyboard", page => keyboardCheck(page, origin, id, browserInfo));
      const viewports = [];
      for (const width of [390, 1440]) viewports.push(await execute(id, `viewport-${width}`, page => viewportCheck(page, origin, id, browserInfo, width, output), width));
      results.push({ exampleId: id, states: { cases }, keyboard, viewports });
      await writeFile(path.join(output, `${id}.observations.json`), serialize(results.at(-1)), { flag: "wx", mode: 0o600 });
    }
    current = null;
    const report = { schemaVersion: 1, kind: "agent-example-browser-observations", scope: "actual-browser-and-deterministic-example-api-not-published-installation", results };
    await writeFile(path.join(output, "observations.json"), serialize(report), { flag: "wx", mode: 0o600 });
    return report;
  } catch (error) {
    await writeFile(path.join(output, "failure.json"), serialize({ schemaVersion: 1, kind: "agent-example-browser-failure", status: "failed", current,
      code: error.name === "AssertionError" ? "BROWSER_ASSERTION" : "BROWSER_EXECUTION", message: String(error.message).slice(0, 2000), completed: results.map(result => result.exampleId) }), { flag: "wx", mode: 0o600 });
    throw error;
  } finally {
    clearTimeout(deadline);
    await writeFile(path.join(output, "private-observations.json"), serialize(logs), { flag: "wx", mode: 0o600 });
    const forceClose = setTimeout(killOwnedBrowser, 2000);
    try { await browser?.close(); await server?.close(); } finally { clearTimeout(forceClose); killOwnedBrowser(); }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [origin, declarationFile, output, budget] = process.argv.slice(2);
  if (process.argv.length !== 6 || !path.isAbsolute(declarationFile) || !path.isAbsolute(output) || !/^\d+$/.test(budget ?? "")) throw new Error("Browser worker needs origin, absolute declaration/output paths and a millisecond budget");
  const bytes = await readFile(declarationFile);
  if (bytes.length > 256 * 1024) throw new Error("Example declaration budget");
  await runExampleBrowserChecks(origin, JSON.parse(bytes.toString("utf8")), output, { timeoutMs: Number(budget) });
}
