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
  Parameter: { w: 170, h: 75 }, // User wants this compact size
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
  perspectiveCount?: number;

  reviewMode?: boolean;
  reviewCount?: number;
  reviewUnresolvedCount?: number;

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

  overlayTopRight?: React.ReactNode;
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
        const title = typeof it === 'string' ? it : `${it.name} · ${it.dtype}`;
        const handleId = `data:${slug(label)}`;

        return (
          <div
            key={`${label}-${i}`}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <button
              title={title}
              className="nodrag"
              // Removed stopPropagation so clicks can also select the node if desired
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
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#222',
                background: '#111',
              }}
            />

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
                left: '30%',
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

export default function BaseNodeShell({
  id,
  data,
  selected,
  body,
  footerItems,
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

  const canInteract = supportsInteractions(data.kind);

  useEffect(() => {
    const t = setTimeout(() => updateNodeInternals(id), 0);
    return () => clearTimeout(t);
  }, [id, updateNodeInternals, canInteract]);

  const hasFooter = Array.isArray(footerItems) && footerItems.length > 0;
  const dynamicBorderColor = isOver
    ? '#38bdf8'
    : selected
    ? '#60a5fa'
    : 'transparent';

  const borderColor = highlightBorder ? dynamicBorderColor : '#e5e7eb';
  const cardStyleClean = stripBorderStyles(cardStyle) || {};

  const handlePillClick = (index: number) => {
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('designer:edit-data', {
          detail: { nodeId: id, index },
        })
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
        isVisible={selected}
        minWidth={minW}
        minHeight={minH}
        handleStyle={{ width: 12, height: 12, borderRadius: 4 }}
        lineStyle={{ strokeWidth: 1.5 }}
        onResizeEnd={() => {
          window.dispatchEvent(new Event('designer:node-resize-stop'));
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          // Header height auto, body takes remaining space
          gridTemplateRows: hideHeader ? '1fr' : 'auto minmax(0, 1fr) auto',
          minHeight: 0,
          borderRadius: 12,
          background: '#fff',
          borderWidth,
          borderStyle: 'solid',
          borderColor,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          // Allow overflow for dropdowns in parameters
          overflow: isParameter ? 'visible' : 'hidden',
          boxSizing: 'border-box',
          ...cardStyleClean,
        }}
      >
        {!hideHeader && (
          <div
            style={{
              padding: isParameter ? '6px 8px' : 10, // Compact header padding for parameters
              display: 'flex',
              alignItems: 'flex-start', // Align items to top to handle multi-line title
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
                  flexShrink: 0, // Never shrink the badge
                }}
                title={data.badge}
              >
                {data.badge}
              </span>
            )}

            {/* Title Container: Allows shrinking and wrapping */}
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
                  whiteSpace: 'normal', // Allow text wrapping
                  wordBreak: 'break-word', // Break long words if needed
                }}
              >
                {data.title}
              </div>
            </div>

            {/* Right Controls: Force visibility */}
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0, // Prevent these from being cropped/squashed
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
                      width: 20, // Slightly smaller icons
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
                  title={`${tooltipCount} tooltips`}
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
                  title={`${perspectiveCount} perspectives`}
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
            alignItems: isParameter ? 'flex-start' : 'stretch', // Align top for inputs
            justifyContent: 'center',
            padding: isParameter ? '0 8px 8px 8px' : 10, // Tighter padding for parameters
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
              <DataPills items={footerItems!} onClick={handlePillClick} />
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
        />
      )}

      {rightHandle && canInteract && (
        <ClickHoverPorts position={Position.Right} idPrefix={`${id}:act`} />
      )}
    </div>
  );
}
