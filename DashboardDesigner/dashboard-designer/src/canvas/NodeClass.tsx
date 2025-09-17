import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { useDroppable } from '@dnd-kit/core';
import type { NodeData } from '../domain/types';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import type { DataItem } from '../domain/types';

const MIN_SIZE: Record<NodeData['kind'], { w: number; h: number }> = {
  Dashboard: { w: 320, h: 180 },
  Visualization: { w: 240, h: 140 },
  Legend: { w: 200, h: 130 },
  Tooltip: { w: 200, h: 130 },
  Button: { w: 160, h: 90 },
  Filter: { w: 200, h: 130 },
  Parameter: { w: 200, h: 130 },
  DataAction: { w: 160, h: 90 },
  Placeholder: { w: 140, h: 80 },
};

function DataPills({
  items,
  onClick,
}: {
  items: (string | DataItem)[];
  onClick?: (index: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center', // ← center per row
        alignItems: 'center',
        gap: 8,
        width: '100%', // ← use full width to center properly
      }}
    >
      {items.map((it, i) => {
        const label = typeof it === 'string' ? it : it.name;
        const title = typeof it === 'string' ? it : `${it.name} · ${it.dtype}`;
        return (
          <button
            key={`${label}-${i}`}
            title={title}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onClick?.(i)}
            className="nodrag nopan"
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: '#f8fafc',
              fontWeight: 700,
              fontSize: 12,
              cursor: onClick ? 'pointer' : 'default',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function NodeClass({ id, data, selected }: NodeProps<NodeData>) {
  const isContainer =
    data.kind === 'Dashboard' || data.kind === 'Visualization';
  const { setNodeRef, isOver } = useDroppable({ id });

  const minW = MIN_SIZE[data.kind].w;
  const minH = MIN_SIZE[data.kind].h;

  // choose footer items for kinds that support `data`
  const footerItems: (string | DataItem)[] | undefined =
    data.kind === 'Visualization' ||
    data.kind === 'Legend' ||
    data.kind === 'Tooltip' ||
    data.kind === 'Filter'
      ? ((data as any).data as (string | DataItem)[] | undefined)
      : undefined;

  const hasFooter = Array.isArray(footerItems) && footerItems.length > 0;

  return (
    <div
      ref={isContainer ? setNodeRef : undefined}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'visible', // keep resizer handles visible
        minWidth: minW,
        minHeight: minH,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={minW}
        minHeight={minH}
        handleStyle={{ width: 12, height: 12, borderRadius: 4 }}
        lineStyle={{ strokeWidth: 1.5 }}
      />

      {/* INNER card: header | body | footer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          minHeight: 0,
          borderRadius: 12,
          background: '#fff',
          border: `2px solid ${
            isOver ? '#38bdf8' : selected ? '#60a5fa' : '#e5e7eb'
          }`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden', // clip inside rounded card
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {data.badge && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                padding: '0 4px',
                borderRadius: 3,
                background: '#fde047',
                fontWeight: 800,
                fontSize: 11,
                lineHeight: '18px',
              }}
              title={data.badge}
            >
              {data.badge}
            </span>
          )}
          <div>
            <div style={{ fontWeight: 700 }}>{data.title}</div>
            {/* <div style={{ fontSize: 12, opacity: 0.65 }}>{data.kind}</div> */}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            minHeight: 0, // allow grid-child to shrink
            display: 'flex',
            alignItems: data.kind === 'Parameter' ? 'center' : 'stretch',
            justifyContent: 'center',
            padding: 10,
          }}
        >
          {data.kind === 'Parameter' ? (
            <select
              className="nodrag nopan"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 260,
                boxSizing: 'border-box',
                padding: '6px 8px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Select an item
              </option>
              {(data as any).options?.map((o: string, i: number) => (
                <option key={`${o}-${i}`} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {/* Footer */}
        {hasFooter ? (
          <div
            style={{
              padding: 10,
              borderTop: '1px solid #eef2f7',
              background: '#f6f7fb',
              boxSizing: 'border-box',
            }}
          >
            <DataPills
              items={footerItems!}
              // onClick={(idx) => { /* later: open Data inspector for this item */ }}
            />
          </div>
        ) : (
          // if no footer content, collapse the last grid row
          <div style={{ height: 0 }} />
        )}
      </div>

      {/* RF handles */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
