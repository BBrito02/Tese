// src/components/menus/EdgesMenu.tsx
import { useEffect, useState, type ReactNode } from 'react';
import { LuPanelRightClose, LuPanelLeftClose } from 'react-icons/lu';

const PANEL_W = 280;
const COLLAPSED_W = 0;
const ANIM_MS = 200;
// reuse the same key so collapse/expand feels global across node + edge menus
const LS_KEY = 'componentsMenu:collapsed';

type EdgeSidePanelProps = {
  children: ReactNode;
};

export default function EdgesMenu({ children }: EdgeSidePanelProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(LS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [visible] = useState(true); // no fancy exit animation for now
  const width = collapsed ? COLLAPSED_W : PANEL_W;

  // broadcast width so Editor can move the top-right buttons
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('designer:menu-width', { detail: { width } })
    );
    try {
      window.localStorage.setItem(LS_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [width, collapsed]);

  return (
    <aside
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
      {/* collapse / expand toggle – same visual as ComponentsMenu */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
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

      <div
        style={{
          display: collapsed ? 'none' : 'block',
          overflow: 'auto',
          height: '100%',
        }}
      >
        {children}
      </div>
    </aside>
  );
}
