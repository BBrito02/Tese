// src/domain/types.ts

/** ----- Kind groups ------------------------------------------------------- */
export type InteractionCompKind = 'Button' | 'Filter' | 'Parameter';
export type ContainerKind = 'Dashboard' | 'Visualization';

/** All node kinds used in the editor */
export type NodeKind =
  | ContainerKind
  | 'Legend'
  | 'Tooltip'
  | InteractionCompKind
  | 'DataAction'
  | 'Placeholder';

/** Base for every node's data payload */
export interface NodeDataBase {
  title: string;
  description?: string;
  kind: NodeKind; // discriminant
}

/** ----- Concrete node data types (discriminated by `kind`) ---------------- */

// Containers
export interface DashboardNodeData extends NodeDataBase {
  kind: 'Dashboard';
  objectives?: string[];
}

export interface VisualizationNodeData extends NodeDataBase {
  kind: 'Visualization';
  dataRef?: string; // id of a Data node
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
