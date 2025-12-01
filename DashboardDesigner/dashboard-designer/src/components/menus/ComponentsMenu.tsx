// src/components/menus/ComponentsMenu.tsx
import { useEffect, useState, useRef } from 'react';
import type { Node as RFNode } from 'reactflow';
import type { DataItem, NodeData, NodeKind } from '../../domain/types';
import type { Review } from '../../domain/types';
import { MENUS } from '.';
import { BaseMenu } from './common';
import { LuPanelRightClose, LuPanelLeftClose } from 'react-icons/lu';
import { nanoid } from 'nanoid';
import ReviewMenu from './ReviewMenu';
// (keep SectionTitle/NameField imports only if you still use them elsewhere)

const PANEL_W = 280;
const COLLAPSED_W = 0;
const ANIM_MS = 200;
const LS_KEY = 'componentsMenu:collapsed';

type Props = {
  node?: RFNode<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  onDelete?: () => void;
  onOpen?: (
    type: 'data' | 'interactions' | 'tooltips' | 'add-component'
  ) => void;
  parentData?: (string | DataItem)[];
  reviewMode?: boolean;
  reviewTargetId?: string;
  reviewTargetLabel?: string;
  reviewSourceLabel?: string;
  reviews?: Review[];
  onReviewCreate?: (r: Review) => void;
  onReviewUpdate?: (id: string, patch: Partial<Review>) => void;
  onReviewDelete?: (id: string) => void;
};

export default function ComponentsMenu(props: Props) {
  const {
    node,
    onChange,
    onDelete,
    onOpen,
    parentData,
    reviewMode = false,
    reviewTargetId,
    reviewTargetLabel,
    reviewSourceLabel,
    reviews = [],
    onReviewCreate,
    onReviewUpdate,
    onReviewDelete,
  } = props;

  const [shouldRender, setShouldRender] = useState(!!node);
  const [visible, setVisible] = useState(!!node);
  const [collapsed, setCollapsed] = useState(false);
  const lastNodeIdRef = useRef<string | null>(null);
  const [lastNode, setLastNode] = useState<RFNode<NodeData> | undefined>(node);

  const width = collapsed ? COLLAPSED_W : PANEL_W;

  useEffect(() => {
    if (node) {
      setLastNode(node);
      setShouldRender(true);
      requestAnimationFrame(() => setVisible(true));
    } else if (shouldRender) {
      setVisible(false);
    }
  }, [node, shouldRender]);

  useEffect(() => {
    const currId = node?.id ?? null;
    if (currId && currId !== lastNodeIdRef.current) {
      setCollapsed(false);
      window.dispatchEvent(
        new CustomEvent('designer:menu-width', { detail: { width: PANEL_W } })
      );
    }
    lastNodeIdRef.current = currId;
  }, [node?.id]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('designer:menu-width', { detail: { width } })
    );
  }, [width]);

  const handleTransitionEnd: React.TransitionEventHandler<HTMLElement> = (
    e
  ) => {
    if (e.target !== e.currentTarget) return;
    if (!visible) setShouldRender(false);
  };

  if (!shouldRender) return null;

  const panelNode = node ?? lastNode!;
  const disabled = !node;
  const Menu = MENUS[panelNode.data.kind as NodeKind];

  return (
    <aside
      onTransitionEnd={handleTransitionEnd}
      style={{
        width,
        height: 'calc(100vh - 14px)',
        marginTop: 7,
        marginBottom: 7,
        marginRight: collapsed ? 0 : 7,
        padding: collapsed ? 0 : 12,
        borderLeft: collapsed ? 'none' : '1px solid #e5e7eb',
        background: collapsed ? 'transparent' : '#fafafa',
        borderRadius: collapsed ? 0 : 20,
        overflow: 'visible',
        transition: `width ${ANIM_MS}ms ease, opacity 180ms ease, transform ${ANIM_MS}ms ease`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(8px)',
        pointerEvents: visible ? 'auto' : 'none',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1000,
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* collapse toggle */}
      <button
        onClick={() => {
          const next = !collapsed;
          setCollapsed(next);
          localStorage.setItem(LS_KEY, JSON.stringify(next));
          window.dispatchEvent(
            new CustomEvent('designer:menu-width', {
              detail: { width: next ? COLLAPSED_W : PANEL_W },
            })
          );
        }}
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
        style={{
          position: 'absolute',
          top: 6,
          left: collapsed ? -38 : 8,
          width: 32,
          height: 32,
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          background: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 2000,
        }}
      >
        {collapsed ? (
          <LuPanelLeftClose size={16} />
        ) : (
          <LuPanelRightClose size={16} />
        )}
      </button>

      {/* content */}
      <div
        style={{
          display: collapsed ? 'none' : 'block',
          overflow: 'auto',
          height: '100%',
        }}
      >
        {reviewMode ? (
          <ReviewMenu
            targetLabel={
              reviewTargetLabel ?? panelNode.data.title ?? panelNode.id
            }
            sourceLabel={reviewSourceLabel}
            reviews={reviews}
            onCreate={(text, category, priority) =>
              onReviewCreate?.({
                id: nanoid(),
                targetId: reviewTargetId ?? panelNode.id,
                text,
                category,
                priority,
                createdAt: Date.now(),
                resolved: false,
              })
            }
            onToggle={(id, next) => onReviewUpdate?.(id, { resolved: next })}
            onDelete={(id) => onReviewDelete?.(id)}
            onUpdate={(id, patch) => onReviewUpdate?.(id, patch)}
          />
        ) : Menu ? (
          <Menu
            node={panelNode}
            onChange={onChange}
            disabled={disabled}
            onOpen={onOpen}
            parentData={parentData}
          />
        ) : (
          <BaseMenu node={panelNode} onChange={onChange} disabled={disabled} />
        )}

        {!reviewMode && onDelete && (
          <button
            onClick={onDelete}
            disabled={disabled}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #ef4444',
              color: '#ef4444',
              background: 'white',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Delete node
          </button>
        )}
      </div>
    </aside>
  );
}
