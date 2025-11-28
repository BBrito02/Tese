import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  SelectionMode,
  ControlButton,
} from 'reactflow';
import type {
  ReactFlowInstance,
  Connection,
  Node as RFNode,
  Edge as RFEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';

import type {
  GraphType,
  NodeData,
  NodeKind,
  VisualVariable,
  Interaction,
  DataItem,
} from './domain/types';
import { canConnect, allowedChildKinds } from './domain/rules';

import SideMenu, { type DragData } from './components/menus/SideMenu';
import ComponentsMenu from './components/menus/ComponentsMenu';

import {
  DndContext,
  PointerSensor,
  useSensors,
  useSensor,
  DragOverlay,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragStartEvent,
  DragCancelEvent,
  DragMoveEvent,
} from '@dnd-kit/core';

import NodeGhost from './canvas/nodes/NodeGhost';
import { nextBadgeFor } from './domain/types';

import type { SaveFile, ExportNode } from './domain/saveFormat';
import { SAVE_VERSION } from './domain/saveFormat';

import TooltipPopup from './components/popups/TooltipPopup';
import InteractionPopup from './components/popups/InteractionPopup';
import VisualVariablePopup from './components/popups/VisualVariablePopup';
import SavePopup from './components/popups/SavePopup';
import AddComponentPopup from './components/popups/ComponentPopup';

import TooltipEdge from './canvas/edges/TooltipEdge';
import InteractionEdge from './canvas/edges/InteractionEdge';

import DashboardNode from './canvas/nodes/DashboardNode';
import VisualizationNode from './canvas/nodes/VisualizationNode';
import TooltipNode from './canvas/nodes/TooltipNode';
import LegendNode from './canvas/nodes/LegendNode';
import ButtonNode from './canvas/nodes/ButtonNode';
import FilterNode from './canvas/nodes/FilterNode';
import ParameterNode from './canvas/nodes/ParameterNode';
import DataActionNode from './canvas/nodes/DataActionNode';
import PlaceholderNode from './canvas/nodes/PlaceholderNode';
import GraphNode from './canvas/nodes/GraphNode';

import { activationIcons, type ActivationKey } from './domain/icons';
import { useModal } from './components/ui/ModalHost';

import {
  FaCloudDownloadAlt,
  FaCloudUploadAlt,
  FaRegSquare,
} from 'react-icons/fa';
import { FaHand } from 'react-icons/fa6';
import InteractionEdgeMenu from './components/menus/InteractionEdgeMenu';
import TooltipEdgeMenu from './components/menus/TooltipEdgeMenu';

import { saveProjectAsZip, loadProjectFromZip } from './utils/fileUtils';

import type { Review } from './domain/types';
import ReviewToggle from './components/ui/ReviewToggle';

/* =========================
 *  Node/Edge component maps
 * ========================= */

const NODE_TYPES = {
  dashboard: DashboardNode,
  visualization: VisualizationNode,
  tooltip: TooltipNode,
  legend: LegendNode,
  button: ButtonNode,
  filter: FilterNode,
  parameter: ParameterNode,
  dataaction: DataActionNode,
  placeholder: PlaceholderNode,
  graph: GraphNode,
};

/** Map domain kind -> React Flow node type key. */
function nodeTypeFor(kind: NodeKind): keyof typeof NODE_TYPES {
  switch (kind) {
    case 'Dashboard':
      return 'dashboard';
    case 'Visualization':
      return 'visualization';
    case 'Tooltip':
      return 'tooltip';
    case 'Legend':
      return 'legend';
    case 'Button':
      return 'button';
    case 'Filter':
      return 'filter';
    case 'Parameter':
      return 'parameter';
    case 'DataAction':
      return 'dataaction';
    case 'Placeholder':
      return 'placeholder';
    case 'Graph':
      return 'graph';
    default:
      return 'visualization';
  }
}

const EDGE_TYPES = { tooltip: TooltipEdge, interaction: InteractionEdge };

/* =========================
 *     UI layout constants
 * ========================= */

const PANEL_WIDTH = 280;
const PANEL_MARGIN = 7;
const PANEL_GAP = 8;
const PANEL_ANIM_MS = 200;

const PAD_X = 5;
const PAD_TOP = 17;
const PAD_BOTTOM = 28;
const HEADER_H = 23;
const GRID_GAP = 16;

const COLLAPSED_W = 28;
const EXTRA_COLLAPSED_GAP = 18;

/* ================
 *   Local helpers
 * ================ */

// Handy aliases for readability (not for hook generics)
type AppNode = RFNode<NodeData>;
type AppEdge = RFEdge<any>;

/** Small util: remove file extension. */
const baseFrom = (name: string) => name.replace(/\.[^.]+$/, '');

/** Minimum container base sizes (keeps dashboards a bit larger than visualizations). */
function baseMinFor(kind: NodeKind | undefined) {
  return {
    w: kind === 'Dashboard' ? 320 : 180,
    h: kind === 'Dashboard' ? 180 : 100,
  };
}

/** Read the current rendered size from node.style (falls back to sensible defaults). */
function getNodeSize(n: AppNode) {
  const w = (n as any).width ?? (n.style as any)?.width ?? 180;
  const h = (n as any).height ?? (n.style as any)?.height ?? 100;
  return { w: Number(w) || 0, h: Number(h) || 0 };
}

/** Absolute (canvas) position by accumulating parent offsets. */
function getAbsolutePosition(n: AppNode, all: AppNode[]) {
  let x = n.position.x;
  let y = n.position.y;
  let cur: AppNode | undefined = n;
  while (cur.parentNode) {
    const p = all.find((nn) => nn.id === cur!.parentNode);
    if (!p) break;
    x += p.position.x;
    y += p.position.y;
    cur = p as AppNode;
  }
  return { x, y };
}

/** Depth (nesting level) of a node in the hierarchy. */
function depthOf(n: AppNode, all: AppNode[]) {
  let d = 0;
  let cur: AppNode | undefined = n;
  while (cur?.parentNode) {
    const p = all.find((nn) => nn.id === cur!.parentNode);
    if (!p) break;
    d++;
    cur = p as AppNode;
  }
  return d;
}

/** Whether a node kind can contain children. */
function isContainerKind(k: NodeKind | undefined) {
  return k === 'Dashboard' || k === 'Visualization' || k === 'Tooltip';
}

/** Convert a flow-space point to screen-space using current viewport. */
function flowToScreen(
  rf: ReactFlowInstance | null,
  pt: { x: number; y: number }
) {
  const vp = (rf && (rf as any).getViewport?.()) || { x: 0, y: 0, zoom: 1 };
  return { x: vp.x + pt.x * vp.zoom, y: vp.y + pt.y * vp.zoom };
}

/* =====================================================
 *                  Main Editor component
 * ===================================================== */

export default function Editor() {
  // React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  // UI state
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [menuExiting, setMenuExiting] = useState(false);
  const [menuWidth, setMenuWidth] = useState<number>(PANEL_WIDTH);
  const [lassoMode, setLassoMode] = useState(false);

  const [reviewMode, setReviewMode] = useState(false);
  const [reviewsByTarget, setReviewsByTarget] = useState<
    Record<string, Review[]>
  >({});

  // File save name
  const [saveNameBase, setSaveNameBase] = useState('dashboard-designer');

  // Modal host
  const { openModal, closeModal } = useModal();

  const [isConnecting, setIsConnecting] = useState(false);

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId]
  );

  const selectedEdgeSource = useMemo(
    () =>
      selectedEdge
        ? nodes.find((n) => n.id === selectedEdge.source)
        : undefined,
    [selectedEdge, nodes]
  );

  const selectedEdgeTarget = useMemo(
    () =>
      selectedEdge
        ? nodes.find((n) => n.id === selectedEdge.target)
        : undefined,
    [selectedEdge, nodes]
  );

  // Keep interaction edges fully visible (no dimming)
  const visibleEdges = useMemo(
    () =>
      edges.map((e) =>
        e.type === 'interaction'
          ? { ...e, hidden: false, style: { ...e.style, opacity: 1 } }
          : e
      ),
    [edges]
  );

  // Currently selected node object
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId),
    [nodes, selectedId]
  );

  // Expose data attributes from parent Visualization when a Graph is selected
  const parentDataForSelected = useMemo<
    (string | DataItem)[] | undefined
  >(() => {
    if (!selectedNode) return undefined;
    if ((selectedNode.data as any)?.kind !== 'Graph') return undefined;

    const parentId = selectedNode.parentNode;
    if (!parentId) return [];

    const parent = nodes.find((n) => n.id === parentId);
    const dataList = (parent?.data as any)?.data;
    return Array.isArray(dataList) ? (dataList as (string | DataItem)[]) : [];
  }, [selectedNode, nodes]);

  const mergeUnique = <T,>(a: T[] = [], b: T[] = []) =>
    Array.from(new Set([...(a ?? []), ...(b ?? [])]));

  /* ---------- Menu animation width sync ---------- */

  useEffect(() => {
    const onSelectEdge = (e: Event) => {
      const { edgeId, type } =
        (e as CustomEvent<{ edgeId: string; type: 'tooltip' | 'interaction' }>)
          .detail || {};

      if (!edgeId) return;

      const edge = (edges as AppEdge[]).find((ed) => ed.id === edgeId);

      console.log('[Editor] edge selected', {
        edgeId,
        type,
        edge,
      });

      setSelectedId(null);
      setSelectedEdgeId(edgeId);
    };

    window.addEventListener(
      'designer:select-edge',
      onSelectEdge as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:select-edge',
        onSelectEdge as EventListener
      );
  }, [edges]);

  useEffect(() => {
    function onEnsureVV(e: Event) {
      const { parentId, vars } = (
        e as CustomEvent<{ parentId: string; vars: VisualVariable[] }>
      ).detail;

      setNodes((nodes) =>
        nodes.map((n) => {
          if (n.id !== parentId) return n;
          const cur: VisualVariable[] = Array.isArray(
            (n.data as any).visualVars
          )
            ? (n.data as any).visualVars
            : [];
          const next = mergeUnique(cur, vars);
          if (next === cur) return n;
          return {
            ...n,
            data: { ...(n.data as any), visualVars: next },
          };
        })
      );
    }

    window.addEventListener('designer:ensure-visual-vars', onEnsureVV as any);
    return () =>
      window.removeEventListener(
        'designer:ensure-visual-vars',
        onEnsureVV as any
      );
  }, [setNodes]);

  useEffect(() => {
    /** Listen to menu width broadcasts (so top-right buttons can slide with it). */
    const onWidth = (e: Event) => {
      const { width } = (e as CustomEvent<{ width: number }>).detail || {
        width: PANEL_WIDTH,
      };
      setMenuWidth(width);
    };
    window.addEventListener('designer:menu-width', onWidth as EventListener);
    return () =>
      window.removeEventListener(
        'designer:menu-width',
        onWidth as EventListener
      );
  }, []);

  // Track last selected to drive exit animation
  const lastSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    let t: number | undefined;
    if (!selectedId && lastSelectedIdRef.current) {
      setMenuExiting(true);
      t = window.setTimeout(() => setMenuExiting(false), PANEL_ANIM_MS);
    }
    lastSelectedIdRef.current = selectedId;
    return () => {
      if (t !== undefined) window.clearTimeout(t);
    };
  }, [selectedId]);

  /** When entering lasso mode, clear selection. */
  useEffect(() => {
    if (lassoMode) {
      setSelectedId(null);
      setSelectedEdgeId(null);
    }
  }, [lassoMode]);

  /* ---------- Visual Variables popup wiring ---------- */

  useEffect(() => {
    /** Opens visual variables modal for a node id. */
    function onOpenVisualVars(e: Event) {
      const { nodeId } = (e as CustomEvent<{ nodeId: string }>).detail || {};
      if (!nodeId) return;

      const node = nodes.find((n) => n.id === nodeId);
      const current = Array.isArray((node?.data as any)?.visualVars)
        ? ([...(node!.data as any).visualVars] as VisualVariable[])
        : [];

      openModal({
        title: 'Visual variables',
        node: (
          <VisualVariablePopup
            initial={current}
            onCancel={closeModal}
            onSave={(vars) => {
              window.dispatchEvent(
                new CustomEvent('designer:patch-node-data', {
                  detail: { nodeId, patch: { visualVars: vars } },
                })
              );
              closeModal();
            }}
          />
        ),
      });
    }

    const handler = onOpenVisualVars as EventListener;
    window.addEventListener('designer:open-visualvars', handler);
    return () =>
      window.removeEventListener('designer:open-visualvars', handler);
  }, [nodes, openModal, closeModal]);

  /* =====================================================
   *             Graph canvas helpers & behaviors
   * ===================================================== */

  const getReviews = useCallback(
    (targetId: string) => reviewsByTarget[targetId] ?? [],
    [reviewsByTarget]
  );

  const addReview = useCallback((targetId: string, review: Review) => {
    setReviewsByTarget((m) => ({
      ...m,
      [targetId]: [...(m[targetId] ?? []), review],
    }));
  }, []);

  const updateReview = useCallback(
    (targetId: string, id: string, patch: Partial<Review>) => {
      setReviewsByTarget((m) => ({
        ...m,
        [targetId]: (m[targetId] ?? []).map((r) =>
          r.id === id ? { ...r, ...patch } : r
        ),
      }));
    },
    []
  );

  const deleteReview = useCallback((targetId: string, id: string) => {
    setReviewsByTarget((m) => ({
      ...m,
      [targetId]: (m[targetId] ?? []).filter((r) => r.id !== id),
    }));
  }, []);

  /** Patch a node's data by id. */
  const updateNodeById = useCallback(
    async (id: string, patch: Partial<NodeData>) => {
      const patchAny = patch as any;

      // --- 1. DETECT DATA REMOVAL ---
      if (patchAny.data && Array.isArray(patchAny.data)) {
        const node = nodes.find((n) => n.id === id);
        const rawOld = (node?.data as any)?.data;

        const oldItems = Array.isArray(rawOld) ? rawOld : [];
        const newItems = patchAny.data;

        // Helper: Normalize string vs object
        const toName = (i: any) => {
          if (!i) return '';
          if (typeof i === 'string') return i.trim();
          return (i.name || '').trim();
        };

        const newNamesSet = new Set(newItems.map(toName));
        const removedItems = oldItems.filter(
          (i: any) => !newNamesSet.has(toName(i))
        );

        if (removedItems.length > 0) {
          // console.log('Cleaning up removed items:', removedItems);

          const toSlug = (s: string) =>
            s
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9_-]/g, '');

          const removedPrefixes = new Set(
            removedItems.map((i: any) => `data:${toSlug(toName(i))}`)
          );

          const edgeIdsToDelete: string[] = [];
          const nodeIdsToDelete: string[] = []; // Tooltip IDs
          const interactionsToRemove = new Set<string>(); // Interaction IDs
          const tooltipLabelsToRemove = new Set<string>(); // Tooltip Labels (e.g. "T0 Title")

          // A. Find Edges
          edges.forEach((e) => {
            let isMatch = false;
            if (e.source === id && e.sourceHandle) {
              for (const prefix of removedPrefixes) {
                if (e.sourceHandle.startsWith(prefix)) {
                  isMatch = true;
                  break;
                }
              }
            }
            if (!isMatch && e.target === id && e.targetHandle) {
              for (const prefix of removedPrefixes) {
                if (e.targetHandle.startsWith(prefix)) {
                  isMatch = true;
                  break;
                }
              }
            }

            if (isMatch) {
              edgeIdsToDelete.push(e.id);
              // If this is a tooltip edge, mark the tooltip node for deletion
              if (e.type === 'tooltip' && e.source === id) {
                nodeIdsToDelete.push(e.target);
              }
              // If this is an interaction edge, remember its interactionId so we
              // can remove the corresponding entry from the parent/source node.
              if (e.type === 'interaction') {
                const d: any = e.data || {};
                if (d?.interactionId) {
                  interactionsToRemove.add(d.interactionId);
                }
              }
            }
          });

          // B. Identify Interactions to remove
          const currentInteractions = (node?.data as any)?.interactions || [];
          currentInteractions.forEach((ix: any) => {
            if (
              ix.sourceType === 'data' &&
              ix.sourceDataRef &&
              removedItems.some((rm: any) => toName(rm) === ix.sourceDataRef)
            ) {
              interactionsToRemove.add(ix.id);
            }
          });

          // C. Identify Tooltip Labels to remove from Parent
          // We look up the actual Tooltip Nodes before we delete them to get their Badge/Title
          if (nodeIdsToDelete.length > 0) {
            const nodesToDeleteSet = new Set(nodeIdsToDelete);
            const tooltipNodes = nodes.filter((n) =>
              nodesToDeleteSet.has(n.id)
            );

            tooltipNodes.forEach((t) => {
              const d = t.data as any;
              // Format must match exactly how TooltipPopup creates it: "${badge} ${title}"
              const label = `${d.badge ? d.badge + ' ' : ''}${d.title || ''}`;
              tooltipLabelsToRemove.add(label);
            });
          }

          // --- EXECUTE CLEANUP ---

          // 1. Delete Elements via React Flow (Safe delete)
          if (
            rf &&
            (edgeIdsToDelete.length > 0 || nodeIdsToDelete.length > 0)
          ) {
            const edgesToDelete = edgeIdsToDelete.map((eid) => ({ id: eid }));
            const nodesToDelete = nodeIdsToDelete.map((nid) => ({ id: nid }));
            await rf.deleteElements({
              nodes: nodesToDelete,
              edges: edgesToDelete,
            });
          }

          // 2. Update nodes (apply patch to THIS node + clean interactions globally)
          setNodes(
            (nds) =>
              (nds as unknown as Array<RFNode<NodeData>>).map((n) => {
                const curData: any = n.data as any;
                let nextData: any = curData;
                let changed = false;

                // Apply incoming patch only to the edited node
                if (n.id === id) {
                  nextData = { ...curData, ...patchAny };
                  changed = true;
                }

                // Clean Interaction List on ALL nodes (remove by interactionId)
                if (
                  interactionsToRemove.size > 0 &&
                  Array.isArray(nextData?.interactions)
                ) {
                  const filtered = nextData.interactions.filter(
                    (ix: any) => !interactionsToRemove.has(ix?.id)
                  );
                  if (filtered.length !== nextData.interactions.length) {
                    if (!changed) nextData = { ...nextData };
                    nextData.interactions = filtered;
                    changed = true;
                  }
                }

                // Clean Tooltip List (badge counter) only on THIS node
                if (
                  n.id === id &&
                  tooltipLabelsToRemove.size > 0 &&
                  Array.isArray(nextData?.tooltips)
                ) {
                  const filtered = nextData.tooltips.filter(
                    (lbl: string) => !tooltipLabelsToRemove.has(lbl)
                  );
                  if (filtered.length !== nextData.tooltips.length) {
                    if (!changed) nextData = { ...nextData };
                    nextData.tooltips = filtered;
                    changed = true;
                  }
                }

                return changed
                  ? ({ ...n, data: nextData } as RFNode<NodeData>)
                  : n;
              }) as unknown as typeof nds
          );

          return; // Stop here
        }
      }

      // --- STANDARD UPDATE ---
      setNodes(
        (nds) =>
          (nds as unknown as Array<RFNode<NodeData>>).map((n) =>
            n.id === id
              ? ({
                  ...n,
                  data: { ...(n.data as any), ...patchAny },
                } as RFNode<NodeData>)
              : n
          ) as unknown as typeof nds
      );
    },
    [nodes, edges, rf, setNodes]
  );

  /** Keep a single node selected, or clear when multi/none. */
  const handleSelectionChange = useCallback(
    ({
      nodes: selNodes,
      edges: selEdges,
    }: {
      nodes: RFNode<NodeData>[];
      edges: AppEdge[];
    }) => {
      if (lassoMode) {
        setSelectedId(null);
        setSelectedEdgeId(null);
        return;
      }

      // exactly one node selected → node menu
      if (selNodes.length === 1 && selEdges.length === 0) {
        setSelectedId(selNodes[0].id);
        setSelectedEdgeId(null);
        return;
      }

      // exactly one edge selected → edge menu
      if (selNodes.length === 0 && selEdges.length === 1) {
        setSelectedId(null);
        setSelectedEdgeId(selEdges[0].id);
        return;
      }

      // multi-selection or none → clear both
      setSelectedId(null);
      setSelectedEdgeId(null);
    },
    [lassoMode]
  );

  /** Add an edge only if allowed by domain rules; annotate with trigger/edge type. */
  const onConnect = useCallback(
    (c: Connection) => {
      setIsConnecting(false);

      const source = nodes.find((n) => n.id === c.source);
      const target = nodes.find((n) => n.id === c.target);
      const sourceKind = source?.data?.kind as NodeKind | undefined;
      const targetKind = target?.data?.kind as NodeKind | undefined;

      if (!canConnect(sourceKind, targetKind)) return;

      const sh = c.sourceHandle ?? '';
      const trigger: 'click' | 'hover' = sh.endsWith(':hover')
        ? 'hover'
        : 'click';
      const isTooltip = targetKind === 'Tooltip';

      setEdges((eds) =>
        addEdge(
          {
            ...c,
            animated: false,
            type: isTooltip ? 'tooltip' : 'interaction',
            data: isTooltip
              ? {
                  kind: 'tooltip-link',
                  activation: trigger,
                  sourceHandle: sh,
                  sourceKind,
                  targetKind,
                }
              : {
                  kind: 'interaction-link',
                  trigger,
                  activation: trigger,
                  sourceHandle: sh,
                  sourceKind,
                  targetKind,
                },
          } as any,
          eds
        )
      );
    },
    [nodes, setEdges]
  );

  /** Update currently selected node's data, optionally reflowing constraints afterwards. */
  const updateSelectedNode = useCallback(
    (patch: Partial<NodeData>, opts?: { reflow?: boolean }) => {
      if (!selectedId) return;
      const reflow = opts?.reflow ?? false;

      updateNodeById(selectedId, patch);

      setNodes((nds) => {
        const next = (nds as unknown as Array<RFNode<NodeData>>).map((n) =>
          n.id === selectedId
            ? ({
                ...n,
                data: { ...(n.data as any), ...(patch as any) } as NodeData,
              } as RFNode<NodeData>)
            : (n as RFNode<NodeData>)
        );
        return (
          reflow ? (applyConstraints(next as any) as any) : next
        ) as typeof nds;
      });
    },
    [selectedId, setNodes]
  );

  /** Delete the currently selected node (and any dependent nodes/edges). */
  const deleteSelectedNode = useCallback(() => {
    if (!selectedId) return;
    pruneAfterRemoval([selectedId]);
  }, [selectedId]);

  /* ---------- palette drag & drop (dnd-kit) ---------- */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );
  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragData | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [cursorPoint, setCursorPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [dragTargetParentId, setDragTargetParentId] = useState<string | null>(
    null
  );
  const [dragAllowed, setDragAllowed] = useState(false);

  /** Extract a screen-space point from pointer/touch events. */
  function getPointFromEvent(ev: Event): { x: number; y: number } | null {
    if ('clientX' in ev && 'clientY' in ev) {
      const e = ev as unknown as { clientX: number; clientY: number };
      return { x: e.clientX, y: e.clientY };
    }
    if ('touches' in ev && (ev as TouchEvent).touches[0]) {
      const t = (ev as TouchEvent).touches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return null;
  }

  /** Compute the visual center of the dragged element at drop-time. */
  function getDragCenter(e: DragEndEvent): { x: number; y: number } | null {
    const { current } = e.active.rect;
    if (current.translated) {
      const { left, top, width, height } = current.translated;
      return { x: left + width / 2, y: top + height / 2 };
    }
    if (current.initial) {
      const { left, top, width, height } = current.initial;
      return {
        x: left + e.delta.x + width / 2,
        y: top + e.delta.y + height / 2,
      };
    }
    return null;
  }

  /** True if a flow-space point lies in the *content* area of a container node. */
  function pointInsideContentAbs(
    p: { x: number; y: number },
    n: AppNode,
    all: AppNode[]
  ) {
    const { w, h } = getNodeSize(n);
    const abs = getAbsolutePosition(n, all);

    const left = abs.x + PAD_X;
    const top = abs.y + HEADER_H + PAD_TOP;
    const right = abs.x + w - PAD_X;
    const bottom = abs.y + h - PAD_BOTTOM;

    return p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
  }

  /** Start palette drag: capture preview & origin. */
  const handleDragStart = (e: DragStartEvent) => {
    setIsDraggingFromPalette(true);
    setDragPreview((e.active.data.current as DragData) ?? null);
    const p = getPointFromEvent(e.activatorEvent);
    setDragStartPoint(p);
    setCursorPoint(p);
  };

  /** Track drag over canvas and compute deepest valid parent under cursor. */
  const handleDragMove = (e: DragMoveEvent) => {
    if (!dragStartPoint) return;
    const nextCursor = {
      x: dragStartPoint.x + e.delta.x,
      y: dragStartPoint.y + e.delta.y,
    };
    setCursorPoint(nextCursor);
    if (!rf || !wrapperRef.current) return;

    const flowPt = rf.screenToFlowPosition({
      x: nextCursor.x,
      y: nextCursor.y,
    });

    let best: { id: string; kind: NodeKind; depth: number } | null = null;
    for (const n of nodes) {
      const k = n.data?.kind as NodeKind | undefined;
      if (!isContainerKind(k)) continue;
      if (pointInsideContentAbs(flowPt, n as AppNode, nodes as AppNode[])) {
        const d = depthOf(n as AppNode, nodes as AppNode[]);
        if (!best || d > best.depth) best = { id: n.id, kind: k!, depth: d };
      }
    }

    const parentId = best?.id ?? null;
    const parentKind = best?.kind;
    setDragTargetParentId(parentId);

    const payload = e.active?.data?.current as DragData | undefined;
    const childKind = payload?.kind as NodeKind | undefined;
    const isAllowed = !!(
      parentKind &&
      childKind &&
      allowedChildKinds(parentKind).includes(childKind)
    );
    setDragAllowed(isAllowed);

    if (parentId) {
      document.body.style.cursor = isAllowed ? 'copy' : 'not-allowed';
    } else {
      document.body.style.cursor = 'grabbing';
    }
  };

  /** Cancel palette drag and clear feedback. */
  const handleDragCancel = (_e: DragCancelEvent) => {
    setIsDraggingFromPalette(false);
    setDragPreview(null);
    setDragStartPoint(null);
    setCursorPoint(null);
    setDragTargetParentId(null);
    setDragAllowed(false);
    document.body.style.cursor = '';
  };

  /** Finalize drop: open "add component" when dropped inside container, otherwise create free node. */
  const handleDragEnd = (e: DragEndEvent) => {
    setIsDraggingFromPalette(false);
    const payload = e.active.data.current as DragData | undefined;
    setDragPreview(null);

    const parentId = dragTargetParentId;
    const allowed = dragAllowed;
    setDragTargetParentId(null);
    setDragAllowed(false);
    document.body.style.cursor = '';

    if (!payload || !rf || !wrapperRef.current) return;

    // dropped inside a container → open AddComponent flow
    if (allowed && parentId) {
      setModal({
        type: 'add-component',
        nodeId: parentId,
        presetKind: payload.kind as NodeKind,
      });
      return;
    }

    // otherwise create a free node centered at drop point
    const viewportPt = cursorPoint ?? getDragCenter(e);
    setDragStartPoint(null);
    setCursorPoint(null);
    if (!viewportPt) return;

    const flowCenter = rf.screenToFlowPosition({
      x: viewportPt.x,
      y: viewportPt.y,
    });

    let data: NodeData;
    if (payload.kind === 'Graph') {
      data = {
        kind: 'Graph',
        title: payload.title ?? 'Graph',
        graphType: 'Line',
      };
    } else {
      data = {
        kind: payload.kind,
        title: payload.title ?? payload.kind,
      } as NodeData;
    }

    // Default sizes for *free* (not nested) nodes
    const defaultSizeFor = (kind: NodeKind) => {
      if (kind === 'Dashboard') return { width: 700, height: 380 };
      if (kind === 'Visualization') return { width: 320, height: 200 };
      return { width: 180, height: 100 };
    };
    const size = defaultSizeFor(data.kind);

    const position = {
      x: flowCenter.x - size.width / 2,
      y: flowCenter.y - size.height / 2,
    };

    setNodes((nds) =>
      nds.concat({
        id: nanoid(),
        type: nodeTypeFor(data.kind),
        position,
        data: { ...data, badge: nextBadgeFor(data.kind, nds as AppNode[]) },
        style: size,
      } as AppNode)
    );
  };

  /* ---------- Save/Load ---------- */

  /** Build a serializable project (viewport + nodes + edges). */
  const buildSave = useCallback((): SaveFile => {
    const vp = (rf && (rf as any).getViewport?.()) || { x: 0, y: 0, zoom: 1 };

    const exNodes: ExportNode[] = nodes.map((n) => {
      const kind = (n.data as any)?.kind as NodeKind | undefined;
      const inferred = kind ? nodeTypeFor(kind) : 'visualization';
      return {
        id: n.id,
        type: (n.type as any) ?? inferred,
        position: n.position,
        data: n.data,
        style: {
          width: (n as any).width ?? (n.style as any)?.width,
          height: (n as any).height ?? (n.style as any)?.height,
        },
        ...(n.parentNode ? { parentNode: n.parentNode } : {}),
        ...(n.extent === 'parent' ? { extent: 'parent' as const } : {}),
      };
    });

    return {
      version: SAVE_VERSION,
      createdAt: new Date().toISOString(),
      viewport: vp,
      nodes: exNodes,
      edges: edges as AppEdge[],
    };
  }, [rf, nodes, edges]);

  /** Load a project from a previously saved JSON payload. */
  const loadSave = useCallback(
    (save: SaveFile) => {
      const restored: AppNode[] = save.nodes.map((n) => {
        const kind = (n.data as any)?.kind as NodeKind | undefined;
        const fallbackType = kind ? nodeTypeFor(kind) : 'visualization';
        const finalType = (n.type as keyof typeof NODE_TYPES) ?? fallbackType;

        return {
          id: n.id,
          type: finalType,
          position: n.position,
          data: n.data,
          style: { width: n.style?.width, height: n.style?.height },
          parentNode: n.parentNode as any,
          extent: n.extent as any,
        };
      });

      setNodes(restored as unknown as RFNode<NodeData>[]);
      setEdges(save.edges as AppEdge[]);
      if (rf && save.viewport)
        (rf as any).setViewport?.(save.viewport, { duration: 0 });
      setSelectedId(null);
    },
    [rf, setNodes, setEdges]
  );

  // /** Trigger a browser download of the current project as JSON. */
  // const downloadJSON = useCallback((obj: unknown, filename: string) => {
  //   const blob = new Blob([JSON.stringify(obj, null, 2)], {
  //     type: 'application/json',
  //   });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = filename;
  //   document.body.appendChild(a);
  //   a.click();
  //   a.remove();
  //   URL.revokeObjectURL(url);
  // }, []);

  /** Open a .json file and load it as a project. */
  // const openJSONFile: React.ChangeEventHandler<HTMLInputElement> = async (
  //   e
  // ) => {
  //   const file = e.target.files?.[0];
  //   e.currentTarget.value = '';
  //   if (!file) return;

  //   setSaveNameBase(baseFrom(file.name));

  //   const text = await file.text();
  //   const data = JSON.parse(text) as SaveFile;
  //   if (!('version' in data)) {
  //     alert('Invalid file');
  //     return;
  //   }
  //   loadSave(data);
  // };

  /** Show Save modal and download project on confirm. */
  const openSaveModal = useCallback(() => {
    openModal({
      title: 'Save Project',
      node: (
        <SavePopup
          initialName={saveNameBase}
          onCancel={closeModal}
          onConfirm={(finalFilename) => {
            const projectData = buildSave(); // Get the raw data
            saveProjectAsZip(projectData, finalFilename); // Zip it with images

            setSaveNameBase(baseFrom(finalFilename));
            closeModal();
          }}
        />
      ),
    });
  }, [buildSave, openModal, closeModal, saveNameBase]);

  /* ---------- Layout/constraints ---------- */

  /** Expand parents to fit children, clamp children within parents, iterate until stable. */
  function applyConstraints(initial: AppNode[]): AppNode[] {
    let local = initial.map((n) => ({ ...n }));

    for (let pass = 0; pass < 5; pass++) {
      let changed = false;
      const next = local.map((n) => ({ ...n }));

      const patch = (id: string, p: Partial<AppNode>) => {
        const i = next.findIndex((x) => x.id === id);
        if (i >= 0) {
          next[i] = { ...next[i], ...p };
          changed = true;
        }
      };

      for (const parent of local) {
        if (!isContainerKind(parent.data?.kind as NodeKind)) continue;

        const { w: pW, h: pH } = getNodeSize(parent);
        const innerLeft = PAD_X;
        const innerTop = HEADER_H + PAD_TOP;
        const innerRight = pW - PAD_X;
        const innerBottom = pH - PAD_BOTTOM;

        let requiredRight = innerLeft;
        let requiredBottom = innerTop;

        for (const child of local) {
          if (child.parentNode !== parent.id) continue;

          const { w: cW, h: cH } = getNodeSize(child);
          const minX = innerLeft;
          const minY = innerTop;
          let maxX = innerRight - cW;
          let maxY = innerBottom - cH;
          if (maxX < minX) maxX = minX;
          if (maxY < minY) maxY = minY;

          const cx = Math.min(Math.max(child.position.x, minX), maxX);
          const cy = Math.min(Math.max(child.position.y, minY), maxY);
          if (cx !== child.position.x || cy !== child.position.y) {
            patch(child.id, { position: { x: cx, y: cy } } as Partial<AppNode>);
          }

          requiredRight = Math.max(requiredRight, cx + cW, innerLeft + cW);
          requiredBottom = Math.max(requiredBottom, cy + cH, innerTop + cH);
        }

        const base = baseMinFor(parent.data?.kind as NodeKind | undefined);
        const needW = Math.max(pW, requiredRight + PAD_X);
        const needH = Math.max(pH, requiredBottom + PAD_BOTTOM);
        const targetW = Math.max(needW, base.w);
        const targetH = Math.max(needH, base.h);

        if (targetW !== pW || targetH !== pH) {
          patch(parent.id, {
            style: { ...(parent.style || {}), width: targetW, height: targetH },
          });
        }
      }

      local = next;
      if (!changed) break;
    }

    return local;
  }

  /** Create a child node inside a parent (grid placement), then reflow. */
  const createChildInParent = useCallback(
    (
      parentId: string,
      payload:
        | {
            kind: Exclude<NodeKind, 'Graph'>;
            title: string;
            description?: string;
          }
        | {
            kind: 'Graph';
            title: string;
            description?: string;
            graphType: GraphType;
          }
    ) => {
      setNodes((nds) => {
        const all = nds as AppNode[];
        const parent = all.find((n) => n.id === parentId);
        if (!parent) return nds;

        const { w: pW } = getNodeSize(parent);
        const innerLeft = PAD_X;
        const innerTop = HEADER_H + PAD_TOP;
        const innerRight = pW - PAD_X;
        const innerWidth = Math.max(0, innerRight - innerLeft);

        // Default sizes for children (smaller graphs by default here)
        const defaultSizeFor = (kind: NodeKind) => {
          if (kind === 'Visualization') return { width: 320, height: 200 };
          if (
            kind === 'Legend' ||
            kind === 'Tooltip' ||
            kind === 'Filter' ||
            kind === 'Parameter'
          )
            return { width: 220, height: 120 };
          if (kind === 'Button') return { width: 160, height: 90 };
          if (kind === 'Placeholder') return { width: 180, height: 100 };
          if (kind === 'Graph') return { width: 120, height: 70 }; // compact graphs by default
          return { width: 180, height: 100 };
        };
        const size = defaultSizeFor(payload.kind);

        const cols = Math.max(
          1,
          Math.floor((innerWidth + GRID_GAP) / (size.width + GRID_GAP))
        );
        const children = all.filter((n) => n.parentNode === parentId);
        const idx = children.length;
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        const x = innerLeft + col * (size.width + GRID_GAP);
        const y = innerTop + row * (size.height + GRID_GAP);

        let data: NodeData;
        if (payload.kind === 'Graph') {
          data = {
            kind: 'Graph',
            title: payload.title || 'Graph',
            description: payload.description,
            badge: nextBadgeFor('Graph', all),
            graphType: payload.graphType,
          };
        } else {
          data = {
            kind: payload.kind,
            title: payload.title || payload.kind,
            description: payload.description,
            badge: nextBadgeFor(payload.kind, all),
          } as NodeData;
        }

        return all.concat({
          id: nanoid(),
          type: nodeTypeFor(data.kind),
          position: { x, y },
          parentNode: parentId,
          extent: 'parent',
          data,
          style: size,
        } as AppNode) as unknown as RFNode<NodeData>[];
      });

      // Reflow once after adding
      setNodes(
        (nds) =>
          applyConstraints(nds as AppNode[]) as unknown as RFNode<NodeData>[]
      );
    },
    [setNodes]
  );

  /** Compute a map parentId -> list of graph types present under it. */
  function graphTypesByParent(nodes: AppNode[]) {
    const map = new Map<string, GraphType[]>();
    for (const n of nodes) {
      if (n.data?.kind === 'Graph') {
        const gt = (n.data as any).graphType as GraphType | undefined;
        const pid = n.parentNode;
        if (pid && gt) (map.get(pid) ?? map.set(pid, []).get(pid)!).push(gt);
      }
    }
    return map;
  }

  /** Synchronize each container node's `data.graphTypes` to reflect its Graph children. */
  function syncParentGraphTypes(nodes: AppNode[]): AppNode[] {
    const byParent = graphTypesByParent(nodes);
    return nodes.map((n) => {
      const k = n.data?.kind as NodeKind | undefined;
      if (!k || (k !== 'Visualization' && k !== 'Tooltip')) return n;

      const wanted = byParent.get(n.id) ?? [];
      const cur = Array.isArray((n.data as any).graphTypes)
        ? ((n.data as any).graphTypes as GraphType[])
        : [];

      const same =
        cur.length === wanted.length && cur.every((x, i) => x === wanted[i]);
      if (same) return n;

      return {
        ...n,
        data: { ...(n.data as any), graphTypes: wanted } as NodeData,
      } as AppNode;
    });
  }

  /** Centralized cleanup: delete nodes (plus descendants), clean edges and related labels. */
  /** Centralized cleanup: delete nodes (plus descendants), clean edges and related labels + interactions. */
  function pruneAfterRemoval(initialIds: string[]) {
    setNodes((nds) => {
      const all = nds as AppNode[];
      const base = new Set<string>(initialIds);

      // -------------------------------------------------------------------
      // 1. If a Visualization is deleted, also delete its Tooltip nodes
      // -------------------------------------------------------------------
      for (const id of Array.from(base)) {
        const n = all.find((x) => x.id === id);
        if (n?.data?.kind === 'Visualization') {
          all.forEach((t) => {
            if (
              t.data?.kind === 'Tooltip' &&
              (t.data as any)?.attachedTo === id
            ) {
              base.add(t.id);
            }
          });
        }
      }

      // -------------------------------------------------------------------
      // 2. Collect all descendants (legend children, graph children, etc.)
      // -------------------------------------------------------------------
      const toDelete = collectDescendants(all, base);

      // -------------------------------------------------------------------
      // 3. Track tooltip labels that must be removed from Visualizations
      // -------------------------------------------------------------------
      const labelsByViz = new Map<string, Set<string>>();

      for (const tip of all) {
        if (!toDelete.has(tip.id)) continue;
        if (tip.data?.kind !== 'Tooltip') continue;

        const attachedTo = (tip.data as any)?.attachedTo as string | undefined;
        const badge = (tip.data as any)?.badge as string | undefined;
        const title = (tip.data as any)?.title as string | undefined;

        if (!attachedTo || !title) continue;

        const label = `${badge ? badge + ' ' : ''}${title}`;

        if (!labelsByViz.has(attachedTo)) {
          labelsByViz.set(attachedTo, new Set<string>());
        }
        labelsByViz.get(attachedTo)!.add(label);
      }

      // -------------------------------------------------------------------
      // 4. Remove deleted nodes
      // -------------------------------------------------------------------
      let kept = all.filter((n) => !toDelete.has(n.id));

      // -------------------------------------------------------------------
      // 5. Prune tooltip labels inside Visualizations
      // -------------------------------------------------------------------
      kept = kept.map((n) => {
        if (n.data?.kind !== 'Visualization') return n;
        const pruneSet = labelsByViz.get(n.id);
        if (!pruneSet?.size) return n;

        const current = Array.isArray((n.data as any)?.tooltips)
          ? ([...(n.data as any).tooltips] as string[])
          : [];

        const pruned = current.filter((lbl) => !pruneSet.has(lbl));
        if (pruned.length === current.length) return n;

        return {
          ...n,
          data: { ...(n.data as any), tooltips: pruned },
        } as AppNode;
      });

      // -------------------------------------------------------------------
      // 6. REMOVE INTERACTIONS THAT TARGET A DELETED NODE (IMPORTANT!)
      // -------------------------------------------------------------------
      kept = kept.map((n) => {
        const d = n.data as any;
        if (!d?.interactions) return n;

        const cleaned = d.interactions.filter((ix: any) => {
          // Remove if ANY target is deleted
          const stillValid = ix.targets.every(
            (tid: string) => !toDelete.has(tid)
          );

          if (!stillValid) return false;

          // Also remove if the SOURCE is data attribute and that attribute no longer exists
          if (ix.sourceType === 'data' && ix.sourceDataRef) {
            const dataArr = Array.isArray(d.data) ? d.data : [];
            const exists = dataArr.some((attr: any) =>
              typeof attr === 'string'
                ? attr === ix.sourceDataRef
                : attr?.name === ix.sourceDataRef
            );
            if (!exists) return false;
          }

          return true;
        });

        if (cleaned.length === d.interactions.length) return n;

        return {
          ...n,
          data: { ...d, interactions: cleaned },
        } as AppNode;
      });

      // -------------------------------------------------------------------
      // 7. Remove edges touching deleted nodes
      // -------------------------------------------------------------------
      setEdges((eds) =>
        (eds as AppEdge[]).filter(
          (e) => !toDelete.has(e.source) && !toDelete.has(e.target)
        )
      );

      // -------------------------------------------------------------------
      // 8. Reset selection if deleted
      // -------------------------------------------------------------------
      if (selectedId && toDelete.has(selectedId)) {
        setSelectedId(null);
      }

      // -------------------------------------------------------------------
      // 9. Sync graph types for parent nodes (your original behavior)
      // -------------------------------------------------------------------
      return syncParentGraphTypes(
        kept as AppNode[]
      ) as unknown as RFNode<NodeData>[];
    });
  }

  /** Collect all descendants (recursive) of a set of root ids. */
  function collectDescendants(all: AppNode[], roots: Set<string>) {
    const toDelete = new Set(roots);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of all) {
        if (n.parentNode && toDelete.has(n.parentNode) && !toDelete.has(n.id)) {
          toDelete.add(n.id);
          changed = true;
        }
      }
    }
    return toDelete;
  }

  /** Whether `node` lies under the given `ancestorId`. */
  function isDescendant(node: AppNode, ancestorId: string, all: AppNode[]) {
    let cur: AppNode | undefined = all.find((n) => n.id === node.id);
    while (cur?.parentNode) {
      if (cur.parentNode === ancestorId) return true;
      cur = all.find((n) => n.id === cur!.parentNode);
    }
    return false;
  }

  /* ---------- Interaction / Tooltips / Graph type modals & events ---------- */

  /** Open Interaction popup and persist edges + interaction list. */
  /** Open Interaction popup and persist edges + interaction list. */
  useEffect(() => {
    function onOpenInteractions(e: Event) {
      const ce = e as CustomEvent<{ nodeId: string }>;
      const sourceId = ce.detail?.nodeId;
      if (!sourceId) return;

      const source = nodes.find((n) => n.id === sourceId);
      if (!source) return;

      // All possible *targets* for the interaction (any other node)
      const availableTargets = (nodes as AppNode[])
        .filter((n) => n.id !== sourceId)
        .map((n) => {
          const nd = n.data as any;

          const dataAttrs = Array.isArray(nd.data)
            ? nd.data.map((v: any) => {
                const label = typeof v === 'string' ? v : v.name;
                const ref = label
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9_-]/g, '');
                return { ref, label };
              })
            : [];

          const isGraph = nd.kind === 'Graph';
          const graphType = nd.graphType as string | undefined;

          const title =
            isGraph && graphType
              ? `${graphType} Graph` // e.g. "Area Graph", "Bars Graph"
              : nd.title || n.id;

          return {
            id: n.id,
            title,
            kind: nd.kind || 'Node',
            badge: nd.badge,
            parentId: n.parentNode as string | undefined,
            dataAttributes: dataAttrs,
          };
        });

      // Data attributes available on the SOURCE component (if any)
      const rawData = (source.data as any)?.data;
      const dataAttributes = Array.isArray(rawData)
        ? (rawData as (string | DataItem)[])
            .map((it) => {
              const name = typeof it === 'string' ? it : it?.name;
              if (!name) return null;
              return {
                ref: name, // internal ref (we keep the plain name here)
                label: name, // what the user sees
              };
            })
            .filter((x): x is { ref: string; label: string } => x !== null)
        : [];

      const slug = (s: string) =>
        s
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9_-]/g, '');

      openModal({
        title: 'Add interaction',
        node: (
          <InteractionPopup
            availableTargets={availableTargets}
            dataAttributes={dataAttributes}
            onCancel={closeModal}
            onSave={({
              name,
              trigger,
              result,
              targets,
              sourceType,
              sourceDataRef,
              targetDetails,
            }) => {
              console.log('Begin of print onOpenInteractions');
              console.log('Name:' + name);
              console.log('Trigger:' + trigger);
              console.log('Result:' + result);
              console.log('Targets:' + targets);
              console.log('SouceType:' + sourceType);
              console.log('SourceDataRef:' + sourceDataRef);
              console.log('TargetDetails:');
              targetDetails.forEach((detail, index) => {
                console.log(`Detail ${index + 1}:`);
                console.log('  TargetId:', detail.targetId);
                console.log('  TargetType:', detail.targetType);
                if (detail.targetDataRef) {
                  console.log('  TargetDataRef:', detail.targetDataRef);
                }
              });
              console.log('End of print onOpenInteractions');

              // Create a stable interaction id
              const interactionId = nanoid();

              // 1) Persist on source node (in data.interactions)
              setNodes((nds) => {
                const next = (nds as AppNode[]).map((n) => ({ ...n }));
                const i = next.findIndex((n) => n.id === sourceId);
                if (i >= 0) {
                  const cur: Interaction[] = Array.isArray(
                    (next[i].data as any).interactions
                  )
                    ? ([...(next[i].data as any).interactions] as Interaction[])
                    : [];
                  cur.push({
                    id: interactionId,
                    name,
                    trigger,
                    result,
                    targets, // keep your existing field
                    ...({ targetDetails } as any), // add details (cast to any to satisfy TS)
                  } as any);
                  next[i] = {
                    ...next[i],
                    data: {
                      ...(next[i].data as any),
                      interactions: cur,
                    } as any,
                  };
                }
                return next as unknown as RFNode<NodeData>[];
              });

              // 2) Decide which handle the interaction originates from
              const sourceHandleId =
                sourceType === 'component'
                  ? `${sourceId}:act:${trigger}`
                  : `data:${slug(sourceDataRef ?? '')}:${trigger}`;

              // 3) Draw edges (one per target), tagged with interactionId + targetId
              // 3) Draw edges (one per targetDetail), tagged with interactionId + target meta
              setEdges((eds) => {
                const add = targetDetails
                  .filter((detail) => {
                    // de-dupe per (sourceId, targetId, label, and targetDataRef if present)
                    return !(eds as AppEdge[]).some((e) => {
                      if (e.type !== 'interaction') return false;
                      if (e.source !== sourceId) return false;
                      if (e.target !== detail.targetId) return false;
                      const d = (e.data as any) || {};
                      const sameLabel = d?.label === name;
                      const sameAttr =
                        (d?.targetDataRef ?? null) ===
                        (detail.targetDataRef ?? null);
                      return sameLabel && sameAttr;
                    });
                  })
                  .map((detail) => {
                    const tid = detail.targetId;

                    // If target is a DATA ATTRIBUTE, hit its pill handle: data:<slug>:target
                    // Otherwise, fall back to the component-level target handle
                    const targetHandle =
                      detail.targetType === 'data' && detail.targetDataRef
                        ? `data:${slug(detail.targetDataRef)}:target`
                        : `${tid}:target`;

                    return {
                      id: `ix-${sourceId}-${tid}-${nanoid(4)}`,
                      source: sourceId,
                      sourceHandle: sourceHandleId,
                      target: tid,
                      targetHandle,
                      type: 'interaction',
                      data: {
                        kind: 'interaction-link',
                        label: name,
                        trigger,
                        result,
                        sourceHandle: sourceHandleId,
                        sourceType,
                        ...(sourceType === 'data' && sourceDataRef
                          ? { sourceDataRef }
                          : {}),
                        interactionId,
                        targetId: tid,
                        targetType: detail.targetType,
                        ...(detail.targetDataRef
                          ? { targetDataRef: detail.targetDataRef }
                          : {}),
                      },
                    } as AppEdge;
                  });

                return (eds as AppEdge[]).concat(add) as any;
              });

              closeModal();
            }}
          />
        ),
      });
    }

    const handler = onOpenInteractions as EventListener;
    window.addEventListener('designer:open-interactions', handler);
    return () =>
      window.removeEventListener('designer:open-interactions', handler);
  }, [nodes, openModal, closeModal, setNodes, setEdges]);

  /** Open Tooltips popup; create tooltip node + edge and update viz labels on save. */
  useEffect(() => {
    function onOpenTooltips(e: Event) {
      const ce = e as CustomEvent<{ nodeId: string }>;
      const vizId = ce.detail?.nodeId;
      if (!vizId) return;

      const n = nodes.find((x) => x.id === vizId);
      const availableData = ((n?.data as any)?.data ?? []).map((v: any) =>
        typeof v === 'string' ? { name: v, dtype: 'Other' } : v
      );

      const getAbs = (id: string) => {
        const nn = nodes.find((a) => a.id === id) as AppNode | undefined;
        if (!nn) return { x: 0, y: 0, w: 0, h: 0 };
        const w = (nn as any).width ?? (nn.style as any)?.width ?? 180;
        const h = (nn as any).height ?? (nn.style as any)?.height ?? 100;
        const { x, y } = getAbsolutePosition(nn, nodes as AppNode[]);
        return { x, y, w: Number(w) || 0, h: Number(h) || 0 };
      };

      openModal({
        title: 'Tooltip menu',
        node: (
          <TooltipPopup
            availableData={availableData}
            onCancel={closeModal}
            onSave={(spec) => {
              const { attachRef, activation, newTooltip } = spec;
              const vizId = ce.detail?.nodeId;
              if (!vizId) return;

              // Place tooltip to the left
              const abs = getAbs(vizId);
              const tW = 250,
                tH = 180;
              const pos = { x: abs.x - tW - 24, y: abs.y + 8 };
              const tipId = nanoid();

              setNodes((nds) => {
                let next = (nds as AppNode[]).map((x) => ({ ...x }));

                const tipBadge = nextBadgeFor('Tooltip', next) ?? '';
                const tipTitle = newTooltip?.title?.trim() || 'Tooltip';

                const data: NodeData = {
                  kind: 'Tooltip',
                  title: tipTitle,
                  attachedTo: vizId,
                  attachTarget:
                    attachRef === 'viz'
                      ? { type: 'viz' }
                      : { type: 'data', ref: attachRef },
                  activation,
                  badge: tipBadge,
                } as any;

                // Create tooltip node (hidden unless its viz/it/children selected)
                next = next.concat({
                  id: tipId,
                  type: nodeTypeFor('Tooltip'),
                  position: pos,
                  data,
                  style: { width: tW, height: tH },
                  hidden: selectedId !== vizId,
                } as AppNode);

                // Add label to viz node header counter
                const label = `${tipBadge ? tipBadge + ' ' : ''}${tipTitle}`;
                next = next.map((nn) => {
                  if (nn.id !== vizId) return nn;
                  const existing = Array.isArray((nn.data as any)?.tooltips)
                    ? ([...(nn.data as any).tooltips] as string[])
                    : [];
                  if (existing.includes(label)) return nn;
                  return {
                    ...nn,
                    data: { ...nn.data, tooltips: [...existing, label] },
                  };
                });

                return next as unknown as RFNode<NodeData>[];
              });

              // Build tooltip edge
              const slug = (s: string) =>
                s
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9_-]/g, '');

              if (attachRef === 'viz') {
                setEdges(
                  (eds) =>
                    (eds as AppEdge[]).concat({
                      id: `e-viz-${vizId}-tip-${tipId}`,
                      source: vizId,
                      target: tipId,
                      targetHandle: `${tipId}:target`, // 🔹 always hit node-level handle
                      type: 'tooltip',
                      data: { activation, targetH: 180 },
                    } as AppEdge) as any
                );
              } else {
                const sourceHandle = `data:${slug(attachRef)}:${activation}`;

                const addEdgeOnce = () => {
                  setEdges((eds) => {
                    if (
                      (eds as AppEdge[]).some(
                        (e) =>
                          e.source === vizId &&
                          e.target === tipId &&
                          e.sourceHandle === sourceHandle
                      )
                    )
                      return eds;

                    return (eds as AppEdge[]).concat({
                      id: `e-viz-${vizId}-${sourceHandle}-tip-${tipId}`,
                      source: vizId,
                      sourceHandle,
                      target: tipId,
                      targetHandle: `${tipId}:target`, // 🔹 this is the key line
                      type: 'tooltip',
                      data: { activation, attachRef, targetH: 180 },
                    } as AppEdge);
                  });
                };

                // Wait a few frames for the data pill handles to be present
                let tries = 0;
                const tryAdd = () => {
                  if (tries++ < 8) requestAnimationFrame(tryAdd);
                  addEdgeOnce();
                };
                tryAdd();
              }

              closeModal();
            }}
          />
        ),
      });
    }

    const handler = onOpenTooltips as EventListener;
    window.addEventListener('designer:open-tooltips', handler);
    return () => window.removeEventListener('designer:open-tooltips', handler);
  }, [nodes, selectedId, openModal, closeModal, setNodes, setEdges]);

  /** Set of helpers to show overlay activation icons near tooltipped visualizations. */
  const [markers, setMarkers] = useState<
    {
      id: string;
      src: string;
      screenX: number;
      screenY: number;
      isSelected: boolean;
    }[]
  >([]);

  /** Recompute overlay icon positions (called on viewport move). */
  const recomputeMarkers = useCallback(() => {
    if (!rf) return;
    const result: typeof markers = [];

    const tooltipEdges = edges.filter(
      (e: any) => (e.data && e.data.kind) === 'tooltip-link'
    );
    for (const e of tooltipEdges as any[]) {
      const viz = nodes.find((n) => n.id === e.source);
      if (!viz) continue;

      const { x: absX, y: absY } = getAbsolutePosition(
        viz as AppNode,
        nodes as AppNode[]
      );
      const { w, h } = getNodeSize(viz as AppNode);

      const anchorFlow = { x: absX + w, y: absY + h / 2 };
      const s = flowToScreen(rf, anchorFlow);

      const screenX = s.x - 9;
      const screenY = s.y;
      const activation: ActivationKey =
        (e.data?.activation as ActivationKey) || 'hover';

      result.push({
        id: `marker-${e.id}`,
        src: activationIcons[activation],
        screenX,
        screenY,
        isSelected: selectedId === e.source,
      });
    }

    setMarkers(result);
  }, [rf, nodes, edges, selectedId]);

  /** Trigger recompute on any pan/zoom/move. */
  const handleMove = useCallback(() => {
    recomputeMarkers();
  }, [recomputeMarkers]);

  /** Modal state for "add component" / "data" / "interactions" / "tooltips". */
  type ModalSpec =
    | { type: 'data'; nodeId: string }
    | { type: 'interactions'; nodeId: string }
    | { type: 'tooltips'; nodeId: string }
    | { type: 'add-component'; nodeId: string; presetKind?: NodeKind };
  const [modal, setModal] = useState<ModalSpec | null>(null);

  /** Cleanup helper to clear modal state when inner node unmounts. */
  function ModalCleanup({
    onCleanup,
    children,
  }: {
    onCleanup: () => void;
    children: React.ReactNode;
  }) {
    useEffect(() => () => onCleanup(), [onCleanup]);
    return <>{children}</>;
  }

  /** Wire "add component" modal with validation against allowed child kinds. */
  useEffect(() => {
    if (modal?.type !== 'add-component') return;

    const { nodeId, presetKind } = modal;
    if (!nodeId || !presetKind) {
      setModal(null);
      return;
    }

    const parent = nodes.find((n) => n.id === nodeId);
    const parentKind = parent?.data?.kind as NodeKind | undefined;
    if (!parentKind) {
      setModal(null);
      return;
    }

    const allowed = allowedChildKinds(parentKind);
    if (!allowed.includes(presetKind)) {
      setModal(null);
      return;
    }

    const closeAndClear = () => {
      closeModal();
      setModal(null);
    };
    setSelectedId(nodeId);

    openModal({
      title: 'Component Menu',
      node: (
        <ModalCleanup onCleanup={() => setModal(null)}>
          <AddComponentPopup
            kinds={[presetKind] as any}
            onCancel={closeAndClear}
            onSave={(payload: any) => {
              if (
                !payload ||
                typeof payload.kind !== 'string' ||
                'graphType' in payload ||
                'variables' in payload
              ) {
                closeAndClear();
                return;
              }
              window.dispatchEvent(
                new CustomEvent('designer:add-component', {
                  detail: { parentId: nodeId, payload },
                })
              );
              closeAndClear();
            }}
          />
        </ModalCleanup>
      ),
    });
  }, [modal]);

  /** Listen for programmatic "add component" events (used by popup). */
  useEffect(() => {
    function onAddComponent(
      e: CustomEvent<{ parentId: string; payload: any }>
    ) {
      const { parentId, payload } = e.detail || ({} as any);
      if (!parentId || !payload) return;
      createChildInParent(parentId, payload);
    }
    const handler = onAddComponent as unknown as EventListener;
    window.addEventListener('designer:add-component', handler);
    return () => window.removeEventListener('designer:add-component', handler);
  }, [createChildInParent]);

  /** Support patching any node's data by id (used across menus/popups). */
  useEffect(() => {
    function onPatchNodeData(
      e: CustomEvent<{ nodeId: string; patch: Partial<NodeData> }>
    ) {
      const { nodeId, patch } = e.detail || ({} as any);
      if (!nodeId || !patch) return;
      updateNodeById(nodeId, patch);
    }
    const handler = onPatchNodeData as EventListener;
    window.addEventListener('designer:patch-node-data', handler);
    return () =>
      window.removeEventListener('designer:patch-node-data', handler);
  }, [updateNodeById]);

  /** Batch add graphs under a parent according to chosen graph types. */
  useEffect(() => {
    function onAddGraphs(e: Event) {
      const { parentId, graphTypes } =
        (e as CustomEvent<{ parentId: string; graphTypes: GraphType[] }>)
          .detail || {};
      if (!parentId || !Array.isArray(graphTypes) || graphTypes.length === 0)
        return;

      setNodes((nds) => {
        const all = (nds as AppNode[]).map((n) => ({ ...n }));
        const parent = all.find((n) => n.id === parentId);
        if (!parent) return nds;

        const { w: pW } = getNodeSize(parent);
        const innerLeft = PAD_X;
        const innerTop = HEADER_H + PAD_TOP;
        const innerRight = pW - PAD_X;
        const innerWidth = Math.max(0, innerRight - innerLeft);

        const gSize = { width: 200, height: 140 };
        const cols = Math.max(
          1,
          Math.floor((innerWidth + GRID_GAP) / (gSize.width + GRID_GAP))
        );

        const existing = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );

        graphTypes.forEach((gt, idx) => {
          const reuse = existing[idx];
          if (reuse) {
            const i = all.findIndex((n) => n.id === reuse.id);
            all[i] = {
              ...reuse,
              data: { ...(reuse.data as any), graphType: gt } as any,
            };
          } else {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = innerLeft + col * (gSize.width + GRID_GAP);
            const y = innerTop + row * (gSize.height + GRID_GAP);
            all.push({
              id: nanoid(),
              type: nodeTypeFor('Graph'),
              position: { x, y },
              parentNode: parentId,
              extent: 'parent',
              style: gSize,
              data: {
                kind: 'Graph',
                title: 'Graph',
                graphType: gt,
                badge: nextBadgeFor('Graph', all),
              } as NodeData,
            } as AppNode);
          }
        });

        return applyConstraints(all as any) as unknown as RFNode<NodeData>[];
      });
    }

    const handler = onAddGraphs as unknown as EventListener;
    window.addEventListener('designer:add-graphs', handler);
    return () => window.removeEventListener('designer:add-graphs', handler);
  }, [setNodes]);

  /** Edit (replace) the set of graphs under a parent to match chosen graph types. */
  useEffect(() => {
    function onEditGraphs(e: Event) {
      const { parentId, graphTypes } =
        (e as CustomEvent<{ parentId: string; graphTypes: GraphType[] }>)
          .detail || {};
      if (!parentId || !Array.isArray(graphTypes)) return;

      setNodes((nds) => {
        let all = (nds as AppNode[]).map((n) => ({ ...n }));
        const parent = all.find((n) => n.id === parentId);
        if (!parent) return nds;

        const existing = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );
        const existingMap = new Map<GraphType, AppNode>();
        existing.forEach((n) => existingMap.set((n.data as any).graphType, n));

        const wanted = new Set(graphTypes);

        // Remove graphs no longer wanted
        const toRemoveIds = existing
          .filter((n) => !wanted.has((n.data as any).graphType))
          .map((n) => n.id);
        all = all.filter((n) => !toRemoveIds.includes(n.id));

        // Layout helpers
        const { w: pW } = getNodeSize(parent);
        const innerLeft = PAD_X;
        const innerTop = HEADER_H + PAD_TOP;
        const innerRight = pW - PAD_X;
        const innerWidth = Math.max(0, innerRight - innerLeft);
        const gSize = { width: 200, height: 140 };
        const cols = Math.max(
          1,
          Math.floor((innerWidth + GRID_GAP) / (gSize.width + GRID_GAP))
        );

        // Keep remaining graphs, then add missing ones
        const kept = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );
        const needToAdd = graphTypes.filter((gt) => !existingMap.has(gt));
        needToAdd.forEach((gt, i) => {
          const idx = kept.length + i;
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const x = innerLeft + col * (gSize.width + GRID_GAP);
          const y = innerTop + row * (gSize.height + GRID_GAP);

          all.push({
            id: nanoid(),
            type: nodeTypeFor('Graph'),
            position: { x, y },
            parentNode: parentId,
            extent: 'parent',
            style: gSize,
            data: {
              kind: 'Graph',
              title: 'Graph',
              graphType: gt,
              badge: nextBadgeFor('Graph', all),
            } as NodeData,
          } as AppNode);
        });

        // Store selection on parent so popup can preselect
        all = all.map((n) =>
          n.id === parentId
            ? ({
                ...n,
                data: { ...n.data, graphTypes: graphTypes.slice() },
              } as any)
            : n
        );

        return applyConstraints(all as any) as unknown as RFNode<NodeData>[];
      });
    }

    const handler = onEditGraphs as EventListener;
    window.addEventListener('designer:edit-graphs', handler);
    return () => window.removeEventListener('designer:edit-graphs', handler);
  }, [setNodes]);

  /** Set a graph type for a new/first Graph child under a parent node. */
  useEffect(() => {
    function onSetGraphType(e: Event) {
      const { nodeId, graphType } =
        (e as CustomEvent<{ nodeId: string; graphType: GraphType }>).detail ||
        {};
      if (!nodeId || !graphType) return;

      setNodes((nds) => {
        const all = nds as AppNode[];
        const parent = all.find((n) => n.id === nodeId);
        if (!parent) return nds;

        const withParent = all.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, graphType } } : n
        );

        const existing = withParent.find(
          (n) => n.parentNode === nodeId && (n.data as any)?.kind === 'Graph'
        );

        if (existing) {
          return withParent.map((n) =>
            n.id === existing.id ? { ...n, data: { ...n.data, graphType } } : n
          ) as unknown as RFNode<NodeData>[];
        }

        const size = { width: 200, height: 140 };
        const pos = { x: 16, y: 16 };
        return withParent.concat({
          id: nanoid(),
          type: nodeTypeFor('Graph'),
          position: pos,
          parentNode: nodeId,
          extent: 'parent',
          style: size,
          data: {
            kind: 'Graph',
            title: 'Graph',
            graphType,
            badge: nextBadgeFor('Graph', withParent),
          } as NodeData,
        } as AppNode) as unknown as RFNode<NodeData>[];
      });
    }

    const handler = onSetGraphType as unknown as EventListener;
    window.addEventListener('designer:set-graph-type', handler);
    return () => window.removeEventListener('designer:set-graph-type', handler);
  }, [setNodes]);

  /* ---------- Tooltip visibility (contextual rendering) ---------- */

  /** Show tooltips only when viz/tooltip/child is selected; hide otherwise. */
  useEffect(() => {
    setNodes((nds) => {
      const next = (nds as AppNode[]).map((n) => ({ ...n }));
      const selected = selectedId
        ? next.find((n) => n.id === selectedId)
        : null;

      // If a tooltip edge is selected, treat its source viz as “active”
      let vizIdFromEdge: string | null = null;
      if (selectedEdgeId) {
        const edge = (edges as AppEdge[]).find(
          (e) => e.id === selectedEdgeId && e.type === 'tooltip'
        );
        if (edge) {
          vizIdFromEdge = edge.source;
        }
      }

      for (const tip of next) {
        if (tip.data?.kind !== 'Tooltip') continue;

        const attachedTo = (tip.data as any)?.attachedTo as string | undefined;
        if (!attachedTo) continue;

        // visible when:
        //  - its attached visualization is selected
        //  - OR the tooltip edge for that visualization is selected
        //  - OR the tooltip node / its descendants / viz descendants are selected
        const vizSelected =
          selectedId === attachedTo || vizIdFromEdge === attachedTo;
        const tipSelected = selectedId === tip.id;
        const tipChildSelected = selected
          ? isDescendant(selected, tip.id, next)
          : false;
        const vizChildSelected =
          selected && attachedTo
            ? isDescendant(selected, attachedTo, next)
            : false;

        const visible =
          vizSelected || tipSelected || tipChildSelected || vizChildSelected;

        (tip as any).hidden = !visible;

        // propagate hide/show to tooltip descendants
        for (let i = 0; i < next.length; i++) {
          const child = next[i];
          if (isDescendant(child, tip.id, next)) {
            if ((child as any).hidden !== !visible) {
              next[i] = { ...child, hidden: !visible } as any;
            }
          }
        }
      }

      return next as unknown as RFNode<NodeData>[];
    });
  }, [selectedId, selectedEdgeId, edges, setNodes]);

  /* ---------- top-right buttons offset when menu opens/closes ---------- */

  const menuActive = Boolean(selectedId || selectedEdgeId) || menuExiting;

  const buttonsOffset = menuActive
    ? -(
        menuWidth +
        PANEL_MARGIN +
        PANEL_GAP +
        (menuWidth <= COLLAPSED_W ? EXTRA_COLLAPSED_GAP : 0)
      )
    : 0;

  /* =====================================================
   *                       Render
   * ===================================================== */

  return (
    <div
      id="editor-root"
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#aedbe6ff',
        overflow: 'hidden',
      }}
    >
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <SideMenu />
        {/* Centered Review toggle (does not affect menu width/layout) */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            pointerEvents: 'auto',
          }}
        >
          <ReviewToggle
            checked={reviewMode}
            onChange={(v) => setReviewMode(v)}
            leftLabel="Editor"
            rightLabel="Review"
          />
        </div>
        {/* Top-right Save/Load */}
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            zIndex: 10,
            display: 'flex',
            gap: 8,
            transform: `translateX(${buttonsOffset}px)`,
            transition: `transform ${PANEL_ANIM_MS}ms ease`,
            willChange: 'transform',
          }}
        >
          <button
            onClick={openSaveModal}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
            title="Save"
          >
            <FaCloudDownloadAlt size={16} aria-hidden="true" />
            <span>Save</span>
          </button>

          <label
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            title="Load"
          >
            <FaCloudUploadAlt size={16} aria-hidden="true" />
            <span>Load</span>
            {/* --- CHANGE START --- */}
            <input
              type="file"
              accept=".json,.dashboard,.zip" // Allow new formats
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = ''; // Reset
                if (!file) return;

                setSaveNameBase(baseFrom(file.name));

                try {
                  let data;

                  // Check file type
                  if (file.name.endsWith('.json')) {
                    // Legacy Support (Old files)
                    const text = await file.text();
                    data = JSON.parse(text);
                  } else {
                    // New Bundle Support (Unpacks images to DB)
                    data = await loadProjectFromZip(file);
                  }

                  // Validate version check
                  if (!('version' in data)) {
                    alert('Invalid file format');
                    return;
                  }

                  loadSave(data);
                } catch (err) {
                  console.error(err);
                  alert('Failed to load project.');
                }
              }}
            />
            {/* --- CHANGE END --- */}
          </label>
        </div>
        {/* Canvas */}
        <div
          className={`canvas ${isConnecting ? 'rf-connecting' : ''}`}
          ref={wrapperRef}
          style={{ flex: 1, minWidth: 0, position: 'relative' }}
        >
          <ReactFlow
            style={{ position: 'relative', zIndex: 0 }}
            minZoom={0.1}
            maxZoom={2}
            selectionOnDrag={lassoMode}
            selectionMode={SelectionMode.Partial}
            panOnDrag={!lassoMode && !isDraggingFromPalette}
            nodes={nodes}
            edges={visibleEdges}
            onNodesChange={(chs) => {
              onNodesChange(chs);

              const removedIds = chs
                .filter((c) => c.type === 'remove')
                .map((c: any) => c.id as string);
              if (removedIds.length) {
                pruneAfterRemoval(removedIds);
              } else {
                setNodes((nds) => {
                  const constrained = applyConstraints(
                    nds as AppNode[]
                  ) as unknown as AppNode[];
                  const synced = syncParentGraphTypes(constrained);
                  return synced as unknown as RFNode<NodeData>[];
                });
              }

              if (selectedId && !nodes.find((n) => n.id === selectedId))
                setSelectedId(null);
              if (selectedEdgeId && !edges.find((e) => e.id === selectedEdgeId))
                setSelectedEdgeId(null);
            }}
            onEdgesChange={onEdgesChange}
            onConnectStart={() => setIsConnecting(true)}
            onConnectEnd={() => setIsConnecting(false)}
            onConnect={onConnect}
            onInit={setRf}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            onSelectionChange={handleSelectionChange}
            onMove={() => {
              handleMove();
            }}
            onPaneClick={() => {
              setSelectedId(null);
              setSelectedEdgeId(null);
            }}
            fitView
          >
            <Background />
            <Controls showInteractive>
              <ControlButton
                title={
                  lassoMode
                    ? 'Exit lasso (enable pan)'
                    : 'Enter lasso (disable pan)'
                }
                onClick={() => setLassoMode((v) => !v)}
              >
                {lassoMode ? <FaRegSquare /> : <FaHand />}
              </ControlButton>
            </Controls>
          </ReactFlow>

          {/* Overlay: activation icons (tooltips) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 100000,
            }}
          >
            {markers.map((m) => (
              <img
                key={m.id}
                src={m.src}
                alt=""
                style={{
                  position: 'absolute',
                  left: m.screenX,
                  top: m.screenY,
                  width: 20,
                  height: 20,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,.25)',
                  zIndex: m.isSelected ? 100001 : 100000,
                  pointerEvents: 'none',
                }}
                draggable={false}
              />
            ))}
          </div>
        </div>
        {/* --- NODE / EDGE MENUS (single ComponentsMenu in review mode) --- */}
        {selectedNode && (
          <ComponentsMenu
            key={selectedNode.id}
            node={selectedNode as RFNode<NodeData>}
            onChange={updateSelectedNode}
            onDelete={deleteSelectedNode}
            onOpen={(t) =>
              selectedNode && setModal({ type: t, nodeId: selectedNode.id })
            }
            parentData={parentDataForSelected}
            /* review mode wiring */
            reviewMode={reviewMode}
            reviewTargetId={selectedNode.id}
            reviews={getReviews(selectedNode.id)}
            onReviewCreate={(r) => addReview(selectedNode.id, r)}
            onReviewUpdate={(rid, patch) =>
              updateReview(selectedNode.id, rid, patch)
            }
            onReviewDelete={(rid) => deleteReview(selectedNode.id, rid)}
          />
        )}
        {!selectedNode &&
          selectedEdge &&
          (reviewMode ? (
            /* Reuse ComponentsMenu chrome for edges by giving a tiny pseudo-node.
       Menu chrome is identical; content is the review body because reviewMode=true. */
            <ComponentsMenu
              key={`edge-${selectedEdge.id}`}
              node={
                {
                  id: selectedEdge.id,
                  // Kind isn’t used while reviewMode=true, but must be a valid NodeData
                  data: {
                    kind: 'Visualization',
                    title: `Edge ${selectedEdge.id}`,
                  } as any,
                  position: { x: 0, y: 0 },
                  type: 'visualization',
                } as RFNode<NodeData>
              }
              onChange={() => {}}
              onOpen={undefined}
              parentData={undefined}
              /* no delete button for edges here */
              /* review mode wiring */
              reviewMode
              reviewTargetId={selectedEdge.id}
              reviews={getReviews(selectedEdge.id)}
              onReviewCreate={(r) => addReview(selectedEdge.id, r)}
              onReviewUpdate={(rid, patch) =>
                updateReview(selectedEdge.id, rid, patch)
              }
              onReviewDelete={(rid) => deleteReview(selectedEdge.id, rid)}
            />
          ) : /* normal (non-review) edge menus */
          selectedEdge.type === 'tooltip' ? (
            <TooltipEdgeMenu
              edge={selectedEdge as AppEdge}
              sourceTitle={
                (selectedEdgeSource?.data as any)?.title ?? selectedEdge.source
              }
              targetTitle={
                (selectedEdgeTarget?.data as any)?.title ?? selectedEdge.target
              }
              onDelete={() => {
                const tooltipNodeId = selectedEdge.target;
                pruneAfterRemoval([tooltipNodeId]);
                setSelectedEdgeId(null);
              }}
            />
          ) : (
            <InteractionEdgeMenu
              edge={selectedEdge as AppEdge}
              sourceTitle={
                (selectedEdgeSource?.data as any)?.title ?? selectedEdge.source
              }
              targetTitle={
                (selectedEdgeTarget?.data as any)?.title ?? selectedEdge.target
              }
              onDelete={() => {
                const edgeToRemove = selectedEdge as AppEdge;
                const edgeData = (edgeToRemove.data || {}) as any;
                const interactionId = edgeData.interactionId as
                  | string
                  | undefined;
                const targetId =
                  (edgeData.targetId as string | undefined) ??
                  edgeToRemove.target;
                const label = edgeData.label as string | undefined;
                const sourceId = edgeToRemove.source;

                // 1) Remove edge
                setEdges((eds) =>
                  (eds as AppEdge[]).filter((e) => e.id !== edgeToRemove.id)
                );

                // 2) Clean interaction on source
                setNodes((nds) => {
                  const all = nds as AppNode[];
                  const next = all.map((n) => {
                    if (n.id !== sourceId) return n;
                    const d = n.data as any;
                    if (!Array.isArray(d.interactions)) return n;

                    let changed = false;
                    let interactions: any[] = d.interactions;

                    if (interactionId) {
                      interactions = d.interactions
                        .map((ix: any) => {
                          if (ix.id !== interactionId) return ix;
                          const currentTargets: string[] = Array.isArray(
                            ix.targets
                          )
                            ? ix.targets
                            : [];
                          const newTargets = currentTargets.filter(
                            (tid) => tid !== targetId
                          );
                          if (newTargets.length === 0) {
                            changed = true;
                            return null;
                          }
                          if (newTargets.length !== currentTargets.length) {
                            changed = true;
                            return { ...ix, targets: newTargets };
                          }
                          return ix;
                        })
                        .filter(Boolean);
                    } else {
                      interactions = d.interactions.filter((ix: any) => {
                        const currentTargets: string[] = Array.isArray(
                          ix.targets
                        )
                          ? ix.targets
                          : [];
                        const matchesLabel =
                          label &&
                          typeof ix.name === 'string' &&
                          ix.name === label;
                        const containsTarget =
                          currentTargets.includes(targetId);
                        if (matchesLabel && containsTarget) {
                          const newTargets = currentTargets.filter(
                            (tid) => tid !== targetId
                          );
                          if (newTargets.length === 0) {
                            changed = true;
                            return false;
                          }
                          ix.targets = newTargets;
                          changed = true;
                          return true;
                        }
                        return true;
                      });
                    }

                    if (!changed) return n;
                    return { ...n, data: { ...d, interactions } } as AppNode;
                  });

                  return next as unknown as RFNode<NodeData>[];
                });

                // 3) Clear selection
                setSelectedEdgeId(null);
              }}
            />
          ))}
        <DragOverlay dropAnimation={{ duration: 150 }}>
          {dragPreview ? <NodeGhost payload={dragPreview} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
