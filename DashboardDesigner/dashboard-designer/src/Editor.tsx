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
import type { ReactFlowInstance, Connection, Node as RFNode } from 'reactflow';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';
import NodeClass from './canvas/NodeClass';
import type { GraphType, NodeData, NodeKind } from './domain/types';
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

import type { Edge, Node } from 'reactflow';
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

const NODE_TYPES = { class: NodeClass };
const EDGE_TYPES = { tooltip: TooltipEdge };

const PANEL_WIDTH = 280;
const PANEL_MARGIN = 7;
const PANEL_GAP = 8;
const PANEL_ANIM_MS = 200;

export default function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
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
  const baseFrom = (name: string) => name.replace(/\.[^.]+$/, '');

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
    if (lassoMode) setSelectedId(null);
  }, [lassoMode]);

  const updateNodeById = useCallback(
    (id: string, patch: Partial<NodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
        )
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

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;

    if (!selectedId && lastSelectedIdRef.current) {
      setMenuExiting(true);
      t = setTimeout(() => setMenuExiting(false), PANEL_ANIM_MS);
    }
    lastSelectedIdRef.current = selectedId;

    return () => {
      if (t) clearTimeout(t);
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

  const handleSelectionChange = useCallback(
    ({ nodes: sel }: { nodes: RFNode<NodeData>[]; edges: any[] }) => {
      if (lassoMode || sel.length !== 1) {
        setSelectedId(null);
        return;
      }
      // Always keep the clicked node selected (no special-casing Graph).
      const n = sel[0];

      // const kind = n?.data?.kind as NodeKind | undefined;
      // setSelectedId(kind === 'Graph' ? null : n.id);
      setSelectedId(n.id);
    },
    [lassoMode]
  );

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

  const updateSelectedNode = useCallback(
    (patch: Partial<NodeData>, opts?: { reflow?: boolean }) => {
      const reflow = opts?.reflow ?? false; // default: NO constraints
      if (!selectedId) return;
      setNodes((nds) => {
        const next = nds.map((n) =>
          n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n
        );
        return reflow ? applyConstraints(next) : next;
      });
    },
    [selectedId, setNodes]
  );

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
    id: string; // edge id (or unique)
    src: string; // icon url
    screenX: number; // absolute within the canvas overlay
    screenY: number;
    isSelected: boolean;
  };

  const [markers, setMarkers] = useState<ActivationMarker[]>([]);

  // flow → screen helper using the current viewport
  function flowToScreen(pt: { x: number; y: number }) {
    const vp = (rf && (rf as any).getViewport?.()) || { x: 0, y: 0, zoom: 1 };
    return { x: vp.x + pt.x * vp.zoom, y: vp.y + pt.y * vp.zoom };
  }

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

      // anchor at the middle-right of the viz
      const anchorFlow = { x: absX + w, y: absY + h / 2 };
      const s = flowToScreen(anchorFlow);

      const screenX = s.x - 9; // half-in/half-out nudge
      const screenY = s.y;

      const activation: ActivationKey =
        (e.data?.activation as ActivationKey) || 'hover';

      result.push({
        id: `marker-${e.id}`,
        src: activationIcons[activation],
        screenX,
        screenY,
        isSelected: selectedId === e.source, // ⬅️ mark if viz is selected
      });
    }

    setMarkers(result);
  }, [rf, nodes, edges, selectedId]); // ⬅️ include selectedId

  // when nodes/edges change
  useEffect(() => {
    recomputeMarkers();
  }, [recomputeMarkers]);

  // also recompute on pan/zoom/move (React Flow callback)
  const handleMove = useCallback(() => {
    recomputeMarkers();
  }, [recomputeMarkers]);

  // Which parent we’re hovering over while dragging from the palette
  const [dragTargetParentId, setDragTargetParentId] = useState<string | null>(
    null
  );
  const [dragAllowed, setDragAllowed] = useState(false);

  function pointInsideContentAbs(
    p: { x: number; y: number },
    n: Node,
    all: Node[]
  ) {
    const { w, h } = getNodeSize(n);
    const abs = getAbsolutePosition(n, all);

    const left = abs.x + PAD_X;
    const top = abs.y + HEADER_H + PAD_TOP;
    const right = abs.x + w - PAD_X;
    const bottom = abs.y + h - PAD_BOTTOM;

    return p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
  }

  const handleDragStart = (e: DragStartEvent) => {
    setIsDraggingFromPalette(true);
    setDragPreview((e.active.data.current as DragData) ?? null);

    // starting cursor position
    const p = getPointFromEvent(e.activatorEvent);
    setDragStartPoint(p);
    setCursorPoint(p);
  };

  const handleDragMove = (e: DragMoveEvent) => {
    if (!dragStartPoint) return;

    // cursor = start + delta
    const nextCursor = {
      x: dragStartPoint.x + e.delta.x,
      y: dragStartPoint.y + e.delta.y,
    };
    setCursorPoint(nextCursor);

    if (!rf || !wrapperRef.current) return;

    // Map screen → flow coords
    const bounds = wrapperRef.current.getBoundingClientRect();
    const flowPt = rf.project({
      x: nextCursor.x - bounds.left,
      y: nextCursor.y - bounds.top,
    });

    // Find the *deepest* container whose content rect contains the pointer
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

    // Check the payload kind against rules
    const payload = e.active?.data?.current as DragData | undefined;
    const childKind = payload?.kind as NodeKind | undefined;
    const isAllowed = !!(
      parentKind &&
      childKind &&
      allowedChildKinds(parentKind).includes(childKind)
    );
    setDragAllowed(isAllowed);

    // Visual feedback
    if (parentId) {
      document.body.style.cursor = isAllowed ? 'copy' : 'not-allowed';
    } else {
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleDragCancel = (_e: DragCancelEvent) => {
    setIsDraggingFromPalette(false);
    setDragPreview(null);
    setDragStartPoint(null);
    setCursorPoint(null);
    setDragTargetParentId(null);
    setDragAllowed(false);
    document.body.style.cursor = '';
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setIsDraggingFromPalette(false);
    const payload = e.active.data.current as DragData | undefined;
    setDragPreview(null);

    // snapshot targeting state then reset UI cursor/states
    const parentId = dragTargetParentId;
    const allowed = dragAllowed;
    setDragTargetParentId(null);
    setDragAllowed(false);
    document.body.style.cursor = '';

    if (!payload || !rf || !wrapperRef.current) return;

    // If dropping inside a valid parent: open your default Add Component popup
    if (allowed && parentId) {
      setModal({
        type: 'add-component',
        nodeId: parentId,
        presetKind: payload.kind as NodeKind,
      });
      return; // don't add to canvas directly
    }

    // Otherwise keep your existing behavior: drop onto canvas background
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
        type: 'class',
        position,
        data: { ...data, badge: nextBadgeFor(data.kind, nds) },
        style: size,
      })
    );
  };

  const buildSave = useCallback((): SaveFile => {
    const vp = (rf && (rf as any).getViewport?.()) || { x: 0, y: 0, zoom: 1 };

    const exNodes: ExportNode[] = nodes.map((n) => ({
      id: n.id,
      type: n.type ?? 'class',
      position: n.position,
      data: n.data,
      style: {
        width: (n as any).width ?? (n.style as any)?.width,
        height: (n as any).height ?? (n.style as any)?.height,
      },
      ...(n.parentNode ? { parentNode: n.parentNode } : {}),
      ...(n.extent === 'parent' ? { extent: 'parent' as const } : {}),
    }));

    return {
      version: SAVE_VERSION,
      createdAt: new Date().toISOString(),
      viewport: vp,
      nodes: exNodes,
      edges: edges as Edge[],
    };
  }, [rf, nodes, edges]);

  const loadSave = useCallback(
    (save: SaveFile) => {
      const restoredNodes: Node[] = save.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
        style: { width: n.style?.width, height: n.style?.height },
        parentNode: n.parentNode,
        extent: n.extent,
      }));

      setNodes(restoredNodes);
      setEdges(save.edges);
      if (rf && save.viewport) {
        (rf as any).setViewport?.(save.viewport, { duration: 0 });
      }
      setSelectedId(null);
    },
    [rf, setNodes, setEdges]
  );

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

  const openJSONFile: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = ''; // reset input for next open
    if (!file) return;

    // remember the file's base name for subsequent saves
    setSaveNameBase(baseFrom(file.name));

    const text = await file.text();
    const data = JSON.parse(text) as SaveFile;
    if (!('version' in data)) {
      alert('Invalid file');
      return;
    }
    loadSave(data);
  };

  const openSaveModal = useCallback(() => {
    openModal({
      title: 'Save',
      node: (
        <SavePopup
          initialName={saveNameBase}
          onCancel={closeModal}
          onConfirm={(finalFilename) => {
            downloadJSON(buildSave(), finalFilename);
            // remember the last used name (strip .json if present)
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

  function baseMinFor(kind: NodeKind | undefined) {
    return {
      w: kind === 'Dashboard' ? 320 : 240,
      h: kind === 'Dashboard' ? 180 : 140,
    };
  }

  type Size = { w: number; h: number };
  function getNodeSize(n: Node): Size {
    const w = (n as any).width ?? (n.style as any)?.width ?? 180;
    const h = (n as any).height ?? (n.style as any)?.height ?? 100;
    return { w: Number(w) || 0, h: Number(h) || 0 };
  }

  function getAbsolutePosition(n: Node, all: Node[]) {
    let x = n.position.x;
    let y = n.position.y;
    let cur = n;
    while (cur.parentNode) {
      const p = all.find((nn) => nn.id === cur.parentNode);
      if (!p) break;
      x += p.position.x;
      y += p.position.y;
      cur = p;
    }
    return { x, y };
  }

  function depthOf(n: Node, all: Node[]) {
    let d = 0;
    let cur = n;
    while (cur.parentNode) {
      const p = all.find((nn) => nn.id === cur.parentNode);
      if (!p) break;
      d++;
      cur = p;
    }
    return d;
  }

  function isContainerKind(k: NodeKind | undefined) {
    return (
      k === 'Dashboard' ||
      k === 'Visualization' ||
      k === 'Tooltip' ||
      k === 'Parameter'
    );
  }

  /**
   * Expand parents to fit children, then re-clamp children using the new size.
   * Usually converges in 1–2 passes (cap at 5 for safety).
   */
  function applyConstraints(initial: Node[]): Node[] {
    let nodes = initial.map((n) => ({ ...n }));

    for (let pass = 0; pass < 5; pass++) {
      let changed = false;
      const next = nodes.map((n) => ({ ...n }));

      const patch = (id: string, p: Partial<Node>) => {
        const i = next.findIndex((x) => x.id === id);
        if (i >= 0) {
          next[i] = { ...next[i], ...p };
          changed = true;
        }
      };

      for (const parent of nodes) {
        if (!isContainerKind(parent.data?.kind as NodeKind)) continue;

        const { w: pW, h: pH } = getNodeSize(parent);

        const innerLeft = PAD_X;
        const innerTop = HEADER_H + PAD_TOP;
        const innerRight = pW - PAD_X;
        const innerBottom = pH - PAD_BOTTOM;

        let requiredRight = innerLeft;
        let requiredBottom = innerTop;

        for (const child of nodes) {
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
            patch(child.id, { position: { x: cx, y: cy } });
          }

          // content need based on clamped position
          requiredRight = Math.max(requiredRight, cx + cW);
          requiredBottom = Math.max(requiredBottom, cy + cH);

          // also ensure parent grows if child is bigger than inner area
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
          });
        }
      }

      nodes = next;
      if (!changed) break;
    }

    return nodes;
  }

  type ChildPayload =
    | { kind: Exclude<NodeKind, 'Graph'>; title: string; description?: string }
    | {
        kind: 'Graph';
        title: string;
        description?: string;
        graphType: GraphType;
      };

  // create a tooltip node outside the dashboard and a dotted edge from viz -> tooltip
  function createTooltipForVisualization(
    vizId: string,
    spec: { title: string; description?: string; activation: 'hover' | 'click' }
  ) {
    setNodes((nds) => {
      const viz = nds.find((n) => n.id === vizId);
      if (!viz) return nds;

      const { w: vw, h: vh } = getNodeSize(viz);
      const abs = getAbsolutePosition(viz, nds);

      // tooltip size + position (to the RIGHT of the viz, outside)
      const size = { width: 220, height: 140 };
      const margin = 18;
      const pos = {
        x: abs.x + vw + margin, // to the right
        y: Math.max(12, abs.y), // align top-ish
      };

      const tooltipId = nanoid();
      const withTooltip = nds.concat({
        id: tooltipId,
        type: 'class',
        position: pos, // canvas coords (no parent)
        data: {
          kind: 'Tooltip',
          title: spec.title || 'Tooltip',
          description: spec.description,
          badge: nextBadgeFor('Tooltip', nds), // <-- badge ✅
        } as NodeData,
        style: size,
        // NOT parentNode: we want it outside the dashboard
      });

      // add dotted edge from viz -> tooltip with metadata
      setEdges((eds) =>
        eds.concat({
          id: nanoid(),
          source: vizId,
          target: tooltipId,
          style: { stroke: '#64748b', strokeDasharray: '6 4' }, // dotted ✅
          data: { kind: 'tooltip-link', activation: spec.activation },
        } as any)
      );

      return withTooltip;
    });
  }

  const createChildInParent = useCallback(
    (parentId: string, payload: ChildPayload) => {
      setNodes((nds) => {
        const parent = nds.find((n) => n.id === parentId);
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
          if (kind === 'Graph') return { width: 200, height: 140 }; // sensible default
          return { width: 180, height: 100 };
        };
        const size = defaultSizeFor(payload.kind);

        const cols = Math.max(
          1,
          Math.floor((innerWidth + GRID_GAP) / (size.width + GRID_GAP))
        );
        const children = nds.filter((n) => n.parentNode === parentId);
        const idx = children.length;
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        const x = innerLeft + col * (size.width + GRID_GAP);
        const y = innerTop + row * (size.height + GRID_GAP);

        let data: NodeData;
        if (payload.kind === 'Graph') {
          // graphType is required by the union
          data = {
            kind: 'Graph',
            title: payload.title || 'Graph',
            description: payload.description,
            badge: nextBadgeFor('Graph', nds),
            graphType: payload.graphType,
          };
        } else {
          data = {
            kind: payload.kind,
            title: payload.title || payload.kind,
            description: payload.description,
            badge: nextBadgeFor(payload.kind, nds),
          } as NodeData;
        }

        return nds.concat({
          id: nanoid(),
          type: 'class',
          position: { x, y },
          parentNode: parentId,
          extent: 'parent',
          data,
          style: size,
        });
      });

      setNodes((nds) => applyConstraints(nds));
    },
    [setNodes]
  );

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

  // useEffect(() => {
  //   function onOpenTooltips(e: Event) {
  //     const ce = e as CustomEvent<{ nodeId: string }>;
  //     const nodeId = ce.detail?.nodeId;
  //     if (!nodeId) return;

  //     // find the node that asked for the tooltip modal
  //     const n = nodes.find((x) => x.id === nodeId);

  //     // normalize its data list to DataItem[]
  //     const availableData = ((n?.data as any)?.data ?? []).map((v: any) =>
  //       typeof v === 'string' ? { name: v, dtype: 'Other' } : v
  //     );

  //     // gather all tooltip nodes in the graph
  //     const availableTooltips: ExistingTooltip[] = nodes
  //       .filter((x) => x.data?.kind === 'Tooltip')
  //       .map((t) => ({
  //         id: t.id,
  //         title: (t.data as any)?.title ?? '',
  //         badge: (t.data as any)?.badge ?? '',
  //       }));

  //     openModal({
  //       title: 'Tooltip menu',
  //       node: (
  //         <TooltipPopup
  //           availableData={availableData}
  //           availableTooltips={availableTooltips}
  //           onCancel={closeModal}
  //           // To be done later on, when i finish the essentials
  //           // onSave={(payload) => { /* wire up later if needed */ closeModal(); }}
  //         />
  //       ),
  //     });
  //   }

  //   const handler = onOpenTooltips as EventListener;
  //   window.addEventListener('designer:open-tooltips', handler);
  //   return () => window.removeEventListener('designer:open-tooltips', handler);
  // }, [nodes, openModal, closeModal]);

  // Editor.tsx
  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId, patch } =
        (e as CustomEvent<{ nodeId: string; patch: Partial<NodeData> }>)
          .detail || {};
      if (!nodeId || !patch) return;

      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
        )
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
    function onSetGraphType(e: Event) {
      const { nodeId, graphType } =
        (e as CustomEvent<{ nodeId: string; graphType: GraphType }>).detail ||
        {};
      if (!nodeId || !graphType) return;

      setNodes((nds) => {
        const parent = nds.find((n) => n.id === nodeId);
        if (!parent) return nds;

        // (optional) store graphType on the parent too, but it won’t be rendered
        const withParent = nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, graphType } } : n
        );

        const existing = withParent.find(
          (n) => n.parentNode === nodeId && (n.data as any)?.kind === 'Graph'
        );

        if (existing) {
          return withParent.map((n) =>
            n.id === existing.id ? { ...n, data: { ...n.data, graphType } } : n
          );
        }

        const size = { width: 200, height: 140 };
        const pos = { x: 16, y: 16 }; // start near top-left inside the parent
        return withParent.concat({
          id: nanoid(),
          type: 'class',
          position: pos, // relative to parent
          parentNode: nodeId,
          extent: 'parent', // constrain inside parent content
          style: size,
          data: {
            kind: 'Graph',
            title: 'Graph',
            graphType,
            badge: nextBadgeFor('Graph', withParent),
          } as NodeData,
        });
      });
    }

    const handler = onSetGraphType as unknown as EventListener;
    window.addEventListener('designer:set-graph-type', handler);
    return () => window.removeEventListener('designer:set-graph-type', handler);
  }, [setNodes]);

  function ModalCleanup({
    onCleanup,
    children,
  }: {
    onCleanup: () => void;
    children: React.ReactNode;
  }) {
    useEffect(() => {
      return () => {
        onCleanup(); // called when the modal unmounts (backdrop click, ESC, etc.)
      };
    }, [onCleanup]);
    return <>{children}</>;
  }

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
            kinds={[presetKind] as any} // lock type to dragged kind
            onCancel={closeAndClear} // close button
            onSave={(payload: any) => {
              // only handle normal node payloads here
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

  function collectDescendants(all: Node[], roots: Set<string>) {
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

  /** Remove nodes and edges after a deletion, handling tooltips + descendants */
  function pruneAfterRemoval(initialIds: string[]) {
    setNodes((nds) => {
      // start with explicitly removed ids
      const base = new Set<string>(initialIds);

      // if a Visualization is removed, also remove its attached tooltips
      for (const id of Array.from(base)) {
        const n = nds.find((x) => x.id === id);
        if (n?.data?.kind === 'Visualization') {
          nds.forEach((t) => {
            if (
              t.data?.kind === 'Tooltip' &&
              (t.data as any)?.attachedTo === id
            ) {
              base.add(t.id);
            }
          });
        }
      }

      // also remove descendants of anything in `base` (tooltip children, etc.)
      const toDelete = collectDescendants(nds, base);

      // finally filter nodes
      const kept = nds.filter((n) => !toDelete.has(n.id));

      // remove edges connected to any removed id
      setEdges((eds) =>
        eds.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target))
      );

      // clear selection if it got removed
      if (selectedId && toDelete.has(selectedId)) {
        setSelectedId(null);
      }

      return kept;
    });
  }

  function isDescendant(node: Node, ancestorId: string, all: Node[]) {
    let cur: Node | undefined = all.find((n) => n.id === node.id);
    while (cur?.parentNode) {
      if (cur.parentNode === ancestorId) return true;
      cur = all.find((n) => n.id === cur!.parentNode);
    }
    return false;
  }

  function ancestorHasKind(
    nodeId: string,
    kind: NodeKind,
    all: Node[]
  ): string | null {
    let cur = all.find((n) => n.id === nodeId);
    while (cur?.parentNode) {
      const p = all.find((n) => n.id === cur!.parentNode);
      if (!p) break;
      if (p.data?.kind === kind) return p.id;
      cur = p;
    }
    return null;
  }

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
        const nn = nodes.find((a) => a.id === id);
        if (!nn) return { x: 0, y: 0, w: 0, h: 0 };
        const w = (nn as any).width ?? (nn.style as any)?.width ?? 180;
        const h = (nn as any).height ?? (nn.style as any)?.height ?? 100;
        const { x, y } = (getAbsolutePosition as any)(nn, nodes);
        return { x, y, w: Number(w) || 0, h: Number(h) || 0 };
      };

      openModal({
        title: 'Tooltip menu',
        node: (
          <TooltipPopup
            availableData={availableData}
            availableTooltips={availableTooltips}
            onCancel={closeModal}
            onSave={(spec: any) => {
              const { mode, attachTo, activation } = spec;
              const vizId = ce.detail?.nodeId;
              if (!vizId) return;

              const abs = getAbs(vizId);
              const tW = 250,
                tH = 180;
              const pos = { x: abs.x - tW - 24, y: abs.y + 8 };

              const tipId: string | null =
                mode === 'existing'
                  ? (spec.existingId as string)
                  : mode === 'new'
                  ? nanoid()
                  : null;

              if (!tipId) return;

              setNodes((nds) => {
                let next = nds.map((x) => ({ ...x }));

                let tipBadge: string = '';
                let tipTitle: string = 'Tooltip';

                if (mode === 'existing') {
                  const existing = next.find((x) => x.id === tipId);

                  const existingBadge = (existing?.data as any)?.badge as
                    | string
                    | undefined;
                  const existingTitle = (existing?.data as any)?.title as
                    | string
                    | undefined;

                  tipBadge =
                    existingBadge ?? nextBadgeFor('Tooltip', next) ?? '';
                  tipTitle = existingTitle ?? 'Tooltip';

                  next = next.map((x) =>
                    x.id === tipId
                      ? {
                          ...x,
                          parentNode: undefined,
                          extent: undefined,
                          position: pos,
                          style: { ...(x.style || {}), width: tW, height: tH },
                          data: {
                            ...(x.data || {}),
                            kind: 'Tooltip',
                            attachedTo: vizId,
                            attachTarget: attachTo,
                            activation,
                            badge: tipBadge,
                            title: tipTitle,
                          },
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
                    description: spec?.newTooltip?.description,
                    data: spec?.newTooltip?.data,
                    attachedTo: vizId,
                    attachTarget: attachTo,
                    activation,
                    badge: tipBadge,
                  } as any;

                  next = next.concat({
                    id: tipId,
                    type: 'class',
                    position: pos,
                    data,
                    style: { width: tW, height: tH },
                    hidden: selectedId !== vizId,
                  });
                }

                // Append "T# Title" to the viz node’s data.tooltips (as strings), deduped
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

                return next;
              });

              // keep your existing edge creation
              setEdges((eds) => {
                if (eds.some((e) => e.source === vizId && e.target === tipId))
                  return eds;

                // (optional) keep your sourceSide calc here if you had it before
                return eds.concat({
                  id: `e-viz-${vizId}-tip-${tipId}`,
                  source: vizId,
                  target: tipId,
                  type: 'tooltip',
                  style: { strokeDasharray: '4 4' },
                  data: { activation },
                } as any);
              });

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

  useEffect(() => {
    setNodes((nds) => {
      const next = nds.map((n) => ({ ...n }));
      const selected = selectedId
        ? next.find((n) => n.id === selectedId)
        : null;

      for (const tip of next) {
        if (tip.data?.kind !== 'Tooltip') continue;

        const attachedTo = (tip.data as any)?.attachedTo as string | undefined;
        if (!attachedTo) continue;

        // already covered cases
        const vizSelected = selectedId === attachedTo;
        const tipSelected = selectedId === tip.id;
        const tipChildSelected = selected
          ? isDescendant(selected, tip.id, next)
          : false;

        // NEW: any child of the attached visualization is selected
        const vizChildSelected =
          selected && attachedTo
            ? isDescendant(selected, attachedTo, next)
            : false;

        const visible =
          vizSelected || tipSelected || tipChildSelected || vizChildSelected;

        // toggle tooltip
        tip.hidden = !visible;

        // propagate visibility to all descendants of the tooltip
        for (let i = 0; i < next.length; i++) {
          const child = next[i];
          if (isDescendant(child, tip.id, next)) {
            if (child.hidden !== !visible) {
              next[i] = { ...child, hidden: !visible };
            }
          }
        }
      }

      return next;
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
                setNodes((nds) => applyConstraints(nds));
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

          {/* Activation icon overlay - above RF */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 100000, // ⬅️ higher than RF’s nodes/handles
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
                  zIndex: m.isSelected ? 100001 : 100000, // ⬅️ above selection outline
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
            node={selectedNode}
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
