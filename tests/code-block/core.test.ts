import { describe, expect, test } from 'vitest';

import {
  diffAcceptRejectHunk,
  parseDiffFromFile,
  parseMergeConflictDiffFromFile,
  parsePatchFiles,
  resolveConflict,
} from '@zeron/ui/system/code-engine/core';
import { preloadCode } from '@zeron/ui/code-block/server';
import { VirtualizedFile } from '../../packages/ui/src/system/code-engine/components/VirtualizedFile';

const oldFile = {
  name: 'status.ts',
  lang: 'typescript' as const,
  contents: 'const status = "healthy";\n',
};
const newFile = {
  name: 'status.ts',
  lang: 'typescript' as const,
  contents: 'const status = "degraded";\nconst retry = 30;\n',
};

describe('code block core', () => {
  test('parses a full file diff without changing source content', () => {
    const diff = parseDiffFromFile(oldFile, newFile);

    expect(diff.name).toBe('status.ts');
    expect(diff.deletionLines.join('')).toBe(oldFile.contents);
    expect(diff.additionLines.join('')).toBe(newFile.contents);
    expect(diff.hunks.length).toBeGreaterThan(0);
  });

  test('parses patch additions, deletions, and the final newline', () => {
    const patch = `diff --git a/status.ts b/status.ts\n--- a/status.ts\n+++ b/status.ts\n@@ -1 +1,2 @@\n-const status = "healthy";\n+const status = "degraded";\n+const retry = 30;\n`;
    const parsed = parsePatchFiles(patch, 'test', true);
    const file = parsed[0]?.files[0];

    expect(file?.name).toBe('status.ts');
    expect(file?.deletionLines.join('')).toContain('healthy');
    expect(file?.additionLines.join('')).toContain('const retry = 30;\n');
  });

  test('accepts and rejects a hunk as actual file data', () => {
    const diff = parseDiffFromFile(oldFile, newFile);
    const accepted = diffAcceptRejectHunk(diff, 0, 'accept');
    const rejected = diffAcceptRejectHunk(diff, 0, 'reject');

    expect(accepted.additionLines.join('')).toBe(newFile.contents);
    expect(
      accepted.hunks.flatMap((hunk) => hunk.hunkContent).every((content) => content.type === 'context')
    ).toBe(true);
    expect(rejected.additionLines.join('')).toBe(oldFile.contents);
    expect(
      rejected.hunks.flatMap((hunk) => hunk.hunkContent).every((content) => content.type === 'context')
    ).toBe(true);
  });

  test('resolves merge conflicts to either side', () => {
    const parsed = parseMergeConflictDiffFromFile({
      name: 'config.ts',
      contents: 'before\n<<<<<<< current\ncurrent\n=======\nincoming\n>>>>>>> next\nafter\n',
    });
    const action = parsed.actions[0];
    expect(action).toBeDefined();
    if (action == null) return;

    const current = resolveConflict(parsed.fileDiff, action, 'current');
    const incoming = resolveConflict(parsed.fileDiff, action, 'incoming');
    expect(current.additionLines.join('')).toContain('current');
    expect(current.additionLines.join('')).not.toContain('incoming');
    expect(incoming.additionLines.join('')).toContain('incoming');
    expect(incoming.additionLines.join('')).not.toContain('current');
  });

  test('preloads escaped, visible SSR markup', async () => {
    const result = await preloadCode({
      file: {
        name: 'unsafe.html',
        lang: 'html',
        contents: '<script>window.bad = true</script>\n',
      },
    });

    expect(result.prerenderedHTML).toContain('data-dehydrated');
    expect(result.prerenderedHTML).toContain('&#x3C;');
    expect(result.prerenderedHTML).not.toContain('<script>window.bad');
  });

  test('computes a 100,000-line virtual layout without creating line DOM', () => {
    const contents = Array.from(
      { length: 100_000 },
      (_, index) => `export const value${index} = ${index};`
    ).join('\n');
    const viewer = { type: 'code-view' as const };
    const virtualFile = new VirtualizedFile(undefined, viewer as never);

    const startedAt = performance.now();
    const height = virtualFile.updateCodeViewLayout(
      { name: 'large.ts', lang: 'typescript', contents },
      0
    );
    const finalLine = virtualFile.getLinePosition(100_000);
    const elapsed = performance.now() - startedAt;

    expect(height).toBe(2_000_052);
    expect(finalLine).toEqual({ top: 2_000_024, height: 20 });
    expect(elapsed).toBeLessThan(2_500);
  });
});
