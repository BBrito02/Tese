import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { useDroppable } from '@dnd-kit/core';
import type { NodeData } from '../domain/types';

export default function NodeClass({ id, data, selected }: NodeProps<NodeData>) {
  const isContainer =
    data.kind === 'Dashboard' || data.kind === 'Visualization';

  // Register this node as a droppable target (so dnd-kit gives us `event.over.id === nodeId`)
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={isContainer ? setNodeRef : undefined}
      style={{
        width: isContainer ? 920 : undefined,
        height: isContainer ? 480 : undefined,
        padding: isContainer ? 12 : 10,
        borderRadius: 12,
        background: '#fff',
        border: `2px solid ${
          isOver ? '#38bdf8' : selected ? '#60a5fa' : '#e5e7eb'
        }`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        overflow: isContainer ? 'hidden' : 'visible',
        minWidth: isContainer ? undefined : 180,
      }}
    >
      <div style={{ fontWeight: 700 }}>{data.title || data.kind}</div>
      <div style={{ fontSize: 12, opacity: 0.65 }}>{data.kind}</div>

      {/* Basic handles */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
