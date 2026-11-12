/**
 * Keeps the repo-root DESIGN.md (Google Stitch format) in step with these tokens, and checks the rules its
 * linter cares about: references resolve, component text meets contrast, sections follow the spec order.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { light } from './color';
import { contrastRatio } from './contrast';
import { radius, space } from './layout';
import { fontWeight, typeScale } from './typography';

const file = readFileSync(fileURLToPath(new URL('../../../DESIGN.md', import.meta.url)), 'utf8');
const [, frontMatter = '', body = ''] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(file) ?? [];

type Map = Record<string, Record<string, Record<string, string> | string>>;

/** Enough YAML for DESIGN.md front matter: top-level maps two levels deep, scalar values. */
function parse(yaml: string): Map {
  const out: Map = {};
  let top = '';
  let mid = '';
  for (const line of yaml.split('\n')) {
    const m = /^( *)(['"]?[^'":]+['"]?):\s*(.*)$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    const [, indent = '', rawKey = '', rawValue = ''] = m;
    // Single or double quotes are both valid YAML (Prettier writes single).
    const key = rawKey.replace(/['"]/g, '');
    const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');
    if (indent.length === 0) {
      top = key;
      out[top] = {};
    } else if (indent.length === 2) {
      mid = key;
      (out[top] as Record<string, unknown>)[mid] = value === '' ? {} : value;
    } else if (indent.length === 4) {
      ((out[top] as Record<string, Record<string, string>>)[mid] as Record<string, string>)[key] =
        value;
    }
  }
  return out;
}

const tokens = parse(frontMatter);
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const px = (n: number) => `${n}px`;

function resolve(ref: string): string {
  const m = /^\{(\w+)\.([\w.-]+)\}$/.exec(ref);
  if (!m) return ref;
  const value = tokens[m[1] as string]?.[m[2] as string];
  if (value === undefined) throw new Error(`Broken reference ${ref}`);
  return typeof value === 'string' ? value : JSON.stringify(value);
}

describe('DESIGN.md', () => {
  it('has YAML front matter', () => {
    expect(frontMatter.length).toBeGreaterThan(0);
  });

  it('lists every light colour role, with the same value', () => {
    const expected = Object.fromEntries(Object.entries(light).map(([k, v]) => [kebab(k), v]));
    expect(tokens.colors).toEqual(expected);
  });

  it('matches the type scale', () => {
    for (const [role, s] of Object.entries(typeScale)) {
      expect(tokens.typography?.[kebab(role)], role).toEqual({
        fontFamily: 'Albert Sans',
        fontSize: px(s.fontSize),
        fontWeight: fontWeight[s.weight],
        lineHeight: px(s.lineHeight),
        letterSpacing: px(s.letterSpacing),
        ...('tabular' in s && s.tabular ? { fontFeature: 'tnum' } : {}),
      });
    }
  });

  it('matches the shape and spacing scales', () => {
    expect(tokens.rounded).toEqual(
      Object.fromEntries(Object.entries(radius).map(([k, v]) => [k, px(v)])),
    );
    expect(tokens.spacing).toEqual(
      Object.fromEntries(Object.entries(space).map(([k, v]) => [k, px(v)])),
    );
  });

  it('resolves every component token reference', () => {
    for (const [name, props] of Object.entries(tokens.components ?? {})) {
      for (const value of Object.values(props as Record<string, string>)) {
        expect(() => resolve(value), `${name}: ${value}`).not.toThrow();
      }
    }
  });

  it('gives every component with text and a fill at least 4.5:1 contrast', () => {
    for (const [name, props] of Object.entries(tokens.components ?? {})) {
      const p = props as Record<string, string>;
      if (!p.backgroundColor || !p.textColor) continue;
      expect(
        contrastRatio(resolve(p.textColor), resolve(p.backgroundColor)),
        name,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the spec section order', () => {
    const order = [
      'Overview',
      'Colors',
      'Typography',
      'Layout',
      'Elevation & Depth',
      'Shapes',
      'Components',
      "Do's and Don'ts",
    ];
    const headings = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings).toEqual(order);
  });
});
