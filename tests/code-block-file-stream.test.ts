// @vitest-environment jsdom

import { describe, expect, test, vi } from 'vitest';

const highlighter = vi.hoisted(() => {
  let resolve: ((value: unknown) => void) | undefined;
  return {
    getSharedHighlighter: vi.fn(
      () =>
        new Promise((nextResolve) => {
          resolve = nextResolve;
        })
    ),
    resolve(value: unknown) {
      resolve?.(value);
    },
  };
});

vi.mock(
  '../packages/ui/src/system/code-engine/highlighter/shared_highlighter',
  () => ({ getSharedHighlighter: highlighter.getSharedHighlighter })
);

import { FileStream } from '../packages/ui/src/system/code-engine/components/FileStream';

describe('FileStream', () => {
  test('does not attach or consume a stream after cleanup during setup', async () => {
    const source = new ReadableStream<string>();
    const wrapper = document.createElement('div');
    const instance = new FileStream({ lang: 'typescript' });

    const setup = instance.setup(source, wrapper);
    instance.cleanUp();
    highlighter.resolve({});
    await setup;

    expect(wrapper.childElementCount).toBe(0);
    expect(source.locked).toBe(false);
  });
});
