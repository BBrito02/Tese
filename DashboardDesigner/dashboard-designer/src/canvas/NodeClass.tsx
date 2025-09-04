import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { useDroppable } from '@dnd-kit/core';
import type { NodeData } from '../domain/types';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

export default function NodeClass({ id, data, selected }: NodeProps<NodeData>) {
  const isContainer =
    data.kind === 'Dashboard' || data.kind === 'Visualization';

  // Register this node as a droppable target (so dnd-kit gives us `event.over.id === nodeId`)
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={isContainer ? setNodeRef : undefined}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        boxSizing: 'border-box',
        borderRadius: 12,
        background: '#fff',
        border: `2px solid ${
          isOver ? '#38bdf8' : selected ? '#60a5fa' : '#e5e7eb'
        }`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'visible',
        minWidth: isContainer ? 260 : 160,
        minHeight: isContainer ? 120 : 60,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={isContainer ? 260 : 160}
        minHeight={isContainer ? 120 : 60}
        handleStyle={{ width: 16, height: 16, borderRadius: 8 }}
        lineStyle={{ strokeWidth: 1.5 }}
      />
      <div style={{ padding: 10 }}>
        <div style={{ fontWeight: 700 }}>{data.title || data.kind}</div>
        <div style={{ fontSize: 12, opacity: 0.65 }}>{data.kind}</div>
      </div>

      <div style={{ flex: 1 }} />
      {/* Basic handles */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
