import type { NodeKind } from './types';

// Confirmar melhor estas dependências
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

/*
const ALLOWED_PARENTS: Readonly<
  Partial<Record<NodeKind, readonly NodeKind[]>>
> = {
  Visualization: ['Dashboard'],
  Legend: ['Dashboard', 'Visualization'],
  Tooltip: ['Visualization'],
  Button: ['Dashboard', 'Visualization'],
  Filter: ['Dashboard', 'Visualization'],
  Parameter: ['Dashboard', 'Visualization'],
  DataAction: ['Dashboard', 'Visualization'],
  Placeholder: ['Dashboard', 'Visualization'],
} as const;

function canNest(childKind?: NodeKind, parentKind?: NodeKind): boolean {
  if (!childKind || !parentKind) return false;
  const allowed = ALLOWED_PARENTS[childKind] ?? [];
  return allowed.includes(parentKind);
}

export const allowedTargetsFor = (k: NodeKind) => [...(ALLOWED_TO[k] ?? [])];
export const allowedParentsFor = (k: NodeKind) => [
  ...(ALLOWED_PARENTS[k] ?? []),
];
*/
