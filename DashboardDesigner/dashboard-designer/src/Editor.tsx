import { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import type { ReactFlowInstance, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';
import NodeClass from './canvas/NodeClass';
import type { NodeData, NodeKind } from './domain/types';
import { canConnect } from './domain/rules';
import SideMenu from './components/SideMenu';

type DragData = { kind: NodeKind; title?: string };

const NODE_TYPES = { class: NodeClass };

export default function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const onDragOver = (ev: React.DragEvent) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    if (!rf || !wrapperRef.current) return;

    const bounds = wrapperRef.current.getBoundingClientRect();
    const pos = rf.project({
      x: ev.clientX - bounds.left,
      y: ev.clientY - bounds.top,
    });

    const dataStr = ev.dataTransfer.getData('application/reactflow');
    if (!dataStr) return;
    const payload = JSON.parse(dataStr) as DragData;

    const data: NodeData = {
      kind: payload.kind,
      title: payload.title ?? payload.kind,
    };

    setNodes((nds) =>
      nds.concat({
        id: nanoid(),
        type: 'class',
        position: pos,
        data,
      })
    );
  };

  return (
    <div id="editor-root" style={{ display: 'flex', height: '100vh' }}>
      <SideMenu></SideMenu>
      <div className="canvas" ref={wrapperRef} style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRf}
          nodeTypes={NODE_TYPES}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
