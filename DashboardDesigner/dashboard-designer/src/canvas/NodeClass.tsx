import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { useDroppable } from '@dnd-kit/core';
import type { NodeData } from '../domain/types';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

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

export default function NodeClass({ id, data, selected }: NodeProps<NodeData>) {
  const isContainer =
    data.kind === 'Dashboard' || data.kind === 'Visualization';
  const { setNodeRef, isOver } = useDroppable({ id });

  const minW = MIN_SIZE[data.kind].w;
  const minH = MIN_SIZE[data.kind].h;

  const DadosBox = ({
    items,
    placeholder = 'Dados',
  }: {
    items?: string[];
    placeholder?: string;
  }) => (
    <div
      style={{
        width: '100%', 
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: '#fff',
        textAlign: 'center',
        fontWeight: 700,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        boxSizing: 'border-box',
      }}
      title={items?.join(', ')}
    >
      {items && items.length ? items.join(', ') : placeholder}
    </div>
  );

  const footerContent = (() => {
    switch (data.kind) {
      case 'Visualization':
        return (data as any).data?.length ? (
          <DadosBox items={(data as any).data} />
        ) : null;
      case 'Legend':
        return (data as any).data?.length ? (
          <DadosBox items={(data as any).data} />
        ) : null;
      case 'Tooltip':
        return (data as any).data?.length ? (
          <DadosBox items={(data as any).data} />
        ) : null;
      case 'Filter':
        return (data as any).data?.length ? (
          <DadosBox items={(data as any).data} />
        ) : null;
      case 'Dashboard':
      default:
        return null;
    }
  })();

  return (
    <div
      ref={isContainer ? setNodeRef : undefined}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'visible',
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

      {/* INNER card: constrained grid so footer never escapes */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto', // header | body | footer
          minHeight: 0, // allow grid to shrink
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

        {/* Body (center) */}
        <div
          style={{
            minHeight: 0, // critical in grid to prevent overflow
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

        {/* Footer (only if there is content) */}
        {footerContent ? (
          <div
            style={{
              padding: 10,
              borderTop: '1px solid #eef2f7',
              background: '#f6f7fb',
              boxSizing: 'border-box',
            }}
          >
            {footerContent}
          </div>
        ) : (
          // if no footer, keep the last grid row at 0 to avoid extra space
          <div style={{ height: 0 }} />
        )}
      </div>

      {/* RF handles */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
