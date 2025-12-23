// src/domain/types.ts

export type InteractionType = 'click' | 'hover';
export type InteractionResult =
  | 'filter'
  | 'highlight'
  | 'dashboard'
  | 'link'
  | 'binding'; // Added 'binding' for parameters if you want it typed here, strictly speaking 'binding' wasn't in your previous list but used in logic. Let's keep it safe.

export type Reply = {
  id: string;
  text: string;
  createdAt: number;
  author?: string; // Optional
};

// add near your other domain types
export type Review = {
  id: string;
  targetId: string; // node id or edge id
  text: string;
  //category?: 'Design' | 'Functionality' | 'Data' | 'Other';
  priority?: 'Low' | 'Medium' | 'High';
  resolved: boolean;
  author?: string;
  createdAt: number; // Date.now()
  replies: Reply[];
};

export type Interaction = {
  id: string; // unique id
  name: string; // human-friendly label
  trigger: InteractionType; // click | hover
  result: InteractionResult; // what it does
  targets: string[]; // array of target node ids
  // Stores details about specific targets (e.g., which data attribute ID is targeted)
  targetDetails?: {
    targetId: string;
    targetType: string;
    targetDataRef?: string;
  }[];
};

export type VisualVariable = 'Size' | 'Shape' | 'Color' | 'Text';

export type GraphType =
  | 'Dispersion'
  | 'Line'
  | 'MultipleLines'
  | 'Area'
  | 'Bars'
  | 'PilledBars'
  | 'Pilled100'
  | 'Gantt'
  | 'Dots'
  | 'Map'
  | 'ColorMap'
  | 'Hexabin'
  | 'Table'
  | 'HeatMap'
  | 'Clock';

export type DataType = 'Binary' | 'Continuous' | 'Discrete' | 'Other';

// --- CHANGED: Added ID to DataItem ---
export interface DataItem {
  id: string; // Unique, stable identifier (UUID)
  name: string; // Display label (mutable)
  dtype: DataType;
}

export type VisualizationCompKind =
  | 'Dashboard'
  | 'Visualization'
  | 'Tooltip'
  | 'Legend'
  | 'Graph';

export type InteractionCompKind =
  | 'Button'
  | 'Filter'
  | 'Parameter'
  | 'DataAction';

export type NodeKind =
  | VisualizationCompKind
  | InteractionCompKind
  | 'Placeholder'
  | 'Graph';

interface NodeDataBase {
  title: string;
  description?: string;
  kind: NodeKind;
  badge?: string;
  visualVars?: VisualVariable[];
  graphType?: GraphType | null;
  interactions?: Interaction[];
  perspectives?: string[];
  highlighted?: boolean;
  collapsedCategories?: {
    data?: boolean;
    interactions?: boolean;
    tooltips?: boolean;
  };
}

const KIND_PREFIX = {
  Dashboard: 'D',
  Visualization: 'V',
  Legend: 'L',
  Tooltip: 'T',
  Button: 'B',
  Filter: 'F',
  Parameter: 'P',
} as const satisfies Partial<Record<NodeKind, string>>;

type BadgeableKind = keyof typeof KIND_PREFIX;

function isBadgeable(kind: NodeKind): kind is BadgeableKind {
  return Object.prototype.hasOwnProperty.call(KIND_PREFIX, kind);
}

function nextIndexFor(
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

interface DashboardNodeData extends NodeDataBase {
  kind: 'Dashboard';
  objectives?: string[];
}

interface VisualizationNodeData extends NodeDataBase {
  kind: 'Visualization';
  objectives?: string[];
  data?: DataItem[]; // Now uses objects with IDs
  tooltips?: string[];
  graphTypes?: GraphType[];
  visualVars?: VisualVariable[];
}

interface TooltipNodeData extends NodeDataBase {
  kind: 'Tooltip';
  data?: DataItem[];
  graphTypes?: GraphType[];
  visualVars?: VisualVariable[];
}

interface LegendNodeData extends NodeDataBase {
  kind: 'Legend';
  data?: DataItem[];
  visualVars?: VisualVariable[];
}

interface ButtonNodeData extends NodeDataBase {
  kind: 'Button';
}

interface FilterNodeData extends NodeDataBase {
  kind: 'Filter';
  data?: DataItem[];
}

interface ParameterNodeData extends NodeDataBase {
  kind: 'Parameter';
  options?: string[];
}

interface DataActionNodeData extends NodeDataBase {
  kind: 'DataAction';
  actionType?: 'Filtering' | 'Highlight';
  targetDataRef?: string;
}

interface PlaceholderNodeData extends NodeDataBase {
  kind: 'Placeholder';
  image?: string;
}

export interface GraphNodeData extends NodeDataBase {
  kind: 'Graph';
  graphType: GraphType;
  previewImageId?: string;
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
  | PlaceholderNodeData
  | GraphNodeData;
