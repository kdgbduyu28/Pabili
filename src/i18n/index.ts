import { fil } from './fil';

export type Lang = 'en' | 'fil';

let current: Lang = 'en';

/**
 * Switch languages. Like the theme, call before rendering the tree; the root
 * layout keys the app on the language so every screen re-renders with it.
 */
export function setLang(l: Lang) {
  current = l;
}

export function getLang(): Lang {
  return current;
}

/**
 * Translate by English text. Untranslated strings fall back to English, so new
 * screens work before their Filipino copy is written. `{name}` placeholders are
 * filled from `vars`.
 */
export function t(text: string, vars?: Record<string, string | number>): string {
  const s = current === 'fil' ? (fil[text] ?? text) : text;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}
