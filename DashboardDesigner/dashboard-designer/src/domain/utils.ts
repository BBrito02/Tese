import type { DataItem } from './types';

export type DataAny = string | DataItem;

export const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');

export function uniqueData(items: DataAny[]): DataAny[] {
  const seen = new Set<string>();
  const result: DataAny[] = [];
  for (const it of items) {
    const name = typeof it === 'string' ? it : it.name;
    const key = slug(name);
    if (seen.has(key)) continue; // drop duplicate in the same node
    seen.add(key);
    result.push(typeof it === 'string' ? name : { ...it });
  }
  return result;
}
