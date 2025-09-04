import type { NodeKind } from '../domain/types';
import { useDraggable } from '@dnd-kit/core';

type DragData = { kind: NodeKind; title?: string };

const PALETTE: DragData[] = [
  { kind: 'Dashboard' },
  { kind: 'Visualization' },
  { kind: 'Legend' },
  { kind: 'Tooltip' },
  { kind: 'Button' },
  { kind: 'Filter' },
  { kind: 'Parameter' },
  { kind: 'DataAction' },
  { kind: 'Datum' },
  { kind: 'Placeholder' },
];

function PaletteItem({ payload }: { payload: DragData }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${payload.kind}`,
    data: payload,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        userSelect: 'none',
        padding: '10px 12px',
        marginBottom: 8,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #ddd',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: 40,
        opacity: isDragging ? 0.6 : 1,
      }}
      title={`Arrastar ${payload.kind}`}
    >
      {payload.kind}
    </div>
  );
}

export default function SideMenu() {
  return (
    <div
      className="sidebar"
      style={{ width: 260, background: '#eee', padding: 12, height: '100vh' }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
        MENU
      </div>
      {PALETTE.map((p) => (
        <PaletteItem key={p.kind} payload={p} />
      ))}
    </div>
  );
}
