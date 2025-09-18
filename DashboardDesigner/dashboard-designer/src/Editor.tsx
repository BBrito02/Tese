import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import type { ReactFlowInstance, Connection, Node as RFNode } from 'reactflow';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';
import NodeClass from './canvas/NodeClass';
import type { DataItem, NodeData, NodeKind } from './domain/types';
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

import { FaCloudDownloadAlt, FaCloudUploadAlt } from 'react-icons/fa';

import Modal from './components/ui/Modal';
import DataPopup from './components/popups/DataPopup';
import TooltipPopup from './components/popups/TooltipPopup';

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

  type ModalSpec =
    | { type: 'data'; nodeId: string }
    | { type: 'interactions'; nodeId: string }
    | { type: 'tooltips'; nodeId: string };

  const [modal, setModal] = useState<ModalSpec | null>(null);

  // helper to patch a node by id
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

  const centerNode = useCallback(
    (id: string) => {
      if (!rf) return;
      const n = rf.getNode(id);
      if (!n) return;

      const ax = n.positionAbsolute?.x ?? n.position.x;
      const ay = n.positionAbsolute?.y ?? n.position.y;

      let w = n.width ?? 0;
      let h = n.height ?? 0;
      if (w === 0 || h === 0) {
        const el = document.querySelector<HTMLElement>(
          `.react-flow__node[data-id="${
            CSS?.escape ? CSS.escape(n.id) : n.id
          }"]`
        );
        if (el) {
          const rect = el.getBoundingClientRect();
          const zoom = rf.getZoom();
          w = rect.width / zoom;
          h = rect.height / zoom;
        }
      }

      const cx = ax + (w ? w / 2 : 0);
      const cy = ay + (h ? h / 2 : 0);
      rf.setCenter(cx, cy, { zoom: rf.getZoom(), duration: 220 });
    },
    [rf]
  );

  // React Flow will call this whenever selection changes
  const handleSelectionChange = useCallback(
    ({ nodes: sel }: { nodes: RFNode<NodeData>[]; edges: any[] }) => {
      const id = sel[0]?.id ?? null;
      setSelectedId(id);
      if (id) requestAnimationFrame(() => centerNode(id));
    },
    [centerNode]
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
        nds.map((n) =>
          n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n
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
      ...(n.extent === 'parent' ? { extent: 'parent' as const } : {}), // 👈 guard
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

  return (
    <div
      id="editor-root"
      style={{ display: 'flex', height: '100vh', backgroundColor: '#5eb5cd' }}
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
            nodes={nodes}
            edges={edges}
            onNodesChange={(chs) => {
              onNodesChange(chs);
              if (selectedId && !nodes.find((n) => n.id === selectedId))
                setSelectedId(null);
            }}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRf}
            nodeTypes={NODE_TYPES}
            panOnDrag={!isDraggingFromPalette}
            onSelectionChange={handleSelectionChange}
            fitView
          >
            <Background />
            <Controls />
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

        {modal?.type === 'data' && (
          <Modal title="Data menu" onClose={() => setModal(null)}>
            <DataPopup
              initial={
                (nodes.find((n) => n.id === modal.nodeId)?.data as any)?.data ??
                []
              }
              onCancel={() => setModal(null)}
              onSave={(items) => {
                updateNodeById(modal.nodeId, { data: items });
                setModal(null);
              }}
            />
          </Modal>
        )}

        {modal?.type === 'tooltips' && (
          <Modal title="Tooltip menu" onClose={() => setModal(null)}>
            {(() => {
              const n = nodes.find((x) => x.id === modal.nodeId);
              const available = ((n?.data as any)?.data ?? []) as Array<
                string | DataItem
              >;
              return (
                <TooltipPopup
                  availableData={available}
                  onCancel={() => setModal(null)}
                  // no onSave for now (UI-only as requested)
                />
              );
            })()}
          </Modal>
        )}

        <DragOverlay dropAnimation={{ duration: 150 }}>
          {dragPreview ? <NodeGhost payload={dragPreview} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
