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
import { supportsInteractions } from '../../domain/rules';

import type { NodeData, DataItem, VisualVariable } from '../../domain/types';
import { VISUAL_VAR_ICONS } from '../../domain/icons';

import ClickHoverPorts from '../nodes/ClickHoverPorts';

import ReviewBadge from '../../components/ui/ReviewBadge';
import { useReviews } from '../../components/ui/ReviewContext';

// Per-kind minimums
const MIN_SIZE: Record<string, { w: number; h: number }> = {
  Dashboard: { w: 260, h: 200 },
  Visualization: { w: 260, h: 100 },
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
  body?: React.ReactNode;
  footerItems?: DataItem[]; // Changed to strict DataItem[]
  visualVars?: VisualVariable[];
  tooltipCount?: number;
  perspectiveCount?: number;

  reviewMode?: boolean;
  reviewCount?: number;
  reviewUnresolvedCount?: number;

  cardStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  footerStyle?: React.CSSProperties;

  hideHeader?: boolean;
  hideFooter?: boolean;
  isParameter?: boolean;
  leftHandle?: boolean;
  rightHandle?: boolean;

  highlightBorder?: boolean;
  borderWidth?: number;

  overlayTopRight?: React.ReactNode;
};

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

function DataPills({
  items,
  onClick,
}: {
  items: DataItem[];
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
        // --- CHANGED: Use Stable ID for Handles ---
        const handleId = `data:${it.id}`;
        const label = it.name;
        const title = `${it.name} · ${it.dtype}`;

        return (
          <div
            key={it.id}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <button
              title={title}
              className="nodrag"
              onClick={(e) => {
                if (onClick) {
                  e.stopPropagation();
                  onClick(i);
                }
              }}
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

            {/* Target Handle (Top) - Connects to data:{id}:target */}
            <Handle
              id={`${handleId}:target`}
              type="target"
              position={Position.Top}
              className="nodrag nopan"
              style={{
                position: 'absolute',
                left: '50%',
                top: -3,
                transform: 'translateX(-50%)',
                width: 6,
                height: 6,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#222',
                background: '#111',
                zIndex: 10,
              }}
            />

            {/* Source Handles (Bottom) */}
            <Handle
              id={`${handleId}:click`}
              type="source"
              position={Position.Bottom}
              className="nodrag nopan"
              style={{
                position: 'absolute',
                left: '70%',
                bottom: -3,
                transform: 'translateX(-50%)',
                width: 6,
                height: 6,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#222',
                background: '#3b82f6', // Blue for click
                zIndex: 10,
              }}
            />
            <Handle
              id={`${handleId}:hover`}
              type="source"
              position={Position.Bottom}
              className="nodrag nopan"
              style={{
                position: 'absolute',
                left: '30%',
                bottom: -3,
                transform: 'translateX(-50%)',
                width: 6,
                height: 6,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#222',
                background: '#fbbf24', // Amber for hover
                zIndex: 10,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function BaseNodeShell({
  id,
  data,
  selected,
  body,
  footerItems = [],
  visualVars,
  tooltipCount = 0,
  perspectiveCount = 0,
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
  overlayTopRight,
}: BaseNodeShellProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const { setNodeRef, isOver } = useDroppable({ id });

  const minW = MIN_SIZE[data.kind]?.w ?? 180;
  const minH = MIN_SIZE[data.kind]?.h ?? 100;

  const {
    reviewMode,
    total: reviewCount,
    unresolved: reviewUnresolvedCount,
  } = useReviews(id);

  // --- Track IDs for updates ---
  const pillHandleIds = useMemo(
    () => (footerItems ?? []).map((it) => `data:${it.id}`),
    [footerItems]
  );

  useEffect(() => {
    const t = setTimeout(() => updateNodeInternals(id), 0);
    return () => clearTimeout(t);
  }, [id, updateNodeInternals, pillHandleIds.join('|')]);

  const canInteract = supportsInteractions(data.kind);

  useEffect(() => {
    const t = setTimeout(() => updateNodeInternals(id), 0);
    return () => clearTimeout(t);
  }, [id, updateNodeInternals, canInteract]);

  const hasFooter = Array.isArray(footerItems) && footerItems.length > 0;

  // --- HIGHLIGHT LOGIC ---
  const isHighlighted = !!data.highlighted;
  const isSelected = selected || isHighlighted;

  const dynamicBorderColor = isOver
    ? '#38bdf8'
    : isSelected
    ? '#3b82f6' // Match Standard Blue
    : 'transparent';

  const borderColor = highlightBorder ? dynamicBorderColor : '#e5e7eb';

  // Add Glow Effect for Highlighting
  const boxShadow = isSelected
    ? '0 0 0 2px rgba(59, 130, 246, 0.5)'
    : '0 1px 3px rgba(0,0,0,0.06)';

  const cardStyleClean = stripBorderStyles(cardStyle) || {};

  const handlePillClick = (index: number) => {
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('designer:edit-data', { detail: { nodeId: id, index } })
      );
    }, 100);
  };

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
        isVisible={!!selected} // Only show resize handles when actually selected (not just highlighted)
        minWidth={minW}
        minHeight={minH}
        handleStyle={{ width: 12, height: 12, borderRadius: 4 }}
        lineStyle={{ strokeWidth: 1.5 }}
        onResizeEnd={() =>
          window.dispatchEvent(new Event('designer:node-resize-stop'))
        }
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
          borderWidth,
          borderStyle: 'solid',
          borderColor,
          boxShadow, // Applied here
          overflow: isParameter ? 'visible' : 'hidden',
          boxSizing: 'border-box',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          ...cardStyleClean,
        }}
      >
        {!hideHeader && (
          <div
            style={{
              padding: isParameter ? '6px 8px' : 10,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
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
                  flexShrink: 0,
                }}
                title={data.badge}
              >
                {data.badge}
              </span>
            )}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: 22,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: isParameter ? 12 : 14,
                  lineHeight: '1.2',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                {data.title}
              </div>
            </div>
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
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
                      width: 20,
                      height: 20,
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
                      style={{ width: 14, height: 14, objectFit: 'contain' }}
                    />
                  </button>
                ))}
              {tooltipCount > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 20,
                    minWidth: 20,
                    padding: '0 4px',
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 10,
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
              {perspectiveCount > 1 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 20,
                    minWidth: 20,
                    padding: '0 4px',
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 10,
                    background: '#e2e8f0',
                    color: '#0f172a',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: '#cbd5e1',
                  }}
                >
                  P({perspectiveCount})
                </span>
              )}
              {reviewMode && (
                <div
                  className="nodrag nopan"
                  style={{ display: 'inline-flex' }}
                >
                  <ReviewBadge
                    total={reviewCount}
                    unresolved={reviewUnresolvedCount}
                    title="Reviews"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            minHeight: 0,
            display: 'flex',
            alignItems: isParameter ? 'flex-start' : 'stretch',
            justifyContent: 'center',
            padding: isParameter ? '0 8px 8px 8px' : 10,
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
              <DataPills
                items={footerItems as DataItem[]}
                onClick={handlePillClick}
              />
            </div>
          ) : (
            <div style={{ height: 0 }} />
          ))}
      </div>

      {(overlayTopRight || (reviewMode && hideHeader)) && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 5,
            pointerEvents: 'auto',
          }}
          className="nodrag nopan"
        >
          {overlayTopRight}
          {reviewMode && hideHeader && (
            <ReviewBadge
              total={reviewCount}
              unresolved={reviewUnresolvedCount}
              title="Reviews"
            />
          )}
        </div>
      )}

      {leftHandle && (
        <Handle
          id={`${id}:target`}
          type="target"
          position={Position.Left}
          className="nodrag nopan"
          style={{
            width: 8,
            height: 16,
            borderRadius: 2,
            background: '#94a3b8',
            border: 'none',
          }}
        />
      )}
      {rightHandle && canInteract && (
        <ClickHoverPorts position={Position.Right} idPrefix={`${id}:act`} />
      )}
    </div>
  );
}
