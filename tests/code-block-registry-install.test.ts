import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const root = process.cwd();

describe('code-block Registry distribution', () => {
  test('ships every public entry and generated runtime asset', async () => {
    const registry = JSON.parse(
      await readFile(path.join(root, 'packages/ui/registry.json'), 'utf8')
    ) as { items: Array<{ name: string; files?: Array<{ target?: string }> }> };
    const codeBlock = registry.items.find((item) => item.name === 'code-block');
    const codeEngine = registry.items.find((item) => item.name === 'code-engine');
    const targets = [
      ...(codeBlock?.files ?? []),
      ...(codeEngine?.files ?? []),
    ].map((file) => file.target);

    expect(targets).toContain('components/ui/code-block/index.ts');
    expect(targets).toContain('components/ui/code-block/server.ts');
    expect(targets).toContain('components/ui/code-block/edit.tsx');
    expect(targets).toContain('components/ui/code-block/worker.tsx');
    expect(targets).toContain('lib/code-engine/worker/worker.js');
    expect(targets).toContain('lib/code-engine/styles/base-css.generated.ts');
    expect(targets).toContain('lib/code-engine/themes/pierre-dark.json');
  });

  test('contains no package runtime imports from the previous implementation', async () => {
    const files = [
      path.join(root, 'public/r/code-block.json'),
      path.join(root, 'public/r/code-engine.json'),
    ];
    for (const file of files) {
      const contents = await readFile(file, 'utf8');
      expect(contents).not.toMatch(/from ["']@pierre\//);
      expect(contents).not.toMatch(/import\(["']@pierre\//);
    }
  });
});
