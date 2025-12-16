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

  // Compact styling for the dropdown
  const selectStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '2px 4px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 11,
    height: 24,
    lineHeight: '20px',
    cursor: 'pointer',
    outline: 'none',
  };

  // --- Handle Value Change ---
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    // Dispatch event to global listener
    window.dispatchEvent(
      new CustomEvent('designer:parameter-value-change', {
        detail: { nodeId: p.id, value: val },
      })
    );
  };

  return (
    <BaseNodeShell
      {...p}
      isParameter
      cardStyle={{ background: '#E6E6E6', borderRadius: 10 }}
      perspectiveCount={perspectiveCount}
      reviewMode={d.reviewMode ?? false}
      reviewCount={d.reviewTotal ?? 0}
      reviewUnresolvedCount={d.reviewUnresolved ?? 0}
      bodyStyle={{ padding: '0 8px 8px 8px', alignItems: 'center' }}
      body={
        <div style={{ width: '100%' }}>
          <select
            className="nodrag nopan"
            // --- UPDATED: Select node on click, while preventing drag ---
            onPointerDown={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent('designer:select-node', {
                  detail: { nodeId: p.id },
                })
              );
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            defaultValue=""
            onChange={handleChange}
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
