// src/components/menus/ComponentsMenu.tsx
import { useEffect, useState, useRef } from 'react';
import type { Node as RFNode } from 'reactflow';
import type { DataItem, NodeData, NodeKind } from '../../domain/types';
import type { Review } from '../../domain/types';
import { MENUS } from '.';
import { BaseMenu, WhiteField } from './common';
import {
  LuPanelRightClose,
  LuPanelLeftClose,
  LuCheck,
  LuTrash2,
} from 'react-icons/lu';
import { nanoid } from 'nanoid';

import { SectionTitle, NameField } from './sections';

type Props = {
  node?: RFNode<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  onDelete?: () => void;
  onOpen?: (
    type: 'data' | 'interactions' | 'tooltips' | 'add-component'
  ) => void;
  parentData?: (string | DataItem)[];

  // --- review mode wiring ---
  reviewMode?: boolean;
  reviewTargetId?: string; // usually node?.id or edge id (not displayed)
  reviewTargetLabel?: string; // human label for target (component name or edge target)
  reviewSourceLabel?: string; // when reviewing an edge, pass the SOURCE label
  reviews?: Review[]; // already filtered for this target
  onReviewCreate?: (r: Review) => void;
  onReviewUpdate?: (id: string, patch: Partial<Review>) => void;
  onReviewDelete?: (id: string) => void;
};

const PANEL_W = 280;
const COLLAPSED_W = 0;
const ANIM_MS = 200;
const LS_KEY = 'componentsMenu:collapsed';

export default function ComponentsMenu({
  node,
  onChange,
  onDelete,
  onOpen,
  parentData,
  // review
  reviewMode = false,
  reviewTargetId,
  reviewTargetLabel,
  reviewSourceLabel,
  reviews = [],
  onReviewCreate,
  onReviewUpdate,
  onReviewDelete,
}: Props) {
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
      {/* toggle */}
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
          <ReviewBody
            targetId={reviewTargetId ?? panelNode.id}
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

/* ---------------- Review body (no chrome) ---------------- */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        fontSize: 10,
        borderRadius: 999,
        background: '#f1f5f9',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
      }}
    >
      {children}
    </span>
  );
}

function ReviewBody({
  targetId, // kept only for wiring (never shown)
  targetLabel,
  sourceLabel,
  reviews,
  onCreate,
  onToggle,
  onDelete,
}: {
  targetId: string;
  targetLabel?: string;
  sourceLabel?: string;
  reviews: Review[];
  onCreate: (
    text: string,
    category: Review['category'],
    priority: Review['priority']
  ) => void;
  onToggle: (id: string, nextResolved: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Review['category']>('Design');
  const [priority, setPriority] = useState<Review['priority']>('Medium');

  const sorted = [...reviews].sort((a, b) => {
    if (!!a.resolved !== !!b.resolved) return a.resolved ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  return (
    <>
      {/* Centered title */}
      <div
        style={{
          fontWeight: 700,
          textAlign: 'center',
        }}
      >
        REVIEWS
      </div>

      {/* Details section (Component OR Edge) */}
      <SectionTitle>Details</SectionTitle>
      <div style={{ display: 'grid', gap: 8 }}>
        {sourceLabel ? (
          <>
            <NameField
              label="Source"
              placeholder="Source"
              value={sourceLabel}
              onChange={() => {}}
              disabled
            />
            <NameField
              label="Target"
              placeholder="Target"
              value={targetLabel ?? ''}
              onChange={() => {}}
              disabled
            />
          </>
        ) : (
          <NameField
            label="Component"
            placeholder="Component"
            value={targetLabel ?? ''}
            onChange={() => {}}
            disabled
          />
        )}
      </div>

      {/* Review section (matches sections styling) */}
      <SectionTitle>Review</SectionTitle>

      {/* Add review */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#fff',
            }}
          >
            <option>Design</option>
            <option>Functionality</option>
            <option>Data</option>
            <option>Other</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#fff',
            }}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="What should be improved?"
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              resize: 'vertical',
              background: '#fff',
            }}
          />

          <button
            onClick={() => {
              const t = text.trim();
              if (!t) return;
              onCreate(t, category, priority);
              setText('');
            }}
            disabled={!text.trim()}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid transparent',
              background: text.trim() ? '#3b82f6' : '#93c5fd',
              color: '#fff',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Add review
          </button>
        </div>
      </div>

      {/* Existing notes */}
      <div style={{ display: 'grid', gap: 8 }}>
        {sorted.length === 0 && (
          <div
            style={{
              padding: 10,
              border: '1px dashed #cbd5e1',
              borderRadius: 10,
              background: '#fff',
              color: '#64748b',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            No reviews yet.
          </div>
        )}

        {sorted.map((r) => (
          <div
            key={r.id}
            style={{
              // ✅ green highlight when resolved
              background: r.resolved ? '#ecfdf5' : '#fff', // green-50
              border: r.resolved ? '1px solid #86efac' : '1px solid #e5e7eb', // green-300
              borderRadius: 12,
              padding: 10,
              transition: 'background 160ms ease, border-color 160ms ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              {r.category && <Chip>{r.category}</Chip>}
              {r.priority && <Chip>{r.priority}</Chip>}
              <span
                style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b' }}
              >
                {new Date(r.createdAt).toLocaleString()}
              </span>
            </div>

            <div
              style={{
                color: r.resolved ? '#065f46' : '#0f172a', // deeper green for resolved text
                fontSize: 13,
                lineHeight: 1.35,
              }}
            >
              {r.text}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={() => onToggle(r.id, !r.resolved)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 8,
                  // keep button green in both states, darker when resolved
                  border: r.resolved
                    ? '1px solid #86efac'
                    : '1px solid #a7f3d0',
                  background: r.resolved ? '#d1fae5' : '#ecfdf5',
                  color: '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
                title={r.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
              >
                <LuCheck size={14} />
                {r.resolved ? 'Resolved' : 'Resolve'}
              </button>

              <button
                onClick={() => onDelete(r.id)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#ef4444',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Delete review"
              >
                <LuTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
