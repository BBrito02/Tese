import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';
import { memo } from 'react';

const ParameterNode = (p: NodeProps<NodeData>) => {
  const opts: string[] = (p.data as any)?.options ?? [];
  const d = p.data as any;
  return (
    <BaseNodeShell
      {...p}
      isParameter
      cardStyle={{ background: '#E6E6E6', borderRadius: 14 }}
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
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
};

export default memo(ParameterNode);
