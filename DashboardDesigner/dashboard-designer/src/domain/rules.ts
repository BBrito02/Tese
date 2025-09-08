// src/domain/rules.ts
import type { NodeKind } from './types';

/** ------------------------------------------------------------------
 * Edge rules: which source kinds may connect to which target kinds
 * ------------------------------------------------------------------ */
export const ALLOWED_TO: Readonly<Record<NodeKind, readonly NodeKind[]>> = {
  Dashboard: [
    'Visualization',
    'Legend',
    'Tooltip',
    'Button',
    'Filter',
    'Parameter',
    'DataAction',
    'Placeholder',
  ],
  Visualization: [
    'Legend',
    'Tooltip',
  ],
  Legend: [],
  Tooltip: ['Visualization'],
  Button: ['DataAction'],
  Filter: ['DataAction'],
  Parameter: ['Filter', 'Visualization'],
  DataAction: ['Visualization'],
  Placeholder: [],
} as const;

export function canConnect(
  sourceKind?: NodeKind,
  targetKind?: NodeKind
): boolean {
  if (!sourceKind || !targetKind) return false;
  // disallow self loops by default (remove this if you want them)
  if (sourceKind === targetKind)
    return ALLOWED_TO[sourceKind].includes(targetKind);
  return ALLOWED_TO[sourceKind]?.includes(targetKind) ?? false;
}

/** Optional helper that returns a reason string for UX/tooltips */
export function whyCannotConnect(
  sourceKind?: NodeKind,
  targetKind?: NodeKind
): string | null {
  if (!sourceKind || !targetKind) return 'Missing source or target kind';
  if ((ALLOWED_TO[sourceKind] ?? []).includes(targetKind)) return null;
  return `${sourceKind} cannot connect to ${targetKind}`;
}

/** ------------------------------------------------------------------
 * Nesting rules: what kinds can be dropped INSIDE which parents
 * (used when creating nodes with parentNode/extent: 'parent')
 * ------------------------------------------------------------------ */
export const ALLOWED_PARENTS: Readonly<
  Partial<Record<NodeKind, readonly NodeKind[]>>
> = {
  Visualization: ['Dashboard'], // viz lives inside dashboard
  Legend: ['Dashboard', 'Visualization'],
  Tooltip: ['Visualization'],
  Button: ['Dashboard', 'Visualization'],
  Filter: ['Dashboard', 'Visualization'],
  Parameter: ['Dashboard', 'Visualization'],
  DataAction: ['Dashboard', 'Visualization'],
  Placeholder: ['Dashboard', 'Visualization'],
  // Dashboard has no parent (root only)
} as const;

export function canNest(childKind?: NodeKind, parentKind?: NodeKind): boolean {
  if (!childKind || !parentKind) return false;
  const allowed = ALLOWED_PARENTS[childKind] ?? [];
  return allowed.includes(parentKind);
}

/** Convenience getters for UI */
export const allowedTargetsFor = (k: NodeKind) => [...(ALLOWED_TO[k] ?? [])];
export const allowedParentsFor = (k: NodeKind) => [
  ...(ALLOWED_PARENTS[k] ?? []),
];
