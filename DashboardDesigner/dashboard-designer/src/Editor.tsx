import { useCallback, useMemo, useRef, useState } from 'react';
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
import type { NodeData, NodeKind } from './domain/types';
import { canConnect } from './domain/rules';
import SideMenu from './components/SideMenu';
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

type DragData = { kind: NodeKind; title?: string };

const NODE_TYPES = { class: NodeClass };

/** Safe helper: compute drag center (translated OR initial+delta) */
function getDragCenter(e: DragEndEvent): { x: number; y: number } | null {
  const { current } = e.active.rect;
  if (current.translated) {
    const { left, top, width, height } = current.translated;
    return { x: left + width / 2, y: top + height / 2 };
  }
  if (current.initial) {
    const { left, top, width, height } = current.initial;
    return { x: left + e.delta.x + width / 2, y: top + e.delta.y + height / 2 };
  }
  return null;
}

export default function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // --- track current selection ---
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId),
    [nodes, selectedId]
  );

  const centerNode = useCallback(
    (id: string) => {
      if (!rf) return;
      const n = rf.getNode(id);
      if (!n) return;

      const ax = n.positionAbsolute?.x ?? n.position.x;
      const ay = n.positionAbsolute?.y ?? n.position.y;

      // use measured size if available, else measure DOM and convert by zoom
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
      setSelectedId(id); // <-- keep this for ComponentsMenu
      if (id) requestAnimationFrame(() => centerNode(id));
    },
    [centerNode] // <-- capture latest rf via centerNode
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

  // Update node data from the inspector
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

  // dnd-kit sensors & overlay
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
    // mouse/pointer
    if ('clientX' in ev && 'clientY' in ev) {
      const e = ev as unknown as { clientX: number; clientY: number };
      return { x: e.clientX, y: e.clientY };
    }
    // touch
    if ('touches' in ev && (ev as TouchEvent).touches[0]) {
      const t = (ev as TouchEvent).touches[0];
      return { x: t.clientX, y: t.clientY };
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

    // use tracked cursor; if missing, fall back to element-center computation
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

    // center the node at the cursor
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

        <div className="canvas" ref={wrapperRef} style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(chs) => {
              onNodesChange(chs);
              // keep selectedId in sync if node gets removed externally
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
        />

        {/* Live preview while dragging from the palette */}
        <DragOverlay dropAnimation={{ duration: 150 }}>
          {dragPreview ? <NodeGhost payload={dragPreview} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
