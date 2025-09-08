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
} from '@dnd-kit/core';
import NodeGhost from './components/NodeGhost';

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

  // React Flow will call this whenever selection changes
  const handleSelectionChange = useCallback(
    ({ nodes: selNodes }: { nodes: RFNode<NodeData>[]; edges: any[] }) => {
      setSelectedId(selNodes[0]?.id ?? null);
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

  const handleDragStart = (e: DragStartEvent) => {
    setIsDraggingFromPalette(true);
    setDragPreview((e.active.data.current as DragData) ?? null);
  };

  const handleDragCancel = (_e: DragCancelEvent) => {
    setIsDraggingFromPalette(false);
    setDragPreview(null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setIsDraggingFromPalette(false);
    const payload = e.active.data.current as DragData | undefined;
    setDragPreview(null);

    if (!payload || !rf || !wrapperRef.current) return;

    const center = getDragCenter(e);
    if (!center) return;

    // viewport -> flow coords
    const bounds = wrapperRef.current.getBoundingClientRect();
    const flowPos = rf.project({
      x: center.x - bounds.left,
      y: center.y - bounds.top,
    });

    // If you later add container droppables (NodeClass already registers for containers),
    // you can use e.over?.id to detect the parent and set parentNode/extent here.

    const data: NodeData = {
      kind: payload.kind,
      title: payload.title ?? payload.kind,
    };

    const defaultSizeFor = (kind: NodeKind) => {
      //aqui tenho de ver depois os sizes para o resto
      if (kind === 'Dashboard') return { width: 700, height: 380 };
      if (kind === 'Visualization') return { width: 320, height: 200 };
      return { width: 180, height: 100 }; // Legend, Tooltip, Button, etc.
    };

    setNodes((nds) =>
      nds.concat({
        id: nanoid(),
        type: 'class',
        position: flowPos,
        data,
        style: defaultSizeFor(data.kind),
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
