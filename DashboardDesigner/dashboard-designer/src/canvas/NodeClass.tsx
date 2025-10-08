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
  Visualization: { w: 200, h: 110 },
  Tooltip: { w: 170, h: 110 },
  Legend: { w: 170, h: 75 },
  Button: { w: 140, h: 75 },
  Filter: { w: 170, h: 75 },
  Parameter: { w: 170, h: 75 },
  DataAction: { w: 140, h: 75 },
  Placeholder: { w: 130, h: 40 },
};

const COMPACT_FOOTER_KINDS = new Set<NodeData['kind']>([
  'Filter',
  'Button',
  'Legend',
]);

const dataLabel = (v: string | DataItem) =>
  typeof v === 'string' ? v : v.name;

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
        minWidth: compact ? 100 : 120, // smaller when compact
        boxSizing: 'border-box',
        padding: compact ? '6px 8px' : '10px 12px',
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

      {/* Card: header | body | footer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
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
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {/* Styling for the grph type */}
            {(data as any).graphType && (
              <img
                src={GRAPH_TYPE_ICONS[(data as any).graphType as GraphType]}
                alt={(data as any).graphType}
                title={(data as any).graphType}
                style={{
                  width: 20,
                  height: 20,
                  objectFit: 'contain',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid #e5e7eb',
                }}
                draggable={false}
              />
            )}
            {/* Styling for the visual attributes */}
            {Array.isArray((data as any).visualVars) &&
              (data as any).visualVars.map((vv: VisualVariable) => (
                <img
                  key={vv}
                  src={VISUAL_VAR_ICONS[vv]}
                  alt={vv}
                  title={vv}
                  style={{
                    width: 25,
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

        {/* Body */}
        <div
          style={{
            minHeight: 0,
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
            style={{ margin: '3px', display: 'flex', justifyContent: 'center' }}
          >
            <SingleDataBox
              items={footerItems}
              compact={COMPACT_FOOTER_KINDS.has(data.kind)}
            />
          </div>
        ) : (
          <div style={{ height: 0 }} />
        )}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
