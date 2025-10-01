import type { NodeKind } from './types';

const ALLOWED_TO: Readonly<Record<NodeKind, readonly NodeKind[]>> = {
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
  Visualization: ['Legend', 'Tooltip'],
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
  if (sourceKind === targetKind)
    return ALLOWED_TO[sourceKind].includes(targetKind);
  return ALLOWED_TO[sourceKind]?.includes(targetKind) ?? false;
}

export function allowedChildKinds(parentKind?: NodeKind): NodeKind[] {
  if (!parentKind) return [];
  // `as NodeKind[]` is safe because keys/values are NodeKind literals
  return [...ALLOWED_TO[parentKind]] as NodeKind[];
}
