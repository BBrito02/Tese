export type InteractionCompKind = 'Button' | 'Filter' | 'Parameter';
export type ContainerKind = 'Dashboard' | 'Visualization' | 'Tooltip';

export type NodeKind =
  | ContainerKind
  | 'Legend'
  | InteractionCompKind
  | 'DataAction'
  | 'Placeholder';

export interface NodeDataBase {
  title: string;
  description?: string;
  kind: NodeKind;
  badge?: string;
}

export const KIND_PREFIX = {
  Dashboard: 'D',
  Visualization: 'V',
  Legend: 'L',
  Tooltip: 'T',
  Button: 'B',
  Filter: 'F',
  Parameter: 'P',
} as const satisfies Partial<Record<NodeKind, string>>;

export type BadgeableKind = keyof typeof KIND_PREFIX;

export function isBadgeable(kind: NodeKind): kind is BadgeableKind {
  return Object.prototype.hasOwnProperty.call(KIND_PREFIX, kind);
}

export function nextIndexFor(
  kind: NodeKind,
  nodes: Array<{ data?: { kind?: NodeKind; badge?: string } | undefined }>
): number | undefined {
  if (!isBadgeable(kind)) return undefined;
  const prefix = KIND_PREFIX[kind]!;
  let max = -1;
  for (const n of nodes) {
    const b = n.data?.badge;
    if (typeof b !== 'string' || !b.startsWith(prefix)) continue;
    const raw = b.slice(prefix.length);
    if (/^\d+$/.test(raw)) max = Math.max(max, parseInt(raw, 10));
  }
  return max + 1;
}

export function nextBadgeFor(
  kind: NodeKind,
  nodes: Array<{ data?: { kind?: NodeKind; badge?: string } | undefined }>
): string | undefined {
  const idx = nextIndexFor(kind, nodes);
  if (idx == null) return undefined;
  return `${KIND_PREFIX[kind as BadgeableKind]}${idx}`;
}

export interface DashboardNodeData extends NodeDataBase {
  kind: 'Dashboard';
  objectives?: string[];
}

export interface VisualizationNodeData extends NodeDataBase {
  kind: 'Visualization';
  dataRef?: string;
  objectives?: string[];
}

export interface LegendNodeData extends NodeDataBase {
  kind: 'Legend';
}
export interface TooltipNodeData extends NodeDataBase {
  kind: 'Tooltip';
}

export interface ButtonNodeData extends NodeDataBase {
  kind: 'Button';
  label?: string;
}

export interface FilterNodeData extends NodeDataBase {
  kind: 'Filter';
  field?: string;
  values?: string[];
}

export interface ParameterNodeData extends NodeDataBase {
  kind: 'Parameter';
  options?: string[];
  selected?: string;
}

export interface DataActionNodeData extends NodeDataBase {
  kind: 'DataAction';
  actionType?: 'Filtering' | 'Highlight';
  targetDataRef?: string;
}

export interface PlaceholderNodeData extends NodeDataBase {
  kind: 'Placeholder';
  image?: string;
}

export type NodeData =
  | DashboardNodeData
  | VisualizationNodeData
  | LegendNodeData
  | TooltipNodeData
  | ButtonNodeData
  | FilterNodeData
  | ParameterNodeData
  | DataActionNodeData
  | PlaceholderNodeData;
