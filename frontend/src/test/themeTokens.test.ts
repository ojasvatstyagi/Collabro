import { describe, expect, it } from 'vitest';

/**
 * Tailwind silently ignores a class it does not know: no CSS is generated and the element falls back to the browser's
 * default (black text, no background). A page copied from a shadcn/ui template did exactly that (`text-muted-foreground`,
 * `bg-background`, `from-brand-primary`...), so its text was black on black in dark mode and its heading invisible.
 * This scans every component and fails on a colour class that this project's tailwind.config.js does not define.
 */

const configs = import.meta.glob('../../tailwind.config.js', { import: 'default', eager: true }) as Record<
  string,
  { theme: { extend: { colors: { brand: Record<string, string> } } } }
>;
const sources = import.meta.glob('../**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const brandNames = new Set(Object.keys(Object.values(configs)[0]?.theme.extend.colors.brand ?? {}));

const COLOR_UTILITY = '(?:text|bg|border|ring|fill|stroke|from|via|to|shadow|outline|divide|placeholder|caret|accent)';

// The shadcn/ui names this project does not define
const SHADCN = new RegExp(
  `(?<![\\w-])${COLOR_UTILITY}-(?:background|foreground|card|card-foreground|popover|popover-foreground|muted|muted-foreground|primary|primary-foreground|secondary|secondary-foreground|destructive|destructive-foreground)(?![\\w-])`,
  'g'
);
const BRAND = new RegExp(`(?<![\\w-])${COLOR_UTILITY}-brand-([A-Za-z-]+)`, 'g');

/** The colour classes in a piece of source that no stylesheet will ever define. */
export const undefinedColorClasses = (source: string, brand: Set<string>): string[] => {
  const found: string[] = [];
  for (const match of source.matchAll(SHADCN)) found.push(match[0]);
  for (const match of source.matchAll(BRAND)) {
    if (!brand.has(match[1])) found.push(match[0]);
  }
  return found;
};

describe('colour classes', () => {
  it('finds the palette in tailwind.config.js (so the check below means something)', () => {
    expect(brandNames).toContain('orange');
    expect(brandNames).toContain('dark-lighter');
    expect(Object.keys(sources).filter((f) => !f.endsWith('.test.tsx')).length).toBeGreaterThan(20);
  });

  it('flags the classes that produced invisible text, and accepts the ones that exist', () => {
    const bad = 'className="text-muted-foreground bg-background bg-card/50 text-destructive from-brand-primary to-brand-secondary"';
    expect(undefinedColorClasses(bad, brandNames)).toEqual([
      'text-muted-foreground',
      'bg-background',
      'bg-card',
      'text-destructive',
      'from-brand-primary',
      'to-brand-secondary',
    ]);

    const good =
      'className="text-brand-orange hover:bg-brand-orange/90 dark:bg-brand-dark-lighter text-gray-500 dark:text-gray-400 bg-green-500/10 border-brand-red/20"';
    expect(undefinedColorClasses(good, brandNames)).toEqual([]);
  });

  it('are all defined: no component uses a colour class Tailwind would silently drop', () => {
    const problems: string[] = [];
    for (const [file, source] of Object.entries(sources)) {
      if (file.endsWith('.test.tsx')) continue;
      for (const cls of undefinedColorClasses(source, brandNames)) problems.push(`${file.replace('../', 'src/')}: ${cls}`);
    }

    expect(problems).toEqual([]);
  });
});
