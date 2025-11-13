import { useState } from 'react';
import type { NodeKind } from '../../domain/types';
import { useDraggable } from '@dnd-kit/core';
import type { IconType } from 'react-icons';
import {
  LuLayoutDashboard,
  LuInfo,
  LuList,
  LuMousePointerClick,
  LuFilter,
  LuSlidersHorizontal,
  LuZap,
  LuImageOff,
  LuChartColumnDecreasing,
  LuPanelLeftClose,
  LuPanelRightClose,
} from 'react-icons/lu';

export type DragData = { kind: NodeKind; title?: string };

// ---- layout constants (tweak to taste) ----
const SIDEBAR_W = 240;
const TILE_H = 76;
const TILE_RADIUS = 12;

type Section = {
  title: string;
  items: Array<{ kind: NodeKind; label: string; Icon: IconType }>;
};

const SECTIONS: Section[] = [
  {
    title: 'Visualization Components',
    items: [
      { kind: 'Dashboard', label: 'Dashboard', Icon: LuLayoutDashboard },
      {
        kind: 'Visualization',
        label: 'Visualization',
        Icon: LuChartColumnDecreasing,
      },
      { kind: 'Tooltip', label: 'Tooltip', Icon: LuInfo },
      { kind: 'Legend', label: 'Legend', Icon: LuList },
    ],
  },
  {
    title: 'Interaction Components',
    items: [
      { kind: 'Button', label: 'Button', Icon: LuMousePointerClick },
      { kind: 'Filter', label: 'Filter', Icon: LuFilter },
      { kind: 'Parameter', label: 'Parameter', Icon: LuSlidersHorizontal },
      { kind: 'DataAction', label: 'DataAction', Icon: LuZap },
    ],
  },
  {
    title: 'Others',
    items: [{ kind: 'Placeholder', label: 'Placeholder', Icon: LuImageOff }],
  },
];

function PaletteTile({
  payload,
  label,
  Icon,
}: {
  payload: DragData;
  label: string;
  Icon: IconType;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${payload.kind}`,
    data: payload,
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      title={`Drag ${label}`}
      style={{
        width: '100%',
        height: TILE_H,
        boxSizing: 'border-box',
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',

        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: TILE_RADIUS,
        boxShadow: '0 1px 1px rgba(0,0,0,0.06)',

        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 10,

        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <Icon size={18} />
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {label}
      </span>
    </button>
  );
}

export default function SideMenu() {
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? 0 : SIDEBAR_W;

  return (
    <>
      <aside
        className="sidebar no-scrollbar"
        style={{
          width,
          background: '#eee',
          padding: collapsed ? 0 : 12,
          height: collapsed ? 0 : 'calc(100vh - 14px)',
          marginLeft: collapsed ? 0 : 7,
          marginTop: collapsed ? 0 : 7,
          marginBottom: collapsed ? 0 : 7,
          borderRadius: collapsed ? 0 : 20,
          overflowY: collapsed ? 'hidden' : 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          transition:
            'width 200ms ease, padding 200ms ease, margin 200ms ease, height 200ms ease, border-radius 200ms ease',
        }}
      >
        {/* Header with collapse button */}
        {!collapsed && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="Hide menu"
              style={{
                border: '1px solid #e5e7eb',
                background: '#fff',
                width: 36,
                height: 36,
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <LuPanelLeftClose size={16} />
            </button>
          </div>
        )}

        {/* Content fades a bit during transition */}
        {!collapsed && (
          <div
            style={{
              transition: 'opacity 180ms ease',
              opacity: collapsed ? 0 : 1,
            }}
          >
            {SECTIONS.map((sec) => (
              <section
                key={sec.title}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: 14,
                  padding: 10,
                  marginBottom: 12,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#d1d5db',
                    padding: '6px 10px',
                    borderRadius: 8,
                    marginBottom: 8,
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  {sec.title}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 8,
                  }}
                >
                  {sec.items.map((it) => (
                    <div key={it.kind} style={{ minWidth: 0 }}>
                      <PaletteTile
                        payload={{ kind: it.kind }}
                        label={it.label}
                        Icon={it.Icon}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </aside>

      {/* Floating reopen button when collapsed */}
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Show menu"
          style={{
            position: 'absolute',
            left: 12,
            top: 18,
            zIndex: 20,
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <LuPanelRightClose size={16} />
        </button>
      )}
    </>
  );
}
