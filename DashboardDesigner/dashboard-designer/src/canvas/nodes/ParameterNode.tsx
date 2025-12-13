import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

const ParameterNode = (p: NodeProps<NodeData>) => {
  const d = p.data as any;
  const opts: string[] = d?.options ?? [];

  const perspectiveCount = Array.isArray(d.perspectives)
    ? (d.perspectives as string[]).length
    : 0;

  // Compact styling for the dropdown to fit in the min-size node
  const selectStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '2px 4px', // Compact padding
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 11, // Smaller font size
    height: 24, // Fixed small height
    lineHeight: '20px',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <BaseNodeShell
      {...p}
      isParameter // Critical: Tells BaseNodeShell to allow overflow for the dropdown
      cardStyle={{ background: '#E6E6E6', borderRadius: 10 }}
      perspectiveCount={perspectiveCount}
      reviewMode={d.reviewMode ?? false}
      reviewCount={d.reviewTotal ?? 0}
      reviewUnresolvedCount={d.reviewUnresolved ?? 0}
      // UPDATED: Align items center for vertical centering
      bodyStyle={{ padding: '0 8px 8px 8px', alignItems: 'center' }}
      body={
        // UPDATED: Removed marginTop to ensure true centering
        <div style={{ width: '100%' }}>
          <select
            className="nodrag nopan"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            defaultValue=""
            style={selectStyle}
          >
            <option value="" disabled>
              Select...
            </option>
            {opts.map((o: string, i: number) => (
              <option key={`${o}-${i}`} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      }
    />
  );
};

export default memo(ParameterNode);
