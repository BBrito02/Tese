import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from 'reactflow';
import { useEffect, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

import type { NodeData, DataItem, VisualVariable } from '../../domain/types';
import { VISUAL_VAR_ICONS } from '../../domain/icons';

import ClickHoverPorts from '../nodes/ClickHoverPorts'; // adjust the path if needed

// Per-kind minimums (match your previous sizes)
const MIN_SIZE: Record<string, { w: number; h: number }> = {
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

export type BaseNodeShellProps = NodeProps<NodeData> & {
  // renderables
  body?: React.ReactNode;
  footerItems?: (string | DataItem)[];
  visualVars?: VisualVariable[];
  tooltipCount?: number;

  // style overrides
  cardStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  footerStyle?: React.CSSProperties;

  // layout toggles
  hideHeader?: boolean;
  hideFooter?: boolean;
  isParameter?: boolean;
  leftHandle?: boolean;
  rightHandle?: boolean;

  // border/highlight behavior
  highlightBorder?: boolean; // default true
  borderWidth?: number; // default 2
};

// helper to remove border-related props to avoid mixing shorthand/longhand
function stripBorderStyles(
  s?: React.CSSProperties
): React.CSSProperties | undefined {
  if (!s) return s;
  const {
    border,
    borderStyle,
    borderWidth,
    borderColor,
    borderTop,
    borderRight,
    borderBottom,
    borderLeft,
    borderTopStyle,
    borderRightStyle,
    borderBottomStyle,
    borderLeftStyle,
    borderTopWidth,
    borderRightWidth,
    borderBottomWidth,
    borderLeftWidth,
    borderTopColor,
    borderRightColor,
    borderBottomColor,
    borderLeftColor,
    ...rest
  } = s;
  return rest;
}

export default function BaseNodeShell({
  id,
  data,
  selected,
  body,
  footerItems,
  visualVars,
  tooltipCount = 0,

  cardStyle,
  headerStyle,
  bodyStyle,
  footerStyle,

  hideHeader = false,
  hideFooter = false,
  isParameter = false,
  leftHandle = true,
  rightHandle = true,

  highlightBorder = true,
  borderWidth = 2,
}: BaseNodeShellProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const { setNodeRef, isOver } = useDroppable({ id });

  const minW = MIN_SIZE[data.kind]?.w ?? 180;
  const minH = MIN_SIZE[data.kind]?.h ?? 100;

  // Build pill handle ids so RF recomputes anchors when list changes
  const pillHandleIds = useMemo(
    () =>
      (footerItems ?? []).map((it) => {
        const label = typeof it === 'string' ? it : it.name;
        const slug = label
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9_-]/g, '');
        return `data:${slug}`;
      }),
    [footerItems]
  );

  useEffect(() => {
    const t = setTimeout(() => updateNodeInternals(id), 0);
    return () => clearTimeout(t);
  }, [id, updateNodeInternals, pillHandleIds.join('|')]);

  const hasFooter = Array.isArray(footerItems) && footerItems.length > 0;

  // compute border color based on state, but allow disabling highlight
  const dynamicBorderColor = isOver
    ? '#38bdf8'
    : selected
    ? '#60a5fa'
    : 'transparent';

  const borderColor = highlightBorder ? dynamicBorderColor : '#e5e7eb';

  // sanitize incoming styles to avoid mixing border props
  const cardStyleClean = stripBorderStyles(cardStyle) || {};

  function DataPills({
    items,
    onClick,
  }: {
    items: (string | DataItem)[];
    onClick?: (index: number) => void;
  }) {
    const slug = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '');

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
          const title =
            typeof it === 'string' ? it : `${it.name} · ${it.dtype}`;
          const handleId = `data:${slug(label)}`;

          return (
            <div
              key={`${label}-${i}`}
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <button
                title={title}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onClick?.(i)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 5,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: '#e5e7eb',
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

              {/* two action-specific handles under the pill */}
              <Handle
                id={`${handleId}:click`}
                type="source"
                position={Position.Bottom}
                className="nodrag nopan"
                style={{
                  position: 'absolute',
                  left: '30%',
                  bottom: -3,
                  transform: 'translateX(-50%)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: '#222',
                  background: '#111',
                }}
              />
              <Handle
                id={`${handleId}:hover`}
                type="source"
                position={Position.Bottom}
                className="nodrag nopan"
                style={{
                  position: 'absolute',
                  left: '70%',
                  bottom: -3,
                  transform: 'translateX(-50%)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: '#222',
                  background: '#111',
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

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
      <NodeResizer
        isVisible={selected}
        minWidth={minW}
        minHeight={minH}
        handleStyle={{ width: 12, height: 12, borderRadius: 4 }}
        lineStyle={{ strokeWidth: 1.5 }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateRows: hideHeader ? '1fr' : 'auto minmax(0, 1fr) auto',
          minHeight: 0,
          borderRadius: 12,
          background: '#fff',
          // Use only longhand border props
          borderWidth,
          borderStyle: 'solid',
          borderColor,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          ...cardStyleClean,
        }}
      >
        {!hideHeader && (
          <div
            style={{
              padding: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              position: 'relative',
              ...headerStyle,
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

            {/* right side: visual variables + tooltip counter */}
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {Array.isArray(visualVars) &&
                visualVars.map((vv, i) => (
                  <button
                    key={`${vv}-${i}`}
                    className="nodrag nopan"
                    title={`${vv} — click to manage`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(
                        new CustomEvent('designer:open-visualvars', {
                          detail: { nodeId: id },
                        })
                      );
                    }}
                    style={{
                      width: 24,
                      height: 24,
                      padding: 0,
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#fff',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: '#e5e7eb',
                      boxShadow: '0 1px 3px rgba(0,0,0,.15)',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={VISUAL_VAR_ICONS[vv]}
                      alt=""
                      draggable={false}
                      style={{ width: 16, height: 16, objectFit: 'contain' }}
                    />
                  </button>
                ))}

              {tooltipCount > 0 && (
                <span
                  title={`${tooltipCount} tooltip${
                    tooltipCount === 1 ? '' : 's'
                  }`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 22,
                    minWidth: 22,
                    padding: '0 6px',
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 11,
                    background: '#e2e8f0',
                    color: '#0f172a',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: '#cbd5e1',
                  }}
                >
                  T({tooltipCount})
                </span>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            minHeight: 0,
            display: 'flex',
            alignItems: isParameter ? 'center' : 'stretch',
            justifyContent: 'center',
            padding: 10,
            ...bodyStyle,
          }}
        >
          {body}
        </div>

        {!hideHeader &&
          !hideFooter &&
          (hasFooter ? (
            <div
              style={{
                margin: '1px',
                display: 'flex',
                justifyContent: 'center',
                ...footerStyle,
              }}
            >
              <DataPills items={footerItems!} />
            </div>
          ) : (
            <div style={{ height: 0 }} />
          ))}
      </div>

      {leftHandle && <Handle type="target" position={Position.Left} />}
      {rightHandle && (
        <ClickHoverPorts position={Position.Right} idPrefix="act" />
      )}
    </div>
  );
}
