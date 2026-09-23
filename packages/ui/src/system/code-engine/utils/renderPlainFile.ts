import type { ElementContent } from 'hast';

import type { RenderRange, ThemedFileResult } from '../types';
import { createHastElement, createTextNodeElement } from './hast_utils';
import { processLine } from './processLine';

/** Safe, windowed content while the highlighter itself is unavailable. */
export function renderPlainFile(
  lines: string[],
  { startingLine, totalLines }: RenderRange
): ThemedFileResult {
  const code: ElementContent[] = new Array(startingLine);
  const end = Math.min(lines.length, startingLine + totalLines);
  for (let index = startingLine; index < end; index++) {
    const text = lines[index].replace(/(?:\r\n|\r|\n)$/, '');
    code[index] = processLine(
      createHastElement({
        tagName: 'div',
        children: text === '' ? [] : [createTextNodeElement(text)],
      }),
      index + 1,
      {
        lineInfo: (line) => ({
          type: 'context',
          lineIndex: line - 1,
          lineNumber: line,
        }),
      }
    );
  }
  return { code, themeStyles: '', baseThemeType: undefined };
}
