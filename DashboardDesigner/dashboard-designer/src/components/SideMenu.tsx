import React, { useCallback, useMemo } from 'react';
import type { NodeKind } from '../domain/types';

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

const SideMenu = () => {
  const onDragStart = useCallback((ev: React.DragEvent, payload: DragData) => {
    ev.dataTransfer.setData('application/reactflow', JSON.stringify(payload));
    ev.dataTransfer.effectAllowed = 'move';
  }, []);

  const sidebar = useMemo(
    () => (
      <div
        className="sidebar"
        style={{ width: 260, background: '#eee', padding: 12, height: '100vh' }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
          MENU
        </div>
        {PALETTE.map((p) => (
          <div
            key={p.kind}
            draggable
            onDragStart={(e) => onDragStart(e, p)}
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
            }}
            title={`Arrastar ${p.kind}`}
          >
            {p.kind}
          </div>
        ))}
      </div>
    ),
    [onDragStart]
  );

  return <div>{sidebar}</div>;
};

export default SideMenu;
