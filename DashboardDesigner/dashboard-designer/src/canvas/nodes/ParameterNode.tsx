import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function ParameterNode(p: NodeProps<NodeData>) {
  const opts: string[] = (p.data as any)?.options ?? [];
  return (
    <BaseNodeShell
      {...p}
      isParameter
      cardStyle={{ background: '#E6E6E6', borderRadius: 14 }}
      body={
        <select
          className="nodrag nopan"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          defaultValue=""
          style={{
            width: '100%',
            maxWidth: 260,
            boxSizing: 'border-box',
            padding: '6px 8px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
          }}
        >
          <option value="" disabled>
            Select an item
          </option>
          {opts.map((o, i) => (
            <option key={`${o}-${i}`} value={o}>
              {o}
            </option>
          ))}
        </select>
      }
    />
  );
}
