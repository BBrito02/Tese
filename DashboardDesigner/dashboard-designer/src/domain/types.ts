export type VisualizationCompKind =
  | 'Dashboard'
  | 'Visualization'
  | 'Tooltip'
  | 'Legend';

export type InteractionCompKind =
  | 'Button'
  | 'Filter'
  | 'Parameter'
  | 'DataAction';

export type NodeKind =
  | VisualizationCompKind
  | InteractionCompKind
  | 'Placeholder';

interface NodeDataBase {
  title: string;
  description?: string;
  kind: NodeKind;
  badge?: string;
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
  interactions?: string[];
}

interface VisualizationNodeData extends NodeDataBase {
  kind: 'Visualization';
  objectives?: string[];
  data?: string[]; //when adding display the data on the bottom of the component
  tooltips?: string[]; //will be added thru the tooltip menu(to be done later)
  interactions?: string[]; //will be added thru the interactions menu(to be done later)
}

interface LegendNodeData extends NodeDataBase {
  kind: 'Legend';
  data?: string[]; //when adding display the data on the bottom of the component
  interactions?: string[]; //will be added thru the interactions menu(to be done later)
}

interface TooltipNodeData extends NodeDataBase {
  kind: 'Tooltip';
  data?: string[]; //when adding display the data on the bottom of the component
}

interface ButtonNodeData extends NodeDataBase {
  kind: 'Button';
  label?: string;
  interactions?: string[]; //will be added thru the interactions menu(to be done later)
}

interface FilterNodeData extends NodeDataBase {
  kind: 'Filter';
  data?: string[]; //when adding display the data on the bottom of the component
  interactions?: string[]; //will be added thru the interactions menu(to be done later)
}

interface ParameterNodeData extends NodeDataBase {
  kind: 'Parameter';
  options?: string[]; //when adding display the different options on the center of the component in a drop-down menu
  interactions?: string[]; //will be added thru the interactions menu(to be done later)
}

interface DataActionNodeData extends NodeDataBase {
  //Ver o que fazer com esta componente, realidade e que eu ainda nao percebi muito bem o que e que ela faz
  kind: 'DataAction';
  actionType?: 'Filtering' | 'Highlight';
  targetDataRef?: string;
}

interface PlaceholderNodeData extends NodeDataBase {
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
