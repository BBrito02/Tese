// src/domain/types.ts

/** ----- Kind groups ------------------------------------------------------- */
export type InteractionCompKind = 'Button' | 'Filter' | 'Parameter';
export type ContainerKind = 'Dashboard' | 'Visualization';

export type NodeKind =
  | ContainerKind
  | 'Legend'
  | 'Tooltip'
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

/** Build the next badge string (or undefined if kind is not badgeable) */
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

// Presentation
export interface LegendNodeData extends NodeDataBase {
  kind: 'Legend';
}
export interface TooltipNodeData extends NodeDataBase {
  kind: 'Tooltip';
}

// Interaction components
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

// Data & actions
export interface DataActionNodeData extends NodeDataBase {
  kind: 'DataAction';
  actionType?: 'Filtering' | 'Highlight';
  targetDataRef?: string; // id of the Data node affected
}

// Optional helper kind
export interface PlaceholderNodeData extends NodeDataBase {
  kind: 'Placeholder';
  image?: string; // path/url if you want it
}

/** Union used everywhere as node `data` */
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

/** ----- Small helpers (nice for rules/menus) ------------------------------ */
export const INTERACTION_KINDS: readonly InteractionCompKind[] = [
  'Button',
  'Filter',
  'Parameter',
] as const;

export const CONTAINER_KINDS: readonly ContainerKind[] = [
  'Dashboard',
  'Visualization',
] as const;

export function isInteractionKind(k: NodeKind): k is InteractionCompKind {
  return (INTERACTION_KINDS as readonly string[]).includes(k);
}

export function isContainerKind(k: NodeKind): k is ContainerKind {
  return (CONTAINER_KINDS as readonly string[]).includes(k);
}
