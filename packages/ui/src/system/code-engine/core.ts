export type * from './types';

export { registerCustomLanguage } from './highlighter/languages/registerCustomLanguage';
export { resolveLanguage } from './highlighter/languages/resolveLanguage';
export { resolveLanguages } from './highlighter/languages/resolveLanguages';
export { registerCustomCSSVariableTheme } from './highlighter/themes/registerCustomCSSVariableTheme';
export { registerCustomTheme } from './highlighter/themes/registerCustomTheme';
export { resolveTheme } from './highlighter/themes/resolveTheme';
export { resolveThemes } from './highlighter/themes/resolveThemes';
export { diffAcceptRejectHunk } from './utils/diffAcceptRejectHunk';
export { parseDiffFromFile } from './utils/parseDiffFromFile';
export { parseMergeConflictDiffFromFile } from './utils/parseMergeConflictDiffFromFile';
export { parsePatchFiles } from './utils/parsePatchFiles';
export { resolveConflict } from './utils/resolveConflict';
export { resolveRegion } from './utils/resolveRegion';
export { setLanguageOverride } from './utils/setLanguageOverride';
export { trimPatchContext } from './utils/trimPatchContext';
