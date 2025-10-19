import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { useDroppable } from '@dnd-kit/core';
import type { NodeData } from '../domain/types';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import type { DataItem } from '../domain/types';
import { KIND_STYLES } from './kinds/styles';
import { VISUAL_VAR_ICONS, GRAPH_TYPE_ICONS } from '../domain/icons';
import type { VisualVariable, GraphType } from '../domain/types';

const MIN_SIZE = {
  Dashboard: { w: 260, h: 200 },
  Visualization: { w: 260, h: 200 },
  Tooltip: { w: 250, h: 180 },
  Legend: { w: 170, h: 75 },
  Button: { w: 140, h: 75 },
  Filter: { w: 170, h: 75 },
  Parameter: { w: 170, h: 75 },
  DataAction: { w: 140, h: 75 },
  Placeholder: { w: 130, h: 40 },
  Graph: { w: 60, h: 40 },
};

const dataLabel = (v: string | DataItem) =>
  typeof v === 'string' ? v : v.name;

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
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        width: '100%',
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
              borderRadius: 5,
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

// function to print all the data attrributes in a single box
function SingleDataBox({
  items,
  compact = false,
}: {
  items?: (string | DataItem)[];
  compact?: boolean;
}) {
  const text = (items ?? []).map(dataLabel).join(', ');
  if (!text) return null;

  return (
    <div
      style={{
        display: 'inline-block',
        width: 'auto',
        maxWidth: '90%',
        minWidth: compact ? 40 : 60,
        boxSizing: 'border-box',
        padding: compact ? '1px 3px' : '4px 5px',
        border: '1px solid #e5e7eb',
        borderRadius: 5,
        background: '#f8fafc',
        fontWeight: 700,
        textAlign: 'center',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        lineHeight: compact ? 1.05 : 1.2, // avoid clipped glyphs
        fontSize: compact ? 11 : 12,
      }}
    >
      {text}
    </div>
  );
}

// Node view — all kinds can accept children (droppable)
export default function NodeClass({ id, data, selected }: NodeProps<NodeData>) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const minW = MIN_SIZE[data.kind].w;
  const minH = MIN_SIZE[data.kind].h;

  // nodes that have data attributes
  const footerItems: (string | DataItem)[] | undefined =
    data.kind === 'Visualization' ||
    data.kind === 'Legend' ||
    data.kind === 'Tooltip' ||
    data.kind === 'Filter'
      ? ((data as any).data as (string | DataItem)[] | undefined)
      : undefined;

  const hasFooter = Array.isArray(footerItems) && footerItems.length > 0;

  const isGraph = data.kind === 'Graph';

  return (
    <div
      ref={setNodeRef}
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
      {/* Resize handles */}
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
          gridTemplateRows: isGraph ? '1fr' : 'auto minmax(0, 1fr) auto',
          minHeight: 0,
          borderRadius: 12,
          background: '#fff',
          border: `2px solid ${
            isOver ? '#38bdf8' : selected ? '#60a5fa' : 'transparent'
          }`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          ...(KIND_STYLES[data.kind]?.card || {}),
        }}
      >
        {/* Header (hidden for Graph) */}
        {!isGraph && (
          <div
            style={{
              padding: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
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
            </div>

            {/* right-side icons (keep for non-Graph) */}
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {Array.isArray((data as any).visualVars) &&
                (data as any).visualVars.map((vv: VisualVariable) => (
                  <img
                    key={vv}
                    src={VISUAL_VAR_ICONS[vv]}
                    alt={vv}
                    title={vv}
                    style={{
                      width: 30,
                      height: 25,
                      objectFit: 'contain',
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 1)',
                      border: '1px solid #e5e7eb',
                    }}
                    draggable={false}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div
          style={{
            minHeight: 0,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            padding: isGraph ? 0 : 10,
            position: 'relative',
          }}
        >
          {isGraph ? (
            <div style={{ position: 'absolute', inset: 0 }}>
              {(data as any).graphType ? (
                <img
                  src={GRAPH_TYPE_ICONS[(data as any).graphType as GraphType]}
                  alt={(data as any).graphType}
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!isGraph &&
          (hasFooter ? (
            <div
              style={{
                margin: '1px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <DataPills items={footerItems!} />
            </div>
          ) : (
            <div style={{ height: 0 }} />
          ))}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
