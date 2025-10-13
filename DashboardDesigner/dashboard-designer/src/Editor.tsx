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

const NODE_TYPES = { class: NodeClass };

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
    | { type: 'add-component'; nodeId: string };

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
      // hide menu if lasso ON, or not exactly one node selected
      if (lassoMode || sel.length !== 1) {
        setSelectedId(null);
        return;
      }

      const n = sel[0];
      const kind = n?.data?.kind as NodeKind | undefined;

      // also hide menu for Graph nodes (so you can resize/drag without menu)
      setSelectedId(kind === 'Graph' ? null : n.id);
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
    (patch: Partial<NodeData>) => {
      if (!selectedId) return;
      setNodes((nds) =>
        applyConstraints(
          nds.map((n) =>
            n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n
          )
        )
      );
    },
    [selectedId, setNodes]
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedId && e.target !== selectedId)
    );
    setSelectedId(null);
  }, [selectedId, setNodes, setEdges]);

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
    setCursorPoint({
      x: dragStartPoint.x + e.delta.x,
      y: dragStartPoint.y + e.delta.y,
    });
  };

  const handleDragCancel = (_e: DragCancelEvent) => {
    setIsDraggingFromPalette(false);
    setDragPreview(null);
    setDragStartPoint(null);
    setCursorPoint(null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setIsDraggingFromPalette(false);
    const payload = e.active.data.current as DragData | undefined;
    setDragPreview(null);

    if (!payload || !rf || !wrapperRef.current) return;

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
        graphType: 'Line', // sensible default; pick any GraphType you prefer
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
    const text = await file.text();
    const data = JSON.parse(text) as SaveFile;
    if (!('version' in data)) {
      alert('Invalid file');
      return;
    }
    loadSave(data);
  };

  // inside Editor component
  const openSaveModal = useCallback(() => {
    const defaultBase = 'dashboard-designer';

    openModal({
      title: 'Save',
      node: (
        <SavePopup
          initialName={defaultBase}
          onCancel={closeModal}
          onConfirm={(finalFilename) => {
            downloadJSON(buildSave(), finalFilename);
            closeModal();
          }}
        />
      ),
    });
  }, [buildSave, downloadJSON, openModal, closeModal]);

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

  // Editor.tsx
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

  useEffect(() => {
    function onOpenTooltips(e: Event) {
      const ce = e as CustomEvent<{ nodeId: string }>;
      const nodeId = ce.detail?.nodeId;
      if (!nodeId) return;

      // find the node that asked for the tooltip modal
      const n = nodes.find((x) => x.id === nodeId);

      // normalize its data list to DataItem[]
      const availableData = ((n?.data as any)?.data ?? []).map((v: any) =>
        typeof v === 'string' ? { name: v, dtype: 'Other' } : v
      );

      // gather all tooltip nodes in the graph
      const availableTooltips: ExistingTooltip[] = nodes
        .filter((x) => x.data?.kind === 'Tooltip')
        .map((t) => ({
          id: t.id,
          title: (t.data as any)?.title ?? '',
          badge: (t.data as any)?.badge ?? '',
        }));

      openModal({
        title: 'Tooltip menu',
        node: (
          <TooltipPopup
            availableData={availableData}
            availableTooltips={availableTooltips}
            onCancel={closeModal}
            // To be done later on, when i finish the essentials
            // onSave={(payload) => { /* wire up later if needed */ closeModal(); }}
          />
        ),
      });
    }

    const handler = onOpenTooltips as EventListener;
    window.addEventListener('designer:open-tooltips', handler);
    return () => window.removeEventListener('designer:open-tooltips', handler);
  }, [nodes, openModal, closeModal]);

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
          style={{ flex: 1, minWidth: 0 }}
        >
          <ReactFlow
            minZoom={0.1}
            maxZoom={2}
            selectionOnDrag={lassoMode}
            selectionMode={SelectionMode.Partial}
            panOnDrag={!lassoMode && !isDraggingFromPalette}
            nodes={nodes}
            edges={edges}
            onNodesChange={(chs) => {
              onNodesChange(chs); // let React Flow apply the changes
              setNodes((nds) => applyConstraints(nds)); // then enforce constraints
              if (selectedId && !nodes.find((n) => n.id === selectedId))
                setSelectedId(null);
            }}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRf}
            nodeTypes={NODE_TYPES}
            onSelectionChange={handleSelectionChange}
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
        </div>
        <ComponentsMenu
          node={selectedNode}
          onChange={updateSelectedNode}
          onDelete={deleteSelectedNode}
          onOpen={(t) =>
            selectedId && setModal({ type: t, nodeId: selectedId })
          }
        />

        <DragOverlay dropAnimation={{ duration: 150 }}>
          {dragPreview ? <NodeGhost payload={dragPreview} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
