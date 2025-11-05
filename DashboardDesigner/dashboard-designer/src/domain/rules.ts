import type { NodeKind } from './types';

const ALLOWED_TO: Readonly<Record<NodeKind, readonly NodeKind[]>> = {
  Dashboard: [
    'Visualization',
    'Legend',
    'Button',
    'Filter',
    'Parameter',
    'Placeholder',
  ],
  Visualization: ['Legend', 'Button', 'Filter', 'Parameter', 'Graph'],
  Legend: [],
  Tooltip: ['Visualization', 'Graph'],
  Button: [],
  Filter: [],
  Parameter: ['Filter'],
  DataAction: [],
  Placeholder: [],
  Graph: [],
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

export function supportsInteractions(kind: NodeKind): boolean {
  return ['Visualization', 'Button', 'Filter', 'Parameter', 'Legend'].includes(
    kind
  );
}
