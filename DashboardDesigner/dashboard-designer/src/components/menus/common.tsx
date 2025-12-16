import React, { useEffect, useState } from 'react';
import { FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import type { Node as RFNode } from 'reactflow';
import type { NodeData } from '../../domain/types';

// Exported styles
export const WhiteField: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#fff',
  fontWeight: 700,
  boxSizing: 'border-box',
};

export const GhostLine: React.CSSProperties = {
  height: 14,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#fff',
};

export type KindProps = {
  node: RFNode<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  onDelete?: () => void;
  disabled?: boolean;

  // --- Map of node ID -> Title ---
  nodeNames?: Record<string, string>;

  // Review Mode Props
  reviewMode?: boolean;
  reviewTargetId?: string;
  reviewTargetLabel?: string;
  reviewSourceLabel?: string;
  parentData?: any[];
  reviews?: any[];
  onReviewCreate?: (review: any) => void;
  onReviewUpdate?: (reviewId: string, patch: any) => void;
  onReviewDelete?: (reviewId: string) => void;
  onReply?: (reviewId: string, text: string, author?: string) => void;
  onDeleteReply?: (reviewId: string, replyId: string) => void;

  onOpen?: (
    type: 'data' | 'interactions' | 'tooltips' | 'add-component'
  ) => void;
  onCreatePerspective?: (sourceId: string) => void;
  onNavigate?: (targetId: string) => void;
};

export type PanelProps = {
  children: React.ReactNode;
  title?: React.ReactNode;
  initialWidth?: number;
  collapsible?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  suppressResizeEvent?: boolean;
};

export function Panel({
  children,
  title,
  initialWidth = 280,
  collapsible = true,
  onCollapseChange,
  className,
  style,
  suppressResizeEvent = false,
}: PanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? 28 : initialWidth;

  useEffect(() => {
    if (suppressResizeEvent) return;
    const ev = new CustomEvent('designer:menu-width', { detail: { width } });
    window.dispatchEvent(ev);
  }, [width, suppressResizeEvent]);

  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);

  return (
    <div
      className={className}
      style={{
        width,
        height: '100%',
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        borderLeft: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        position: 'relative',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        ...style,
      }}
    >
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? 0 : '0 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f8fafc',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{title}</div>
        )}
        {collapsible && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {collapsed ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
          </button>
        )}
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? 'none' : 'auto',
          transition: 'opacity 0.1s ease',
          padding: collapsed ? 0 : 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function BaseMenu({
  children,
  node,
  onDelete,
}: KindProps & { children?: React.ReactNode }) {
  return (
    <Panel title={(node.data as any).title || node.id}>
      {children}
      {onDelete && (
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            onClick={onDelete}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 6,
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Delete Component
          </button>
        </div>
      )}
    </Panel>
  );
}
