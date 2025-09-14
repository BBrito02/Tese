import type { NodeKind } from '../domain/types';
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
  LuChartColumnDecreasing
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
    title: 'Componentes de Visualização',
    items: [
      { kind: 'Dashboard', label: 'Dashboard', Icon: LuLayoutDashboard },
      { kind: 'Visualization', label: 'Visualização', Icon: LuChartColumnDecreasing },
      { kind: 'Tooltip', label: 'Tooltip', Icon: LuInfo },
      { kind: 'Legend', label: 'Legenda', Icon: LuList },
    ],
  },
  {
    title: 'Componentes de Interação',
    items: [
      { kind: 'Button', label: 'Botão', Icon: LuMousePointerClick },
      { kind: 'Filter', label: 'Filtro', Icon: LuFilter },
      { kind: 'Parameter', label: 'Parâmetro', Icon: LuSlidersHorizontal },
      { kind: 'DataAction', label: 'Ação de Dados', Icon: LuZap },
    ],
  },
  {
    title: 'Outros',
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
      title={`Arrastar ${label}`}
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
  return (
    <aside
      className="sidebar no-scrollbar"
      style={{
        width: SIDEBAR_W,
        background: '#eee',
        padding: 12,
        height: 'calc(100vh - 14px)',
        marginLeft: 7,
        marginTop: 7,
        marginBottom: 7,
        borderRadius: 20,
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontWeight: 700, textAlign: 'center', marginBottom: 10 }}>
        MENU
      </div>

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
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', // never overflow
              gap: 8,
              // make sure children don't expand their grid tracks
              // (helps when labels are long)
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
    </aside>
  );
}
