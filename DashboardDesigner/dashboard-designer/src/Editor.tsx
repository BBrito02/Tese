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
} from './domain/types';
import { canConnect } from './domain/rules';
import SideMenu from './components/SideMenu';
import type { DragData } from './components/SideMenu';
import ComponentsMenu from './components/ComponentsMenu';
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

import NodeGhost from './components/NodeGhost';
import { nextBadgeFor } from './domain/types';

import type { SaveFile, ExportNode } from './domain/saveFormat';
import { SAVE_VERSION } from './domain/saveFormat';

import TooltipPopup, {
  type ExistingTooltip,
} from './components/popups/TooltipPopup';

import {
  FaCloudDownloadAlt,
  FaCloudUploadAlt,
  FaRegSquare,
} from 'react-icons/fa';

import { FaHand } from 'react-icons/fa6';
import { useModal } from './components/ui/ModalHost';

import SavePopup from './components/popups/SavePopup';

import { allowedChildKinds } from './domain/rules';
import AddComponentPopup from './components/popups/ComponentPopup';

import TooltipEdge from './canvas/TooltipEdge';

import { activationIcons, type ActivationKey } from './domain/icons';

import VisualVariablePopup from './components/popups/VisualVariablePopup';

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

// Helper to choose the type based on domain kind
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

const EDGE_TYPES = { tooltip: TooltipEdge };

const PANEL_WIDTH = 280;
const PANEL_MARGIN = 7;
const PANEL_GAP = 8;
const PANEL_ANIM_MS = 200;

// Handy aliases used only for annotations (NOT for generics on useNodesState!)
type AppNode = RFNode<NodeData>;
type AppEdge = RFEdge<any>;

export default function Editor() {
  // IMPORTANT: the generic for useNodesState is the **data** type (NodeData)
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId),
    [nodes, selectedId]
  );

  const lastSelectedIdRef = useRef<string | null>(null);
  const [menuExiting, setMenuExiting] = useState(false);

  const [lassoMode, setLassoMode] = useState(false);

  const { openModal, closeModal } = useModal();

  const [menuWidth, setMenuWidth] = useState<number>(PANEL_WIDTH);

  const [saveNameBase, setSaveNameBase] = useState('dashboard-designer');
  // Returns a filename without its extension.
  const baseFrom = (name: string) => name.replace(/\.[^.]+$/, '');

  // Subscribes to menu width changes to keep the top-right buttons positioned.
  useEffect(() => {
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

  useEffect(() => {
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
              // patch the node data
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

  // Clears the selection when entering lasso mode.
  useEffect(() => {
    if (lassoMode) setSelectedId(null);
  }, [lassoMode]);

  // Applies a partial patch to the node's data by id.
  const updateNodeById = useCallback(
    (id: string, patch: Partial<NodeData>) => {
      setNodes(
        (nds) =>
          (nds as unknown as Array<RFNode<NodeData>>).map((n) =>
            n.id === id
              ? ({
                  ...n,
                  // cast after merge so TS doesn't try to validate per-variant unions
                  data: { ...(n.data as any), ...(patch as any) } as NodeData,
                } as RFNode<NodeData>)
              : (n as RFNode<NodeData>)
          ) as unknown as typeof nds
      );
    },
    [setNodes]
  );

  type ModalSpec =
    | { type: 'data'; nodeId: string }
    | { type: 'interactions'; nodeId: string }
    | { type: 'tooltips'; nodeId: string }
    | { type: 'add-component'; nodeId: string; presetKind?: NodeKind };

  const [modal, setModal] = useState<ModalSpec | null>(null);

  // Drives the “menu exit” animation when deselecting the last node.
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

  const COLLAPSED_W = 28;
  const EXTRA_COLLAPSED_GAP = 18;

  const menuActive = Boolean(selectedId) || menuExiting;
  const buttonsOffset = menuActive
    ? -(
        menuWidth +
        PANEL_MARGIN +
        PANEL_GAP +
        (menuWidth <= COLLAPSED_W ? EXTRA_COLLAPSED_GAP : 0)
      )
    : 0;

  // Keeps a single node selected (or clears selection) based on current RF selection.
  const handleSelectionChange = useCallback(
    ({ nodes: sel }: { nodes: RFNode<NodeData>[]; edges: any[] }) => {
      if (lassoMode || sel.length !== 1) {
        setSelectedId(null);
        return;
      }
      setSelectedId(sel[0].id);
    },
    [lassoMode]
  );

  // Adds an edge if the connection is allowed by domain rules.
  const onConnect = useCallback(
    (c: Connection) => {
      const sourceKind = nodes.find((n) => n.id === c.source)?.data.kind as
        | NodeKind
        | undefined;
      const targetKind = nodes.find((n) => n.id === c.target)?.data.kind as
        | NodeKind
        | undefined;
      if (!canConnect(sourceKind, targetKind)) return;
      setEdges((eds) => addEdge({ ...c, animated: false }, eds));
    },
    [nodes, setEdges]
  );

  // Patches the currently selected node (optionally reflowing constraints).
  const updateSelectedNode = useCallback(
    (patch: Partial<NodeData>, opts?: { reflow?: boolean }) => {
      if (!selectedId) return;
      const reflow = opts?.reflow ?? false;

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

  // Removes the currently selected node (plus dependent nodes/edges).
  const deleteSelectedNode = useCallback(() => {
    if (!selectedId) return;
    pruneAfterRemoval([selectedId]);
  }, [selectedId]);

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

  // Extracts a screen point (x,y) from mouse/touch events.
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

  // Computes the visual center of the dragged item at drop time.
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

  type ActivationMarker = {
    id: string;
    src: string;
    screenX: number;
    screenY: number;
    isSelected: boolean;
  };

  const [markers, setMarkers] = useState<ActivationMarker[]>([]);

  // Converts a flow-space point to screen-space using the current viewport.
  function flowToScreen(pt: { x: number; y: number }) {
    const vp = (rf && (rf as any).getViewport?.()) || { x: 0, y: 0, zoom: 1 };
    return { x: vp.x + pt.x * vp.zoom, y: vp.y + pt.y * vp.zoom };
  }

  // Rebuilds the tooltip activation icons overlay according to edges and selection.
  const recomputeMarkers = useCallback(() => {
    if (!rf) return;
    const result: ActivationMarker[] = [];

    const tooltipEdges = edges.filter(
      (e: any) => (e.data && e.data.kind) === 'tooltip-link'
    );

    for (const e of tooltipEdges as any[]) {
      const viz = nodes.find((n) => n.id === e.source);
      if (!viz) continue;

      const { x: absX, y: absY } = getAbsolutePosition(viz, nodes);
      const { w, h } = getNodeSize(viz);

      const anchorFlow = { x: absX + w, y: absY + h / 2 };
      const s = flowToScreen(anchorFlow);

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

  // Recomputes overlay markers after any pan/zoom/move event.
  const handleMove = useCallback(() => {
    recomputeMarkers();
  }, [recomputeMarkers]);

  const [dragTargetParentId, setDragTargetParentId] = useState<string | null>(
    null
  );
  const [dragAllowed, setDragAllowed] = useState(false);

  // Checks if a point falls inside a container node’s content area.
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

  // Begins palette drag, capturing the initial pointer position and preview.
  const handleDragStart = (e: DragStartEvent) => {
    setIsDraggingFromPalette(true);
    setDragPreview((e.active.data.current as DragData) ?? null);

    const p = getPointFromEvent(e.activatorEvent);
    setDragStartPoint(p);
    setCursorPoint(p);
  };

  // Tracks palette drag, finding the deepest valid parent and setting cursor feedback.
  const handleDragMove = (e: DragMoveEvent) => {
    if (!dragStartPoint) return;

    const nextCursor = {
      x: dragStartPoint.x + e.delta.x,
      y: dragStartPoint.y + e.delta.y,
    };
    setCursorPoint(nextCursor);

    if (!rf || !wrapperRef.current) return;

    const bounds = wrapperRef.current.getBoundingClientRect();
    const flowPt = rf.project({
      x: nextCursor.x - bounds.left,
      y: nextCursor.y - bounds.top,
    });

    let best: { id: string; kind: NodeKind; depth: number } | null = null;

    for (const n of nodes) {
      const k = n.data?.kind as NodeKind | undefined;
      if (!isContainerKind(k)) continue;
      if (pointInsideContentAbs(flowPt, n, nodes)) {
        const d = depthOf(n, nodes);
        if (!best || d > best.depth) {
          best = { id: n.id, kind: k!, depth: d };
        }
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

  // Cancels palette drag and resets all transient UI state.
  const handleDragCancel = (_e: DragCancelEvent) => {
    setIsDraggingFromPalette(false);
    setDragPreview(null);
    setDragStartPoint(null);
    setCursorPoint(null);
    setDragTargetParentId(null);
    setDragAllowed(false);
    document.body.style.cursor = '';
  };

  // Finalizes a palette drop by adding a node or opening the add-component modal.
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

    if (allowed && parentId) {
      setModal({
        type: 'add-component',
        nodeId: parentId,
        presetKind: payload.kind as NodeKind,
      });
      return;
    }

    const viewportPt = cursorPoint ?? getDragCenter(e);
    setDragStartPoint(null);
    setCursorPoint(null);
    if (!viewportPt) return;

    const bounds = wrapperRef.current.getBoundingClientRect();
    const flowCenter = rf.project({
      x: viewportPt.x - bounds.left,
      y: viewportPt.y - bounds.top,
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
        type: nodeTypeFor(data.kind), // <-- IMPORTANT
        position,
        data: { ...data, badge: nextBadgeFor(data.kind, nds as AppNode[]) },
        style: size,
      } as AppNode)
    );
  };

  // Builds a serializable savefile including viewport, nodes and edges.
  const buildSave = useCallback((): SaveFile => {
    const vp = (rf && (rf as any).getViewport?.()) || { x: 0, y: 0, zoom: 1 };

    const exNodes: ExportNode[] = nodes.map((n) => {
      // If type is missing (legacy), infer from data.kind
      const kind = (n.data as any)?.kind as NodeKind | undefined;
      const inferred = kind ? nodeTypeFor(kind) : 'visualization';

      return {
        id: n.id,
        type: (n.type as any) ?? inferred, // <-- no "class" fallback anymore
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

  // Restores a previously saved graph (nodes, edges, viewport).
  const loadSave = useCallback(
    (save: SaveFile) => {
      const restoredNodes: AppNode[] = save.nodes.map((n) => {
        const kind = (n.data as any)?.kind as NodeKind | undefined;
        // If the saved type is missing/legacy, derive from kind
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

      setNodes(restoredNodes as unknown as RFNode<NodeData>[]);
      setEdges(save.edges as AppEdge[]);
      if (rf && save.viewport) {
        (rf as any).setViewport?.(save.viewport, { duration: 0 });
      }
      setSelectedId(null);
    },
    [rf, setNodes, setEdges]
  );

  // Triggers a browser download for an object as a .json file.
  const downloadJSON = useCallback((obj: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Opens and parses a saved JSON file, then loads it into the editor.
  const openJSONFile: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;

    setSaveNameBase(baseFrom(file.name));

    const text = await file.text();
    const data = JSON.parse(text) as SaveFile;
    if (!('version' in data)) {
      alert('Invalid file');
      return;
    }
    loadSave(data);
  };

  // Opens the Save modal and downloads the current project when confirmed.
  const openSaveModal = useCallback(() => {
    openModal({
      title: 'Save',
      node: (
        <SavePopup
          initialName={saveNameBase}
          onCancel={closeModal}
          onConfirm={(finalFilename) => {
            downloadJSON(buildSave(), finalFilename);
            setSaveNameBase(baseFrom(finalFilename));
            closeModal();
          }}
        />
      ),
    });
  }, [buildSave, downloadJSON, openModal, closeModal, saveNameBase]);

  const PAD_X = 5;
  const PAD_TOP = 17;
  const PAD_BOTTOM = 28;
  const HEADER_H = 23;
  const GRID_GAP = 16;

  // Returns the minimum base size for a given container kind.
  function baseMinFor(kind: NodeKind | undefined) {
    return {
      w: kind === 'Dashboard' ? 320 : 240,
      h: kind === 'Dashboard' ? 180 : 140,
    };
  }

  type Size = { w: number; h: number };
  // Reads the current width/height for a node (style or measured).
  function getNodeSize(n: AppNode): Size {
    const w = (n as any).width ?? (n.style as any)?.width ?? 180;
    const h = (n as any).height ?? (n.style as any)?.height ?? 100;
    return { w: Number(w) || 0, h: Number(h) || 0 };
  }

  // Computes the absolute canvas position of a node (accumulating parents).
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

  // Returns the depth (nesting level) of a node within the hierarchy.
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

  // Tells whether a kind can contain children (i.e., is a container).
  function isContainerKind(k: NodeKind | undefined) {
    return (
      k === 'Dashboard' || k === 'Visualization' || k === 'Tooltip' //||
      //k === 'Parameter'
    );
  }

  // Expands parents to fit children and reclamps children to the new bounds.
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

          requiredRight = Math.max(requiredRight, cx + cW);
          requiredBottom = Math.max(requiredBottom, cy + cH);

          requiredRight = Math.max(requiredRight, innerLeft + cW);
          requiredBottom = Math.max(requiredBottom, innerTop + cH);
        }

        const base = baseMinFor(parent.data?.kind as NodeKind | undefined);
        const needW = Math.max(pW, requiredRight + PAD_X);
        const needH = Math.max(pH, requiredBottom + PAD_BOTTOM);
        const targetW = Math.max(needW, base.w);
        const targetH = Math.max(needH, base.h);

        if (targetW !== pW || targetH !== pH) {
          patch(parent.id, {
            style: { ...(parent.style || {}), width: targetW, height: targetH },
          } as Partial<AppNode>);
        }
      }

      local = next;
      if (!changed) break;
    }

    return local;
  }

  type ChildPayload =
    | { kind: Exclude<NodeKind, 'Graph'>; title: string; description?: string }
    | {
        kind: 'Graph';
        title: string;
        description?: string;
        graphType: GraphType;
      };

  // Creates a child node inside a given parent and reflows constraints.
  const createChildInParent = useCallback(
    (parentId: string, payload: ChildPayload) => {
      setNodes((nds) => {
        const all = nds as AppNode[];
        const parent = all.find((n) => n.id === parentId);
        if (!parent) return nds;

        const { w: pW } = getNodeSize(parent);
        const innerLeft = PAD_X;
        const innerTop = HEADER_H + PAD_TOP;
        const innerRight = pW - PAD_X;
        const innerWidth = Math.max(0, innerRight - innerLeft);

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
          if (kind === 'Graph') return { width: 200, height: 140 };
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
          type: nodeTypeFor(data.kind), // <-- IMPORTANT
          position: { x, y },
          parentNode: parentId,
          extent: 'parent',
          data,
          style: size,
        } as AppNode) as unknown as RFNode<NodeData>[];
      });

      setNodes(
        (nds) =>
          applyConstraints(nds as AppNode[]) as unknown as RFNode<NodeData>[]
      );
    },
    [setNodes]
  );

  function graphTypesByParent(nodes: AppNode[]): Map<string, GraphType[]> {
    const map = new Map<string, GraphType[]>();
    for (const n of nodes) {
      if (n.data?.kind === 'Graph') {
        const gt = (n.data as any).graphType as GraphType | undefined;
        const pid = n.parentNode;
        if (pid && gt) {
          const arr = map.get(pid) ?? [];
          arr.push(gt);
          map.set(pid, arr);
        }
      }
    }
    return map;
  }

  /**
   * Returns a new array with each container's data.graphTypes
   * synchronized to the current set of Graph children.
   */
  function syncParentGraphTypes(nodes: AppNode[]): AppNode[] {
    const byParent = graphTypesByParent(nodes);
    return nodes.map((n) => {
      const k = n.data?.kind as NodeKind | undefined;
      // only the kinds that can host Graph children need the field
      if (!k || (k !== 'Visualization' && k !== 'Tooltip')) return n;

      const wanted = byParent.get(n.id) ?? [];
      const cur = Array.isArray((n.data as any).graphTypes)
        ? ((n.data as any).graphTypes as GraphType[])
        : [];

      // if already equal, keep as is to avoid unnecessary renders
      const same =
        cur.length === wanted.length && cur.every((x, i) => x === wanted[i]); // order is stable enough for us

      if (same) return n;
      return {
        ...n,
        data: { ...(n.data as any), graphTypes: wanted } as NodeData,
      } as AppNode;
    });
  }

  // Listens for “add component” events and inserts the requested child into its parent.
  useEffect(() => {
    function onAddComponent(
      e: CustomEvent<{ parentId: string; payload: ChildPayload }>
    ) {
      const { parentId, payload } = e.detail || ({} as any);
      if (!parentId || !payload) return;
      createChildInParent(parentId, payload);
    }
    const handler = onAddComponent as unknown as EventListener;
    window.addEventListener('designer:add-component', handler);
    return () => window.removeEventListener('designer:add-component', handler);
  }, [createChildInParent]);

  // Listens for visualization prop updates and patches the target node.data.
  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId, patch } =
        (e as CustomEvent<{ nodeId: string; patch: Partial<NodeData> }>)
          .detail || {};
      if (!nodeId || !patch) return;

      setNodes(
        (nds) =>
          (nds as AppNode[]).map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
          ) as unknown as RFNode<NodeData>[]
      );
    };

    window.addEventListener(
      'designer:update-visualization-props',
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:update-visualization-props',
        handler as EventListener
      );
  }, [setNodes]);

  // Listens for generic “patch node data” events and applies them by id.
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

        // existing Graph children under this parent
        const existing = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );

        // layout helpers
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

        // ensure we have one Graph node per requested type
        graphTypes.forEach((gt, idx) => {
          const reuse = existing[idx]; // reuse slot if present
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

        // optional: keep any extra existing graphs beyond the selection
        const reflowed = applyConstraints(all as any) as AppNode[];
        return reflowed as unknown as RFNode<NodeData>[];
      });
    }

    const handler = onAddGraphs as unknown as EventListener;
    window.addEventListener('designer:add-graphs', handler);
    return () => window.removeEventListener('designer:add-graphs', handler);
  }, [setNodes]);

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

        // remove those not wanted anymore
        const toRemoveIds = existing
          .filter((n) => !wanted.has((n.data as any).graphType))
          .map((n) => n.id);
        all = all.filter((n) => !toRemoveIds.includes(n.id));

        // layout helpers
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

        // keep the remaining graphs first
        const kept = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );

        // add the missing ones
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

        // store selection on parent so popup can preselect next time
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

  // Handles “set graph type” events by creating/updating a child Graph under a parent.
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

  // Ensures modal state is cleared when the modal component unmounts.
  function ModalCleanup({
    onCleanup,
    children,
  }: {
    onCleanup: () => void;
    children: React.ReactNode;
  }) {
    useEffect(() => {
      return () => {
        onCleanup();
      };
    }, [onCleanup]);
    return <>{children}</>;
  }

  // When opening the “add-component” modal, validates context and wires its actions.
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

  // Gathers all descendant node ids for a given set of root ids.
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

  // Removes nodes/edges after deletions, including attached tooltips and descendants.
  function pruneAfterRemoval(initialIds: string[]) {
    setNodes((nds) => {
      const all = nds as AppNode[];
      const base = new Set<string>(initialIds);

      // if a viz is deleted, also delete its attached tooltips (you already had this)
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

      const toDelete = collectDescendants(all, base);

      // ---- NEW: gather labels of tooltips we are deleting, grouped by viz id
      const labelsByViz = new Map<string, Set<string>>();
      for (const tip of all) {
        if (!toDelete.has(tip.id)) continue;
        if (tip.data?.kind !== 'Tooltip') continue;

        const attachedTo = (tip.data as any)?.attachedTo as string | undefined;
        const badge = (tip.data as any)?.badge as string | undefined;
        const title = (tip.data as any)?.title as string | undefined;
        if (!attachedTo || !title) continue;

        const label = `${badge ? badge + ' ' : ''}${title}`;
        if (!labelsByViz.has(attachedTo))
          labelsByViz.set(attachedTo, new Set());
        labelsByViz.get(attachedTo)!.add(label);
      }

      // keep nodes that are not being deleted
      const kept = all.filter((n) => !toDelete.has(n.id));

      // ---- NEW: remove deleted tooltip labels from each affected visualization
      for (let i = 0; i < kept.length; i++) {
        const n = kept[i];
        if (n.data?.kind !== 'Visualization') continue;

        const toPrune = labelsByViz.get(n.id);
        if (!toPrune || toPrune.size === 0) continue;

        const current = Array.isArray((n.data as any)?.tooltips)
          ? ([...(n.data as any).tooltips] as string[])
          : [];

        const pruned = current.filter((lbl) => !toPrune.has(lbl));
        if (pruned.length !== current.length) {
          kept[i] = {
            ...n,
            data: { ...(n.data as any), tooltips: pruned } as any,
          } as AppNode;
        }

        const synced = syncParentGraphTypes(kept as AppNode[]);
        return synced as unknown as RFNode<NodeData>[];
      }

      // existing edge cleanup (you already had this)
      setEdges((eds) =>
        (eds as AppEdge[]).filter(
          (e) => !toDelete.has(e.source) && !toDelete.has(e.target)
        )
      );

      if (selectedId && toDelete.has(selectedId)) {
        setSelectedId(null);
      }

      return kept as unknown as RFNode<NodeData>[];
    });
  }

  // Returns true if a given node lies under the specified ancestor.
  function isDescendant(node: AppNode, ancestorId: string, all: AppNode[]) {
    let cur: AppNode | undefined = all.find((n) => n.id === node.id);
    while (cur?.parentNode) {
      if (cur.parentNode === ancestorId) return true;
      cur = all.find((n) => n.id === cur!.parentNode);
    }
    return false;
  }

  // Opens the Tooltips modal and wires saving to create/link tooltip nodes.
  useEffect(() => {
    function onOpenTooltips(e: Event) {
      const ce = e as CustomEvent<{ nodeId: string }>;
      const vizId = ce.detail?.nodeId;
      if (!vizId) return;

      const n = nodes.find((x) => x.id === vizId);
      const availableData = ((n?.data as any)?.data ?? []).map((v: any) =>
        typeof v === 'string' ? { name: v, dtype: 'Other' } : v
      );

      const availableTooltips: ExistingTooltip[] = nodes
        .filter((x) => x.data?.kind === 'Tooltip')
        .map((t) => ({
          id: t.id,
          title: (t.data as any)?.title ?? '',
          badge: (t.data as any)?.badge ?? '',
        }));

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
            availableTooltips={availableTooltips}
            onCancel={closeModal}
            onSave={(spec) => {
              const { mode, attachRef, activation } = spec;
              const vizId = ce.detail?.nodeId;
              if (!vizId) return;

              // position for new tooltip stays the same...
              const abs = getAbs(vizId);
              const tW = 250,
                tH = 180;
              const pos = { x: abs.x - tW - 24, y: abs.y + 8 };

              const tipId = mode === 'existing' ? spec.existingId! : nanoid();
              const sourceHandle = `data:${attachRef}`;
              if (!tipId) return;

              setNodes((nds) => {
                let next = (nds as AppNode[]).map((x) => ({ ...x }));

                let tipBadge = '';
                let tipTitle = 'Tooltip';

                if (mode === 'existing') {
                  const existing = next.find((x) => x.id === tipId);

                  const prev = (existing?.data as any) ?? {};
                  const finalTitle =
                    typeof prev.title === 'string' && prev.title.trim().length
                      ? prev.title
                      : tipTitle || 'Tooltip';
                  const finalBadge =
                    typeof prev.badge === 'string' && prev.badge.trim().length
                      ? prev.badge
                      : tipBadge || nextBadgeFor('Tooltip', next) || '';

                  next = next.map((x) =>
                    x.id === tipId
                      ? {
                          ...x,
                          parentNode: undefined,
                          extent: undefined,
                          position: pos,
                          style: { ...(x.style || {}), width: tW, height: tH },
                          data: {
                            // keep everything the tooltip already had
                            ...prev,
                            kind: 'Tooltip',
                            // prefer the tooltip’s own title/badge; fall back to computed
                            title: finalTitle,
                            badge: finalBadge,

                            // only these three are updated for the link
                            attachedTo: vizId,
                            attachTarget: attachRef,
                            activation,
                          } as NodeData,
                          hidden: selectedId !== vizId,
                        }
                      : x
                  );
                } else {
                  tipBadge = nextBadgeFor('Tooltip', next) ?? '';
                  tipTitle = spec?.newTooltip?.title?.trim() || 'Tooltip';

                  const data: NodeData = {
                    kind: 'Tooltip',
                    title: tipTitle,
                    attachedTo: vizId,
                    attachTarget: attachRef, // use the selected data pill
                    activation,
                    badge: tipBadge,
                  } as any;

                  next = next.concat({
                    id: tipId,
                    type: nodeTypeFor('Tooltip'),
                    position: pos,
                    data,
                    style: { width: tW, height: tH },
                    hidden: selectedId !== vizId,
                  } as AppNode);
                }

                const label = `${tipBadge ? tipBadge + ' ' : ''}${tipTitle}`;
                next = next.map((n) => {
                  if (n.id !== vizId) return n;
                  const existingList = Array.isArray((n.data as any)?.tooltips)
                    ? ([...(n.data as any).tooltips] as string[])
                    : [];
                  if (existingList.includes(label)) return n;
                  return {
                    ...n,
                    data: {
                      ...n.data,
                      tooltips: [...existingList, label],
                    },
                  };
                });

                return next as unknown as RFNode<NodeData>[];
              });

              const dataHandleId = (label: string) => `data:${slug(label)}`;

              const hasHandleNow = () => {
                const viz = nodes.find((n) => n.id === vizId);
                const items = (viz?.data as any)?.data ?? [];
                return items.some(
                  (it: any) =>
                    dataHandleId(typeof it === 'string' ? it : it.name) ===
                    sourceHandle
                );
              };

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
                    sourceHandle, // must match pill Handle id
                    target: tipId,
                    type: 'tooltip',
                    style: { strokeDasharray: '4 4' },
                    data: { activation, attachRef, targetH: 180 },
                  } as AppEdge) as any;
                });
              };

              const slug = (s: string) =>
                s
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9_-]/g, '');

              let tries = 0;
              const tryAdd = () => {
                if (hasHandleNow()) {
                  addEdgeOnce();
                } else if (tries++ < 8) {
                  requestAnimationFrame(tryAdd);
                } else {
                  // optional: console.warn('Data handle not found:', sourceHandle);
                }
              };
              tryAdd();

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

  // Shows tooltips (and their descendants) only when the viz/tooltip/child is selected.
  useEffect(() => {
    setNodes((nds) => {
      const next = (nds as AppNode[]).map((n) => ({ ...n }));
      const selected = selectedId
        ? next.find((n) => n.id === selectedId)
        : null;

      for (const tip of next) {
        if (tip.data?.kind !== 'Tooltip') continue;

        const attachedTo = (tip.data as any)?.attachedTo as string | undefined;
        if (!attachedTo) continue;

        const vizSelected = selectedId === attachedTo;
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
  }, [selectedId, setNodes]);

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
            <input
              type="file"
              accept="application/json,.json"
              onChange={openJSONFile}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div
          className="canvas"
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
            edges={edges}
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

              if (selectedId && !nodes.find((n) => n.id === selectedId)) {
                setSelectedId(null);
              }
            }}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRf}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            onSelectionChange={handleSelectionChange}
            onMove={handleMove}
            onPaneClick={() => {
              setSelectedId(null);
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
        {(selectedNode || menuExiting) && (
          <ComponentsMenu
            key={selectedNode?.id ?? 'components-menu'}
            node={selectedNode as RFNode<NodeData> | undefined}
            onChange={updateSelectedNode}
            onDelete={deleteSelectedNode}
            onOpen={(t) =>
              selectedNode && setModal({ type: t, nodeId: selectedNode.id })
            }
          />
        )}

        <DragOverlay dropAnimation={{ duration: 150 }}>
          {dragPreview ? <NodeGhost payload={dragPreview} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
