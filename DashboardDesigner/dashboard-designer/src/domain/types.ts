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

interface DashboardNodeData extends NodeDataBase { //interacoes[]
  kind: 'Dashboard';
  objectives?: string[];
}

interface VisualizationNodeData extends NodeDataBase { //dados[], objetivos[], interacoes[], tootips[]
  kind: 'Visualization';
  objectives?: string[];
}

interface LegendNodeData extends NodeDataBase { //dados[], interacoes[]
  kind: 'Legend';
}
interface TooltipNodeData extends NodeDataBase { //dados[]
  kind: 'Tooltip';
}

interface ButtonNodeData extends NodeDataBase { //interacoes[]
  kind: 'Button';
  label?: string;
}

interface FilterNodeData extends NodeDataBase { //dados[], interacoes[]
  kind: 'Filter';
  field?: string;
  values?: string[];
}

interface ParameterNodeData extends NodeDataBase { //opcoes[](paramteros), interacoes[]
  kind: 'Parameter';
  options?: string[];
  selected?: string;
}

interface DataActionNodeData extends NodeDataBase { //????
  kind: 'DataAction';
  actionType?: 'Filtering' | 'Highlight';
  targetDataRef?: string;
}

interface PlaceholderNodeData extends NodeDataBase { //descricao
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
