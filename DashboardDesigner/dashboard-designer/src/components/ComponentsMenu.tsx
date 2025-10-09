import { useEffect, useState, useMemo, useRef } from 'react';
import type { Node as RFNode } from 'reactflow';
import type { NodeData, NodeKind } from '../domain/types';
import { MENUS } from './menus';
import { BaseMenu } from './menus/common';
import { LuPanelRightClose, LuPanelLeftClose } from 'react-icons/lu';

type Props = {
  node?: RFNode<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  onDelete?: () => void;
  onOpen?: (
    type: 'data' | 'interactions' | 'tooltips' | 'add-component'
  ) => void;
};

const PANEL_W = 280;
const COLLAPSED_W = 28;
const ANIM_MS = 200;
const LS_KEY = 'componentsMenu:collapsed';

export default function ComponentsMenu({
  node,
  onChange,
  onDelete,
  onOpen,
}: Props) {
  // ---- All hooks live up here. No early returns below this line. ----

  // animate in/out when node appears/disappears
  const [shouldRender, setShouldRender] = useState(!!node);
  const [visible, setVisible] = useState(!!node);

  const [collapsed, setCollapsed] = useState(false);

  const lastNodeIdRef = useRef<string | null>(null);

  const [lastNode, setLastNode] = useState<RFNode<NodeData> | undefined>(node);

  // compute effective width & broadcast to Editor so it can offset top-right buttons
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
      // a node was (re)selected → expand by default
      setCollapsed(false);
      window.dispatchEvent(
        new CustomEvent('designer:menu-width', { detail: { width: PANEL_W } })
      );
    }

    // IMPORTANT: don't reset collapsed when deselecting (currId === null)
    // so it remains closed if the user had collapsed it.

    lastNodeIdRef.current = currId;
  }, [node?.id]);

  // broadcast width on collapse toggle
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

  // ---- Render (no early returns) ----
  return (
    <aside
      onTransitionEnd={handleTransitionEnd}
      style={{
        width,
        height: 'calc(100vh - 14px)',
        marginRight: 7,
        marginTop: 7,
        marginBottom: 7,

        background: collapsed ? 'transparent' : '#fafafa',
        borderLeft: collapsed ? 'none' : '1px solid #e5e7eb',
        borderRadius: collapsed ? 0 : 20,
        padding: collapsed ? 0 : 12,

        // IMPORTANT: always visible so the toggle can protrude
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
        zIndex: 1000, // stay above canvas & buttons
      }}
    >
      {/* toggle */}
      <button
        onClick={() => {
          const next = !collapsed;
          setCollapsed(next);
          localStorage.setItem(LS_KEY, JSON.stringify(next));
          // let Editor know our “logical” width so it can nudge its Save/Load cluster
          window.dispatchEvent(
            new CustomEvent('designer:menu-width', {
              detail: { width: next ? COLLAPSED_W : PANEL_W },
            })
          );
        }}
        title={collapsed ? 'Expand component menu' : 'Collapse component menu'}
        style={{
          position: 'absolute',
          top: 6,
          left: collapsed ? -10 : 8,
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
        {Menu ? (
          <Menu
            node={panelNode}
            onChange={onChange}
            disabled={disabled}
            onOpen={onOpen}
          />
        ) : (
          <BaseMenu node={panelNode} onChange={onChange} disabled={disabled} />
        )}

        {onDelete && (
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
