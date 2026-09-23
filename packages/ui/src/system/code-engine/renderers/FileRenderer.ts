import type { ElementContent, Element as HASTElement } from 'hast';
import { toHtml } from 'hast-util-to-html';

import {
  DEFAULT_RENDER_RANGE,
  DEFAULT_THEMES,
  DEFAULT_TOKENIZE_MAX_LENGTH,
} from '../constants';
import type { TextDocument } from '../editor/textDocument';
import { areLanguagesAttached } from '../highlighter/languages/areLanguagesAttached';
import {
  getHighlighterIfLoaded,
  getSharedHighlighter,
} from '../highlighter/shared_highlighter';
import { areThemesAttached } from '../highlighter/themes/areThemesAttached';
import type {
  BaseCodeOptions,
  CodeHighlightState,
  DiffsHighlighter,
  FileContents,
  FileHeaderRenderMode,
  HighlightedToken,
  LineAnnotation,
  RenderedFileASTCache,
  RenderFileOptions,
  RenderFileResult,
  RenderRange,
  SupportedLanguages,
  ThemedFileResult,
} from '../types';
import { applyLineTextWithNewline } from '../utils/applyLineTextWithNewline';
import { areFileRenderOptionsEqual } from '../utils/areFileRenderOptionsEqual';
import { areFileTargetsEqual } from '../utils/areFileTargetsEqual';
import { areRenderRangesEqual } from '../utils/areRenderRangesEqual';
import { linesFromFileContents } from '../utils/computeFileOffsets';
import { createAnnotationElement } from '../utils/createAnnotationElement';
import { createContentColumn } from '../utils/createContentColumn';
import { createFileHeaderElement } from '../utils/createFileHeaderElement';
import { createPreElement } from '../utils/createPreElement';
import { getFiletypeFromFileName } from '../utils/getFiletypeFromFileName';
import { getHighlighterOptions } from '../utils/getHighlighterOptions';
import { getLineAnnotationName } from '../utils/getLineAnnotationName';
import {
  createGutterGap,
  createGutterItem,
  createGutterWrapper,
  createHastElement,
} from '../utils/hast_utils';
import {
  FILE_ANNOTATION_HUNK_INDEX,
  FILE_ANNOTATION_LINE_INDEX,
  getFileAnnotations,
  shouldRenderFileAnnotations,
} from '../utils/includesFileAnnotations';
import { isDefaultRenderRange } from '../utils/isDefaultRenderRange';
import { isFilePlainText } from '../utils/isFilePlainText';
import { renderFileWithHighlighter } from '../utils/renderFileWithHighlighter';
import { renderPlainFile } from '../utils/renderPlainFile';
import type { WorkerPoolManager } from '../worker';
import type { FileRendererInstance } from '../worker/types';

type AnnotationLineMap<LAnnotation> = Record<
  number,
  LineAnnotation<LAnnotation>[] | undefined
>;

interface GetRenderOptionsReturn {
  options: RenderFileOptions;
  forceHighlight: boolean;
}

interface PendingHighlightResult extends RenderFileResult {
  file: FileContents;
  highlighted: boolean;
}

interface FileRenderCache extends RenderedFileASTCache {
  // hydrate() describes DOM that already exists, even when no reusable AST
  // was available for that server-rendered content.
  hydrated?: boolean;
}

interface HighlightTask {
  file: FileContents;
  options: RenderFileOptions;
  state: CodeHighlightState;
  started: boolean;
  settled: boolean;
  timeoutMs: number;
  plainReason: 'text' | 'empty' | 'size-limit' | undefined;
  timer?: ReturnType<typeof setTimeout>;
  worker?: FileRendererInstance;
}

export interface FileRenderResult {
  file: FileContents;
  gutterAST: ElementContent[];
  contentAST: ElementContent[];
  preAST: HASTElement;
  headerAST: HASTElement | undefined;
  css: string;
  totalLines: number;
  themeStyles: string;
  baseThemeType: 'light' | 'dark' | undefined;
  rowCount: number;
  bufferBefore: number;
  bufferAfter: number;
}

interface LineCache {
  cacheKey: string | undefined;
  file: FileContents;
  sourceContents: string;
  lines: string[];
}

// Explicit keys may share cached lines across equivalent file objects. Unkeyed
// files stay isolated by object identity while still supporting edit recycle.
function isLineCacheForFile(lineCache: LineCache, file: FileContents): boolean {
  return file.cacheKey == null
    ? lineCache.file === file && lineCache.sourceContents === file.contents
    : lineCache.cacheKey === file.cacheKey;
}

export interface FileRendererOptions extends BaseCodeOptions {
  headerRenderMode?: FileHeaderRenderMode;
}

let instanceId = -1;

export class FileRenderer<LAnnotation = undefined> {
  readonly __id: string = `file-renderer:${++instanceId}`;

  private highlighter: DiffsHighlighter | undefined;
  private highlightTask: HighlightTask | undefined;
  public highlightTimeoutMs = 15_000;

  public getHighlightState(): CodeHighlightState | undefined {
    return this.highlightTask?.state;
  }

  private clearHighlightTask(): void {
    const task = this.highlightTask;
    this.highlightTask = undefined;
    if (task?.timer != null) clearTimeout(task.timer);
    if (task?.worker != null) this.workerManager?.cleanUpTasks(task.worker);
  }

  public retryHighlight(): boolean {
    if (this.highlightTask?.state.status !== 'error') return false;
    this.clearHighlightTask();
    this.pendingHighlightResult = undefined;
    return true;
  }

  private ensureHighlightTask(
    file: FileContents,
    options: RenderFileOptions,
    plainReason: HighlightTask['plainReason']
  ): HighlightTask {
    const previous = this.highlightTask;
    if (
      previous != null &&
      previous.plainReason === plainReason &&
      areFileTargetsEqual(previous.file, file) &&
      areFileRenderOptionsEqual(previous.options, options)
    )
      return previous;
    this.clearHighlightTask();
    const base = {
      fileName: file.name,
      language: file.lang ?? getFiletypeFromFileName(file.name),
    };
    return (this.highlightTask = {
      file: { ...file },
      options,
      started: false,
      settled: false,
      timeoutMs:
        Number.isFinite(this.highlightTimeoutMs) && this.highlightTimeoutMs >= 0
          ? this.highlightTimeoutMs
          : 15_000,
      plainReason,
      state:
        plainReason == null
          ? { ...base, status: 'loading' }
          : { ...base, status: 'plain', reason: plainReason },
    });
  }

  private failHighlight(
    task: HighlightTask,
    error: unknown,
    reason: 'load-or-render' | 'timeout' = 'load-or-render'
  ): void {
    if (this.highlightTask !== task || task.settled) return;
    task.settled = true;
    if (task.timer != null) clearTimeout(task.timer);
    // Hydrated markup remains usable even if rebuilding its local AST fails.
    if (task.state.status !== 'ready') {
      task.state = {
        fileName: task.file.name,
        language: task.file.lang ?? getFiletypeFromFileName(task.file.name),
        status: 'error',
        reason,
        error,
      };
    }
    if (task.worker != null) this.workerManager?.cleanUpTasks(task.worker);
    this.scheduleRenderUpdate();
  }

  private scheduleRenderUpdate(): void {
    const task = this.highlightTask;
    queueMicrotask(() => {
      if (this.highlightTask === task) this.onRenderUpdate?.();
    });
  }

  private startHighlight(task: HighlightTask, worker: boolean): void {
    if (task.started || task.settled) return;
    task.started = true;
    const timeout = task.timeoutMs;
    if (timeout > 0 && task.timer == null)
      task.timer = setTimeout(
        () =>
          this.failHighlight(
            task,
            new Error('Syntax highlighting timed out'),
            'timeout'
          ),
        timeout
      );
    const succeed = (result: ThemedFileResult, options: RenderFileOptions) => {
      if (this.highlightTask !== task || task.settled) return;
      task.settled = true;
      if (task.timer != null) clearTimeout(task.timer);
      this.applyHighlightResult(task.file, result, options);
    };
    if (worker && this.workerManager != null) {
      // A per-attempt subscriber gives worker callbacks an immutable identity,
      // including A -> B -> A and retries of the same file.
      task.worker = {
        __id: `${this.__id}:highlight`,
        onHighlightSuccess: (_file, result, options) =>
          succeed(result, options),
        onHighlightError: (error) => this.failHighlight(task, error),
      };
      this.workerManager.highlightFileAST(task.worker, task.file);
    } else {
      void this.asyncHighlight(task.file).then(
        ({ result, options }) => succeed(result, options),
        (error: unknown) => this.failHighlight(task, error)
      );
    }
  }
  // The latest file requested by the component. The render cache may
  // intentionally keep displaying an older highlighted file while this one
  // is highlighted in the background.
  private file: FileContents | undefined;

  private renderCache: FileRenderCache | undefined;
  // Completed background work waits here until the next render can update its
  // DOM and layout together.
  private pendingHighlightResult: PendingHighlightResult | undefined;

  private computedLang: SupportedLanguages = 'text';
  private lineAnnotations: AnnotationLineMap<LAnnotation> = {};
  private lineCache: LineCache | undefined;
  private pendingStructuralRows: Map<number, HASTElement> | undefined;
  private textDocumentCache = new WeakMap<
    FileContents,
    TextDocument<'file', LAnnotation>
  >();

  // Edit-session state: while active, this renderer stays on the main thread
  // with editor-compatible token markup — the editor's caret/selection
  // mapping needs the token transformer, and the pool's global options are
  // not guaranteed to produce it. The pool keeps serving every surface
  // without a session.
  private editSessionActive = false;

  public get fileCache(): FileContents | undefined {
    return this.renderCache?.file;
  }

  constructor(
    public options: FileRendererOptions = { theme: DEFAULT_THEMES },
    private annotationSlotName: (
      annotation: LineAnnotation<LAnnotation>
    ) => string = getLineAnnotationName,
    private onRenderUpdate?: () => unknown,
    private workerManager?: WorkerPoolManager | undefined
  ) {
    if (workerManager?.isWorkingPool() !== true) {
      this.highlighter = areThemesAttached(options.theme ?? DEFAULT_THEMES)
        ? getHighlighterIfLoaded()
        : undefined;
    }
  }

  public setOptions(options: FileRendererOptions): void {
    this.options = options;
  }

  public mergeOptions(options: Partial<FileRendererOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public setLineAnnotations(
    lineAnnotations: LineAnnotation<LAnnotation>[]
  ): void {
    this.lineAnnotations = {};
    for (const annotation of lineAnnotations) {
      const arr = this.lineAnnotations[annotation.lineNumber] ?? [];
      this.lineAnnotations[annotation.lineNumber] = arr;
      arr.push(annotation);
    }
  }

  public cleanUp(): void {
    this.recycle();
    this.workerManager = undefined;
    this.onRenderUpdate = undefined;
  }

  /**
   * Enter edit-session mode: rendering happens locally with the token
   * transformer forced on, and worker-pool requests/results are suspended
   * for this renderer. Called on initial editor association and whenever its
   * rendering resumes after recycle.
   */
  public beginEditSession(
    file: FileContents,
    externalFile?: FileContents
  ): void {
    const { editSessionActive: wasAlreadyActive, renderCache } = this;
    this.editSessionActive = true;
    if (!wasAlreadyActive) {
      this.clearHighlightTask();
      this.pendingHighlightResult = undefined;
    }

    this.file = file;
    if (renderCache == null) {
      return;
    }
    // Edit updates call this again before each write. That cache is already
    // private and must retain plain-text session results.
    if (wasAlreadyActive && renderCache.file === file) {
      return;
    }
    const { options } = this.getRenderOptions(file);
    const cacheBelongsToSession = renderCache.file === file;
    const cacheBelongsToExternal =
      externalFile != null &&
      areFileTargetsEqual(renderCache.file, externalFile);
    const { result } = renderCache;
    if (
      !renderCache.highlighted ||
      result == null ||
      !areFileRenderOptionsEqual(renderCache.options, options) ||
      (!cacheBelongsToSession && !cacheBelongsToExternal)
    ) {
      this.clearRenderCache();
      this.lineCache = undefined;
      this.textDocumentCache = new WeakMap();
      return;
    }
    if (cacheBelongsToSession) {
      return;
    }

    this.renderCache = {
      ...renderCache,
      file,
      result: {
        ...result,
        code: [...result.code],
      },
    };
    const { lineCache } = this;
    if (
      lineCache != null &&
      externalFile != null &&
      isLineCacheForFile(lineCache, externalFile)
    ) {
      this.lineCache = {
        cacheKey: undefined,
        file,
        sourceContents: file.contents,
        lines: lineCache.lines,
      };
    } else {
      this.lineCache = undefined;
    }
  }

  /**
   * Leave edit-session mode. Rendering returns to the pool when one works.
   * When `settledFile` has the content the cache already shows, the cache
   * adopts it as its identity so the next render treats it as current
   * instead of a new file.
   */
  public endEditSession(settledFile?: FileContents): void {
    this.editSessionActive = false;
    this.pendingHighlightResult = undefined;
    const { renderCache } = this;
    if (
      settledFile == null ||
      renderCache == null ||
      renderCache.file === settledFile ||
      !areFileTargetsEqual(renderCache.file, settledFile)
    ) {
      return;
    }
    renderCache.file = settledFile;
  }

  /**
   * Ensures that the DOM is compatible with editor render updates
   */
  public editorRenderReady(): boolean {
    return (
      this.renderCache?.options.useTokenTransformer === true &&
      this.renderCache.highlighted &&
      this.renderCache.result != null
    );
  }

  public recycle(): void {
    this.clearRenderCache();
    this.highlighter = undefined;
    this.workerManager?.cleanUpTasks(this);
    this.lineCache = undefined;
    this.file = undefined;
    // The session flag re-seeds on the next editor attach (beginEditSession).
    this.endEditSession();
    // The edited-document cache is only coherent alongside the render cache
    // it patched. Keeping it across a recycle would let getLineCount report
    // edit-session line counts (keyed by the long-lived file object) against
    // a result rebuilt from the file's own contents, which processFileResult
    // treats as a missing-line error.
    this.textDocumentCache = new WeakMap();
  }

  public clearRenderCache(): void {
    this.clearHighlightTask();
    this.pendingStructuralRows = undefined;
    this.renderCache = undefined;
    this.pendingHighlightResult = undefined;
  }

  public hydrate(file: FileContents): void {
    this.file = file;
    const { options } = this.getRenderOptions(file);
    const lines = this.getOrCreateLineCache(file);
    const massiveFile = isFileMassive(
      lines.length,
      this.getTokenizeMaxLength()
    );
    let cache = this.workerManager?.getFileResultCache(file);
    if (cache != null && !areFileRenderOptionsEqual(options, cache.options)) {
      cache = undefined;
    }
    this.renderCache ??= {
      file,
      hydrated: true,
      options,
      highlighted: !massiveFile && !isFilePlainText(file),
      result: massiveFile ? undefined : cache?.result,
      // FIXME(amadeus): Add support for renderRanges
      renderRange: undefined,
    };
    // Start tracked background work while preserving hydrated markup.
    this.renderFile(file);
  }

  private getLocalHighlightTheme(): RenderFileOptions['theme'] {
    return (
      this.workerManager?.getFileRenderOptions().theme ??
      this.options.theme ??
      DEFAULT_THEMES
    );
  }

  public getEffectiveCodeOptions(): Pick<
    BaseCodeOptions,
    'theme' | 'tokenizeMaxLineLength'
  > {
    const poolOptions =
      this.workerManager?.isWorkingPool() === true
        ? this.workerManager.getFileRenderOptions()
        : undefined;
    return {
      theme: this.getLocalHighlightTheme(),
      tokenizeMaxLineLength:
        poolOptions?.tokenizeMaxLineLength ??
        this.options.tokenizeMaxLineLength,
    };
  }

  private getRenderOptions(file: FileContents): GetRenderOptionsReturn {
    const options: RenderFileOptions = (() => {
      if (this.workerManager?.isWorkingPool() === true) {
        const poolOptions = this.workerManager.getFileRenderOptions();
        // Active edit sessions require `useTokenTransformer: true`
        if (
          this.editSessionActive &&
          poolOptions.useTokenTransformer !== true
        ) {
          return { ...poolOptions, useTokenTransformer: true };
        }
        return poolOptions;
      }
      const { tokenizeMaxLineLength = 1000 } = this.options;
      return {
        theme: this.getLocalHighlightTheme(),
        useTokenTransformer:
          this.editSessionActive || this.options.useTokenTransformer === true,
        tokenizeMaxLineLength,
      };
    })();
    const { renderCache } = this;
    if (renderCache?.result == null) {
      return { options, forceHighlight: true };
    }
    if (
      !areFileTargetsEqual(file, renderCache.file) ||
      !areFileRenderOptionsEqual(options, renderCache.options)
    ) {
      return { options, forceHighlight: true };
    }
    return { options, forceHighlight: false };
  }

  /**
   * Returns the file that the next synchronous render can commit without
   * changing the current render cache. Virtualized layouts use this to stay
   * aligned with the DOM while a replacement highlight is still pending.
   */
  public getFileForNextRender(file: FileContents): FileContents {
    const { options } = this.getRenderOptions(file);
    if (this.getReadyRenderResult(file, options) != null) {
      return file;
    }

    const { renderCache } = this;
    if (renderCache == null) {
      return file;
    }
    if (areFileTargetsEqual(renderCache.file, file)) {
      return renderCache.file;
    }

    const lines = linesFromFileContents(file.contents);
    const forcePlainText =
      file.contents.length === 0 ||
      isFilePlainText(file) ||
      isFileMassive(lines.length, this.getTokenizeMaxLength());

    return this.canRenderFile(file, options, forcePlainText)
      ? file
      : renderCache.file;
  }

  private canRenderFile(
    file: FileContents,
    options: RenderFileOptions,
    forcePlainText: boolean
  ): boolean {
    // Read-only surfaces can always install the current file's plain fallback.
    if (!this.editSessionActive) return true;
    const { renderCache } = this;
    if (renderCache == null || areFileTargetsEqual(renderCache.file, file)) {
      return true;
    }
    if (forcePlainText) {
      return (
        (renderCache.result == null && renderCache.hydrated !== true) ||
        this.workerManager?.isWorkingPool() === true ||
        (this.highlighter != null && areThemesAttached(options.theme))
      );
    }
    // Hydration has highlighted DOM without a local AST. It is still active
    // rendered content and must remain visible while a non-plain replacement
    // is prepared.
    if (renderCache.result == null && renderCache.hydrated !== true) {
      return true;
    }

    if (
      !this.editSessionActive &&
      this.workerManager?.isWorkingPool() === true
    ) {
      return !renderCache.highlighted;
    }

    return this.highlighter != null && areThemesAttached(options.theme);
  }

  public getOrCreateLineCache(file: FileContents): string[] {
    let { lineCache } = this;
    if (lineCache == null || !isLineCacheForFile(lineCache, file)) {
      lineCache = {
        cacheKey: file.cacheKey,
        file,
        sourceContents: file.contents,
        lines: linesFromFileContents(file.contents),
      };
    }
    this.lineCache = lineCache;
    return lineCache.lines;
  }

  // when a emitLineCountChange is called,
  // calculate the line count using the cached text document
  public getLineCount(file: FileContents): number {
    const lines = this.getOrCreateLineCache(file);
    return this.textDocumentCache.get(file)?.lineCount ?? lines.length;
  }

  public updateRenderCache(
    dirtyLines: Map<number, Array<HighlightedToken>>,
    themeType: 'dark' | 'light',
    lineCountChangeInFlight = false
  ): void {
    this.pendingStructuralRows = undefined;
    const { renderCache } = this;
    if (renderCache == null) {
      return;
    }
    const { file, result } = renderCache;
    if (result == null) {
      return;
    }
    const pendingStructuralRows = lineCountChangeInFlight
      ? new Map<number, HASTElement>()
      : undefined;
    this.pendingStructuralRows = pendingStructuralRows;
    // Same-line edits can update the document cache immediately. Structural
    // rows use post-edit indexes, so hold them until applyDocumentChange has
    // shifted the old cache; writing now would overwrite rows that must move.
    const lineCache =
      this.lineCache != null && isLineCacheForFile(this.lineCache, file)
        ? this.lineCache
        : undefined;
    for (const [line, tokens] of dirtyLines) {
      if (
        pendingStructuralRows == null &&
        lineCache != null &&
        line < lineCache.lines.length
      ) {
        const lineText = tokens.map((token) => token[2]).join('');
        lineCache.lines[line] = applyLineTextWithNewline(
          lineCache.lines[line] ?? '',
          lineText
        );
      }
      const row: HASTElement = {
        type: 'element',
        tagName: 'div',
        properties: {
          'data-line': line + 1,
          'data-line-type': 'context',
          'data-line-index': line,
        },
        children: tokens.map(([char, fg, text]) => {
          if (char === 0 && fg === '') {
            if (text === '') {
              return {
                type: 'element',
                tagName: 'br',
                properties: {},
                children: [],
              };
            }
            return { type: 'text', value: text };
          }
          return {
            type: 'element',
            tagName: 'span',
            properties: {
              'data-char': char,
              style: `color:${fg};`,
            },
            children: [{ type: 'text', value: text }],
          };
        }),
      };
      if (pendingStructuralRows != null) {
        pendingStructuralRows.set(line, row);
      } else {
        result.code[line] = row;
      }
    }

    result.baseThemeType = themeType;
    renderCache.isDirty = true;
    if (pendingStructuralRows == null && lineCache != null) {
      file.contents = lineCache.lines.join('');
      lineCache.sourceContents = file.contents;
    }
  }

  // normally triggered by the host when the document line count changes
  public applyDocumentChange(
    textDocument: TextDocument<'file', LAnnotation>
  ): void {
    const { pendingStructuralRows, renderCache } = this;
    this.pendingStructuralRows = undefined;
    if (renderCache == null) {
      return;
    }
    const { file, result } = renderCache;
    // Without a result there is nothing to reconcile the document against, so
    // do not record it either: the document cache must never claim line
    // counts the (possibly still highlighting) result cannot back, or the
    // async highlight pass would process lines that do not exist.
    if (result == null) {
      return undefined;
    }
    // Structural edits renumber cached HAST rows. Keep the unchanged prefix
    // and suffix, and plain-fill only the window that still needs tokenizing.
    const previousLines =
      this.lineCache != null && isLineCacheForFile(this.lineCache, file)
        ? this.lineCache.lines
        : linesFromFileContents(file.contents);
    const nextLines = linesFromFileContents(textDocument.getText());
    if (previousLines.length !== nextLines.length) {
      const maxShared = Math.min(previousLines.length, nextLines.length);
      let prefix = 0;
      while (
        prefix < maxShared &&
        previousLines[prefix] === nextLines[prefix]
      ) {
        prefix++;
      }
      let suffix = 0;
      while (
        suffix < maxShared - prefix &&
        previousLines[previousLines.length - 1 - suffix] ===
          nextLines[nextLines.length - 1 - suffix]
      ) {
        suffix++;
      }

      const previousCode = result.code;
      result.code = new Array(nextLines.length);
      for (let i = 0; i < prefix; i++) {
        result.code[i] = previousCode[i];
      }
      for (let i = 0; i < suffix; i++) {
        result.code[nextLines.length - 1 - i] =
          previousCode[previousLines.length - 1 - i];
      }
      if (pendingStructuralRows !== undefined) {
        for (const [line, row] of pendingStructuralRows) {
          if (line < nextLines.length) {
            result.code[line] = row;
          }
        }
      }
      for (let i = prefix; i < nextLines.length - suffix; i++) {
        result.code[i] ??= {
          type: 'element',
          tagName: 'div',
          properties: {
            'data-line': i + 1,
            'data-line-type': 'context',
            'data-line-index': i,
          },
          children: [
            {
              type: 'element',
              tagName: 'span',
              properties: {
                'data-char': 0,
              },
              children: [
                {
                  type: 'text',
                  value: textDocument.getLineText(i),
                },
              ],
            },
          ],
        };
      }
      for (let i = 0; i < result.code.length; i++) {
        const line = result.code[i];
        if (line?.type === 'element') {
          line.properties['data-line'] = i + 1;
          line.properties['data-line-index'] = i;
        }
      }
      renderCache.isDirty = true;
    }
    // Replace the old split-line cache with the authoritative edited document.
    this.lineCache = {
      cacheKey: file.cacheKey,
      file,
      sourceContents: file.contents,
      lines: nextLines,
    };
    this.textDocumentCache.set(file, textDocument);
    file.contents = textDocument.getText();
  }

  public renderFile(
    file: FileContents | undefined = this.file,
    renderRange: RenderRange = DEFAULT_RENDER_RANGE
  ): FileRenderResult | undefined {
    this.file = file;
    if (file == null) {
      this.clearHighlightTask();
      this.pendingHighlightResult = undefined;
      return undefined;
    }
    let { options, forceHighlight } = this.getRenderOptions(file);
    const readyResult = this.getReadyRenderResult(file, options);
    this.pendingHighlightResult = undefined;
    if (readyResult != null) {
      this.renderCache = {
        ...readyResult,
        file,
        renderRange: undefined,
      };
      forceHighlight = false;
    }
    this.renderCache ??= {
      file,
      highlighted: false,
      options,
      result: undefined,
      renderRange: undefined,
    };
    const lines = this.getOrCreateLineCache(file);
    const hasContent = file.contents.length > 0;
    const forcePlainText =
      !hasContent ||
      isFilePlainText(file) ||
      isFileMassive(lines.length, this.getTokenizeMaxLength());
    const plainReason = !hasContent
      ? 'empty'
      : isFilePlainText(file)
        ? 'text'
        : forcePlainText
          ? 'size-limit'
          : undefined;
    const task = this.ensureHighlightTask(file, options, plainReason);
    // A failed worker pool falls back to the main thread using the same target.
    if (
      task.worker != null &&
      this.workerManager?.isWorkingPool() !== true &&
      !task.settled
    ) {
      this.workerManager?.cleanUpTasks(task.worker);
      task.worker = undefined;
      task.started = false;
    }
    const preserveHydratedContent =
      this.renderCache.hydrated === true &&
      !forcePlainText &&
      this.renderCache.result == null &&
      this.renderCache.highlighted &&
      areFileTargetsEqual(file, this.renderCache.file) &&
      areFileRenderOptionsEqual(options, this.renderCache.options) &&
      isDefaultRenderRange(renderRange);
    if (preserveHydratedContent && task.state.status === 'loading') {
      task.state = {
        fileName: file.name,
        language: file.lang ?? getFiletypeFromFileName(file.name),
        status: 'ready',
      };
    }
    const canRenderFile = this.canRenderFile(file, options, forcePlainText);
    const newContent = !areFileTargetsEqual(file, this.renderCache.file);
    const newRenderRange = !areRenderRangesEqual(
      this.renderCache.renderRange,
      renderRange
    );
    if (
      !this.editSessionActive &&
      this.workerManager?.isWorkingPool() === true
    ) {
      if (
        canRenderFile &&
        !preserveHydratedContent &&
        (forcePlainText ||
          this.renderCache.result == null ||
          (!this.renderCache.highlighted && (newContent || newRenderRange)))
      ) {
        this.renderCache.file = file;
        this.renderCache.options = options;
        this.renderCache.highlighted = false;
        if (
          this.renderCache.result == null ||
          newContent ||
          newRenderRange ||
          forceHighlight
        ) {
          this.renderCache.result = this.workerManager.getPlainFileAST(
            file,
            renderRange.startingLine,
            renderRange.totalLines,
            lines
          );
        }
        this.renderCache.renderRange = renderRange;
      }

      if (
        !forcePlainText &&
        hasContent &&
        (!this.renderCache.highlighted || forceHighlight)
      ) {
        this.startHighlight(task, true);
      }
    } else {
      this.computedLang = file.lang ?? getFiletypeFromFileName(file.name);
      this.highlighter ??= getHighlighterIfLoaded();
      const hasThemes =
        this.highlighter != null && areThemesAttached(options.theme);
      const hasLangs =
        this.highlighter != null && areLanguagesAttached(this.computedLang);
      const canHighlight = !forcePlainText && hasLangs;

      // If we have any semblance of a highlighter with the correct theme(s)
      // attached, we can kick off some form of rendering.  If we don't have
      // the correct language, then we can render plain text and after kick off
      // an async job to get the highlighted AST
      if (
        canRenderFile &&
        !preserveHydratedContent &&
        task.state.status !== 'error' &&
        this.highlighter != null &&
        hasThemes &&
        (forceHighlight ||
          forcePlainText ||
          (!this.renderCache.highlighted && canHighlight) ||
          this.renderCache.result == null)
      ) {
        try {
          const { result, options } = this.renderFileWithHighlighter(
            file,
            this.highlighter,
            forcePlainText || !hasLangs
          );
          this.renderCache = {
            file,
            options,
            highlighted: canHighlight,
            result,
            renderRange: undefined,
          };
        } catch (error) {
          // Report after the current render has installed its readable fallback.
          queueMicrotask(() => this.failHighlight(task, error));
        }
      }

      // If we get in here it means we'll have to kick off an async highlight
      // process which will involve initializing the highlighter with new themes
      // and languages
      if (
        !forcePlainText &&
        (!hasThemes || !hasLangs || preserveHydratedContent)
      ) {
        this.startHighlight(task, false);
      }
    }

    // Even a completely cold engine must expose readable, escaped content.
    // Keep existing hydrated DOM until a corresponding AST becomes available.
    if (
      !preserveHydratedContent &&
      !this.editSessionActive &&
      (this.renderCache.result == null ||
        !areFileTargetsEqual(this.renderCache.file, file) ||
        (!this.renderCache.highlighted &&
          this.renderCache.renderRange != null &&
          !areRenderRangesEqual(this.renderCache.renderRange, renderRange)))
    ) {
      if (
        !this.renderCache.highlighted ||
        !areFileTargetsEqual(this.renderCache.file, file)
      ) {
        this.renderCache = {
          file,
          options,
          highlighted: false,
          result: renderPlainFile(lines, renderRange),
          renderRange,
        };
      }
    }
    if (
      this.renderCache.highlighted &&
      this.renderCache.result != null &&
      areFileTargetsEqual(this.renderCache.file, file) &&
      areFileRenderOptionsEqual(this.renderCache.options, options) &&
      task.state.status === 'loading'
    ) {
      task.state = {
        fileName: file.name,
        language: file.lang ?? getFiletypeFromFileName(file.name),
        status: 'ready',
      };
      task.settled = true;
      if (task.timer != null) clearTimeout(task.timer);
    }

    return this.renderCache.result != null
      ? this.processFileResult(
          this.renderCache.file,
          renderRange,
          this.renderCache.result
        )
      : undefined;
  }

  async asyncRender(
    file: FileContents,
    renderRange: RenderRange = DEFAULT_RENDER_RANGE
  ): Promise<FileRenderResult> {
    this.file = file;
    const { result } = await this.asyncHighlight(file);
    return this.processFileResult(file, renderRange, result);
  }

  private async asyncHighlight(file: FileContents): Promise<RenderFileResult> {
    const lines = this.getOrCreateLineCache(file);
    const forcePlainText =
      isFilePlainText(file) ||
      file.contents.length === 0 ||
      isFileMassive(lines.length, this.getTokenizeMaxLength());
    const options = this.getRenderOptions(file).options;
    const lang = forcePlainText
      ? 'text'
      : (file.lang ?? getFiletypeFromFileName(file.name));
    const highlighter = await getSharedHighlighter(
      getHighlighterOptions(lang, {
        theme: options.theme,
        preferredHighlighter:
          this.workerManager?.getPreferredHighlighter() ??
          this.options.preferredHighlighter,
      })
    );
    return {
      options,
      result: renderFileWithHighlighter(file, highlighter, options, {
        forcePlainText,
      }),
    };
  }

  private renderFileWithHighlighter(
    file: FileContents,
    highlighter: DiffsHighlighter,
    forcePlainText = false
  ): RenderFileResult {
    const { options } = this.getRenderOptions(file);
    const result = renderFileWithHighlighter(file, highlighter, options, {
      forcePlainText,
    });
    return { result, options };
  }

  private processFileResult(
    file: FileContents,
    renderRange: RenderRange,
    { code, themeStyles, baseThemeType }: ThemedFileResult
  ): FileRenderResult {
    const totalLines = this.getLineCount(file);
    const { disableFileHeader = false } = this.options;
    const contentArray: ElementContent[] = [];
    const gutter = createGutterWrapper();
    const endLine = Math.min(
      renderRange.startingLine + renderRange.totalLines,
      totalLines
    );
    let rowCount = 0;

    const fileLevelAnnotations = shouldRenderFileAnnotations(renderRange)
      ? getFileAnnotations(this.lineAnnotations)
      : undefined;
    if (fileLevelAnnotations != null) {
      gutter.children.push(createGutterGap('context', 'annotation', 1));
      contentArray.push(
        createAnnotationElement({
          type: 'annotation',
          hunkIndex: FILE_ANNOTATION_HUNK_INDEX,
          lineIndex: FILE_ANNOTATION_LINE_INDEX,
          annotations: fileLevelAnnotations.map((annotation) =>
            this.annotationSlotName(annotation)
          ),
        })
      );
      rowCount++;
    }

    for (
      let lineIndex = renderRange.startingLine;
      lineIndex < endLine;
      lineIndex++
    ) {
      const lineNumber = lineIndex + 1;

      // Sparse array - directly indexed by lineIndex
      const line = code[lineIndex];
      if (line == null) {
        const message = 'FileRenderer.processFileResult: Line doesnt exist';
        console.error(message, {
          name: file.name,
          lineIndex,
          lineNumber,
        });
        throw new Error(message);
      }

      // Add gutter line number
      gutter.children.push(
        createGutterItem('context', lineNumber, `${lineIndex}`)
      );
      contentArray.push(line);
      rowCount++;

      // Check annotations using ACTUAL line number from file
      const annotations = this.lineAnnotations[lineNumber];
      if (annotations != null) {
        gutter.children.push(createGutterGap('context', 'annotation', 1));
        contentArray.push(
          createAnnotationElement({
            type: 'annotation',
            hunkIndex: 0,
            lineIndex: lineNumber,
            annotations: annotations.map((annotation) =>
              this.annotationSlotName(annotation)
            ),
          })
        );
        rowCount++;
      }
    }

    // Finalize: wrap gutter and content
    gutter.properties.style = `grid-row: span ${rowCount}`;
    return {
      file,
      gutterAST: gutter.children ?? [],
      contentAST: contentArray,
      preAST: this.createPreElement(totalLines),
      headerAST: !disableFileHeader ? this.renderHeader(file) : undefined,
      totalLines: totalLines,
      rowCount,
      themeStyles: themeStyles,
      baseThemeType,
      bufferBefore: renderRange.bufferBefore,
      bufferAfter: renderRange.bufferAfter,
      css: '',
    };
  }

  private renderHeader(file: FileContents) {
    const { headerRenderMode = 'default', stickyHeader = false } = this.options;
    return createFileHeaderElement({
      fileOrDiff: file,
      mode: headerRenderMode,
      stickyHeader,
    });
  }

  public renderFullHTML(result: FileRenderResult): string {
    return toHtml(this.renderFullAST(result));
  }

  public renderFullAST(
    result: FileRenderResult,
    children: ElementContent[] = []
  ): HASTElement {
    children.push(
      createHastElement({
        tagName: 'code',
        children: this.renderCodeAST(result),
        properties: { 'data-code': '' },
      })
    );
    return { ...result.preAST, children };
  }

  public renderCodeAST(result: FileRenderResult): ElementContent[] {
    const gutter = createGutterWrapper();
    gutter.children = result.gutterAST;
    gutter.properties.style = `grid-row: span ${result.rowCount}`;
    const contentColumn = createContentColumn(
      result.contentAST,
      result.rowCount
    );
    return [gutter, contentColumn];
  }

  public renderPartialHTML(
    children: ElementContent[],
    includeCodeNode: boolean = false
  ): string {
    if (!includeCodeNode) {
      return toHtml(children);
    }
    return toHtml(
      createHastElement({
        tagName: 'code',
        children,
        properties: { 'data-code': '' },
      })
    );
  }

  public async initializeHighlighter(): Promise<DiffsHighlighter> {
    this.highlighter = await getSharedHighlighter(
      getHighlighterOptions(this.computedLang, {
        theme: this.getLocalHighlightTheme(),
        preferredHighlighter:
          this.workerManager?.getPreferredHighlighter() ??
          this.options.preferredHighlighter,
      })
    );
    return this.highlighter;
  }

  public onHighlightSuccess(
    file: FileContents,
    result: ThemedFileResult,
    options: RenderFileOptions,
    highlighted = true
  ): void {
    if (this.editSessionActive) {
      return;
    }
    this.applyHighlightResult(file, result, options, highlighted);
  }

  private applyHighlightResult(
    file: FileContents,
    result: ThemedFileResult,
    options: RenderFileOptions,
    highlighted = true
  ): void {
    const { file: currentFile, renderCache } = this;
    if (
      currentFile == null ||
      renderCache == null ||
      !areFileTargetsEqual(file, currentFile) ||
      !areFileRenderOptionsEqual(
        options,
        this.getRenderOptions(currentFile).options
      )
    ) {
      return;
    }

    const triggerRender =
      renderCache.result == null ||
      !renderCache.highlighted ||
      !areFileRenderOptionsEqual(renderCache.options, options) ||
      !areFileTargetsEqual(renderCache.file, currentFile);
    if (!triggerRender) {
      return;
    }

    this.pendingHighlightResult = {
      file: currentFile,
      options,
      highlighted,
      result,
    };
    this.scheduleRenderUpdate();
  }

  private getMatchingWorkerResultCache(
    file: FileContents,
    options: RenderFileOptions
  ): RenderFileResult | undefined {
    if (this.editSessionActive) {
      return undefined;
    }
    const cache = this.workerManager?.getFileResultCache(file);
    if (cache == null || !areFileRenderOptionsEqual(options, cache.options)) {
      return undefined;
    }
    return cache;
  }

  // Returns completed background work that can replace the rendered AST on
  // the next render. Reading it does not promote or discard pending work.
  private getReadyRenderResult(
    file: FileContents,
    options: RenderFileOptions
  ): PendingHighlightResult | undefined {
    const task = this.highlightTask;
    if (
      task?.state.status === 'error' &&
      areFileTargetsEqual(task.file, file) &&
      areFileRenderOptionsEqual(task.options, options)
    )
      return undefined;
    const { pendingHighlightResult } = this;
    if (
      pendingHighlightResult != null &&
      areFileTargetsEqual(pendingHighlightResult.file, file) &&
      areFileRenderOptionsEqual(pendingHighlightResult.options, options)
    ) {
      return pendingHighlightResult;
    }

    const workerCache = this.getMatchingWorkerResultCache(file, options);
    if (workerCache == null || this.hasHighlightedRenderCache(file, options)) {
      return undefined;
    }
    return { file, highlighted: true, ...workerCache };
  }

  private hasHighlightedRenderCache(
    file: FileContents,
    options: RenderFileOptions
  ): boolean {
    const { renderCache } = this;
    return (
      renderCache?.result != null &&
      renderCache.highlighted &&
      areFileTargetsEqual(file, renderCache.file) &&
      areFileRenderOptionsEqual(options, renderCache.options)
    );
  }

  public onHighlightError(error: unknown): void {
    if (this.highlightTask != null)
      this.failHighlight(this.highlightTask, error);
  }

  private getTokenizeMaxLength(): number {
    return this.options.tokenizeMaxLength ?? DEFAULT_TOKENIZE_MAX_LENGTH;
  }

  private createPreElement(totalLines: number): HASTElement {
    const { disableLineNumbers = false, overflow = 'scroll' } = this.options;
    return createPreElement({
      type: 'file',
      diffIndicators: 'none',
      disableBackground: true,
      disableLineNumbers,
      overflow,
      split: false,
      totalLines,
    });
  }
}

function isFileMassive(lineCount: number, tokenizeMaxLength: number): boolean {
  return lineCount > tokenizeMaxLength;
}
