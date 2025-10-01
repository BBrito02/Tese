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
import type { NodeData, NodeKind } from './domain/types';
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

  const menuActive = Boolean(selectedId) || menuExiting;
  const buttonsOffset = menuActive
    ? -(PANEL_WIDTH + PANEL_MARGIN + PANEL_GAP)
    : 0;

  // React Flow will call this whenever selection changes
  const handleSelectionChange = useCallback(
    ({ nodes: sel }: { nodes: RFNode<NodeData>[]; edges: any[] }) => {
      const id = sel[0]?.id ?? null;
      setSelectedId(id);
    },
    []
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

    const data: NodeData = {
      kind: payload.kind,
      title: payload.title ?? payload.kind,
    };

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

  const CONTENT_PAD = 16; // inner padding on all sides
  const HEADER_H = 30; // approximate header (badge+title) height inside the card
  const GRID_GAP = 16; // spacing when auto-laying out children

  function isContainerKind(k: NodeKind | undefined) {
    return k === 'Dashboard' || k === 'Visualization';
  }

  type Size = { w: number; h: number };
  function getNodeSize(n: Node): Size {
    const w = (n as any).width ?? (n.style as any)?.width ?? 180; // fallback
    const h = (n as any).height ?? (n.style as any)?.height ?? 100; // fallback
    return { w: Number(w) || 0, h: Number(h) || 0 };
  }

  function applyConstraints(input: Node[]): Node[] {
    // Build quick index
    let changed = false;
    const out = input.map((n) => ({ ...n })); // shallow clones

    // Helper to update a node in out array by id
    const touch = (id: string, patch: Partial<Node>) => {
      const i = out.findIndex((x) => x.id === id);
      if (i >= 0) {
        out[i] = { ...out[i], ...patch };
        changed = true;
      }
    };

    // For each container, clamp its children and compute required min size
    for (const parent of out) {
      if (!isContainerKind(parent.data?.kind as NodeKind)) continue;

      const { w: pW, h: pH } = getNodeSize(parent);
      const innerLeft = CONTENT_PAD;
      const innerTop = HEADER_H + CONTENT_PAD;
      const innerRight = pW - CONTENT_PAD;
      const innerBottom = pH - CONTENT_PAD;

      let requiredRight = innerLeft; // track how far children extend
      let requiredBottom = innerTop;

      // Clamp each child inside content rect
      for (const child of out) {
        if (child.parentNode !== parent.id) continue;

        const { w: cW, h: cH } = getNodeSize(child);

        // desired bounds for child inside content
        const minX = innerLeft;
        const minY = innerTop;
        const maxX = Math.max(innerLeft, innerRight - cW);
        const maxY = Math.max(innerTop, innerBottom - cH);

        const clampedX = Math.min(Math.max(child.position.x, minX), maxX);
        const clampedY = Math.min(Math.max(child.position.y, minY), maxY);

        if (clampedX !== child.position.x || clampedY !== child.position.y) {
          touch(child.id, { position: { x: clampedX, y: clampedY } });
        }

        // how much space do we need to contain this child?
        requiredRight = Math.max(requiredRight, clampedX + cW);
        requiredBottom = Math.max(requiredBottom, clampedY + cH);
      }

      // Compute required parent size from children extents + padding
      const needW = Math.max(pW, requiredRight + CONTENT_PAD);
      const needH = Math.max(pH, requiredBottom + CONTENT_PAD);

      // Also respect some base minimums so dashboards can't be tiny
      const baseMinW = parent.data?.kind === 'Dashboard' ? 320 : 240;
      const baseMinH = parent.data?.kind === 'Dashboard' ? 180 : 140;

      const targetW = Math.max(needW, baseMinW);
      const targetH = Math.max(needH, baseMinH);

      // If the parent is smaller than required, expand it
      if (targetW !== pW || targetH !== pH) {
        const style = {
          ...(parent.style || {}),
          width: targetW,
          height: targetH,
        };
        touch(parent.id, { style });
      }
    }

    return changed ? out : input; // don't trigger extra renders if nothing changed
  }

  const createChildInParent = useCallback(
    (
      parentId: string,
      payload: { kind: NodeKind; title: string; description?: string }
    ) => {
      setNodes((nds) => {
        const parent = nds.find((n) => n.id === parentId);
        if (!parent) return nds;

        const { w: pW, h: pH } = getNodeSize(parent);
        const innerLeft = CONTENT_PAD;
        const innerTop = HEADER_H + CONTENT_PAD;
        const innerRight = pW - CONTENT_PAD;
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
          return { width: 180, height: 100 };
        };
        const size = defaultSizeFor(payload.kind);

        // how many columns fit?
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

        const data: NodeData = {
          kind: payload.kind,
          title: payload.title || payload.kind,
          description: payload.description,
          badge: nextBadgeFor(payload.kind, nds),
        };

        return nds.concat({
          id: nanoid(),
          type: 'class',
          position: { x, y }, // relative to parent top-left
          parentNode: parentId,
          extent: 'parent',
          data,
          style: size,
        });
      });

      // after adding, stabilize to enforce all constraints
      setNodes((nds) => applyConstraints(nds));
    },
    [setNodes]
  );

  useEffect(() => {
    function onAddComponent(
      e: CustomEvent<{
        parentId: string;
        payload: { kind: NodeKind; title: string; description?: string };
      }>
    ) {
      const { parentId, payload } = e.detail || ({} as any);
      if (!parentId || !payload) return;
      createChildInParent(parentId, payload); // your existing helper
    }

    // TS helper to type the handler properly
    const handler = onAddComponent as EventListener;

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
            // onSave={(payload) => { /* wire up later if needed */ closeModal(); }}
          />
        ),
      });
    }

    const handler = onOpenTooltips as EventListener;
    window.addEventListener('designer:open-tooltips', handler);
    return () => window.removeEventListener('designer:open-tooltips', handler);
  }, [nodes, openModal, closeModal]);

  return (
    <div
      id="editor-root"
      style={{ display: 'flex', height: '100vh', backgroundColor: '#aedbe6ff' }}
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
            onClick={() => downloadJSON(buildSave(), 'dashboard-designer.json')}
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

        <div className="canvas" ref={wrapperRef} style={{ flex: 1 }}>
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
