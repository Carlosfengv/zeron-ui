// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import { CodeDiff } from '../packages/ui/src/components/code-block/code-diff';
import { DEFAULT_THEMES } from '../packages/ui/src/system/code-engine/constants';
import { disposeHighlighter, preloadHighlighter } from '../packages/ui/src/system/code-engine/highlighter/shared_highlighter';
import { parseDiffFromFile } from '../packages/ui/src/system/code-engine/utils/parseDiffFromFile';

beforeAll(async () => {
  CSSStyleSheet.prototype.replaceSync = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  await preloadHighlighter({ langs: [], themes: Object.values(DEFAULT_THEMES) });
});

afterEach(cleanup);
afterAll(disposeHighlighter);

const oldFile = { name: 'before.txt', lang: 'text' as const, contents: 'old line\n' };
const newFile = { name: 'after.txt', lang: 'text' as const, contents: 'new line\nanother line\n' };

describe('CodeDiff product header', () => {
  test('renders a renamed file and actual hunk totals through the React header slot', async () => {
    const fileDiff = parseDiffFromFile(oldFile, newFile);
    const { container } = render(<CodeDiff
      fileDiff={fileDiff}
      renderHeaderPrefix={() => <span>Prefix</span>}
      renderHeaderFilenameSuffix={() => <span>Suffix</span>}
      renderHeaderMetadata={() => <span>Metadata</span>}
    />);
    expect(screen.getByTitle('before.txt')).toBeTruthy();
    expect(screen.getByTitle('after.txt')).toBeTruthy();
    expect(screen.getByText('-1')).toBeTruthy();
    expect(screen.getByText('+2')).toBeTruthy();
    for (const label of ['Prefix', 'Suffix', 'Metadata']) expect(screen.getAllByText(label)).toHaveLength(1);
    const slot = container.querySelector('[slot="header-custom"]');
    expect(slot?.contains(screen.getByTitle('after.txt'))).toBe(true);
    await waitFor(() => expect(container.firstElementChild?.shadowRoot?.querySelector('[data-diffs-header="custom"]')).toBeTruthy());
  });

  test('supports file-pair input and additions without displaying a zero deletion count', () => {
    render(<CodeDiff oldFile={null} newFile={newFile} />);
    expect(screen.getByTitle('after.txt')).toBeTruthy();
    expect(screen.getByText('+2')).toBeTruthy();
    expect(screen.queryByText('-0')).toBeNull();
  });

  test('shows deletions without displaying a zero addition count', () => {
    render(<CodeDiff oldFile={oldFile} newFile={null} />);
    expect(screen.getByTitle('before.txt')).toBeTruthy();
    expect(screen.getByText('-1')).toBeTruthy();
    expect(screen.queryByText('+0')).toBeNull();
  });

  test('retains a caller-supplied custom header', () => {
    render(<CodeDiff oldFile={oldFile} newFile={newFile} renderCustomHeader={() => <span>Custom header</span>} />);
    expect(screen.getByText('Custom header')).toBeTruthy();
    expect(screen.queryByTitle('after.txt')).toBeNull();
    expect(screen.queryByText('+2')).toBeNull();
  });

  test('preserves the engine appearance and its native header slots', async () => {
    const { container } = render(<CodeDiff appearance="engine" oldFile={oldFile} newFile={newFile} renderHeaderMetadata={() => <span>Engine metadata</span>} />);
    expect(screen.getByText('Engine metadata').closest('[slot]')?.getAttribute('slot')).toBe('header-metadata');
    await waitFor(() => expect(container.firstElementChild?.shadowRoot?.querySelector('[data-diffs-header="default"]')).toBeTruthy());
    expect(screen.queryByTitle('after.txt')).toBeNull();
  });

  test('honors disableFileHeader in the renderer', async () => {
    const { container } = render(<CodeDiff oldFile={oldFile} newFile={newFile} options={{ disableFileHeader: true }} />);
    const shadow = container.firstElementChild?.shadowRoot;
    expect(shadow?.querySelector('[data-diffs-header]')).toBeNull();
    await waitFor(() => expect(Array.from(shadow?.querySelectorAll('[data-content]') ?? []).map(content => content.textContent).join('\n')).toContain('new line'));
  });
});
