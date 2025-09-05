import type { NodeKind } from './types';

// Regraas de dependencia, falta me meter aqui os atributos como size, color, shape
export const ALLOWED_TO: Record<NodeKind, NodeKind[]> = { 
  Dashboard: [
    'Visualization',
    'Legend',
    'Tooltip',
    'Button',
    'Filter',
    'Parameter',
    'Datum',
    'Placeholder',
  ],
  Visualization: ['Legend', 'Tooltip'],
  Legend: [],
  Tooltip: ['Visualization'],
  Button: ['DataAction'],
  Filter: ['DataAction', 'Datum'],
  Parameter: ['Filter', 'Visualization'],
  DataAction: ['Datum', 'Visualization'],
  Datum: ['Visualization', 'Filter', 'DataAction'],
  Placeholder: [],
};

export function canConnect(sourceKind?: NodeKind, targetKind?: NodeKind) {
  if (!sourceKind || !targetKind) return false;
  return ALLOWED_TO[sourceKind]?.includes(targetKind) ?? false;
}
