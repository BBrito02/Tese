import { useState, useMemo } from 'react';
import type { GraphType } from '../../domain/types';
import { GRAPH_TYPE_ICONS } from '../../domain/icons';

export type Props = {
  initialGraphTypes: GraphType[];
  onCancel: () => void;
  onConfirm: (types: GraphType[]) => void;
};

export default function GraphTypePopup({
  initialGraphTypes,
  onCancel,
  onConfirm,
}: Props) {
  // keep a toggleable Set like in VisualVariablePopup
  const [selected, setSelected] = useState<Set<GraphType>>(
    new Set(initialGraphTypes)
  );

  const ALL: GraphType[] = Object.keys(GRAPH_TYPE_ICONS) as GraphType[];

  function toggle(gt: GraphType) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(gt) ? next.delete(gt) : next.add(gt);
      return next;
    });
  }

  // build a stable list for chips & save
  const list = useMemo(() => Array.from(selected), [selected]);
  const canSave = selected.size > 0;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Title */}
      <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.85 }}>
        Graph type selection
      </div>

      {/* Selection grid (same feel as VV popup) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8,
        }}
      >
        {ALL.map((gt) => {
          const isChecked = selected.has(gt);
          return (
            <button
              key={gt}
              type="button"
              onClick={() => toggle(gt)}
              aria-pressed={isChecked}
              title={gt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '6px 8px',
                background: isChecked ? '#eef2ff' : '#fff',
                cursor: 'pointer',
              }}
            >
              <input type="checkbox" readOnly checked={isChecked} />
              <img
                src={GRAPH_TYPE_ICONS[gt]}
                alt={gt}
                style={{ width: 22, height: 22, objectFit: 'contain' }}
              />
              <span style={{ fontWeight: 600, fontSize: 12 }}>{gt}</span>
            </button>
          );
        })}
      </div>

      {/* Current list with delete buttons — mirrors VisualVariablePopup */}
      {list.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {list.map((gt) => (
            <button
              key={`cur-${gt}`}
              onClick={() => toggle(gt)}
              title={`Remove ${gt}`}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 999,
                padding: '2px 8px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <img
                src={GRAPH_TYPE_ICONS[gt]}
                alt=""
                style={{ width: 14, height: 14 }}
              />
              {gt} ✕
            </button>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(list)}
          disabled={!canSave}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: canSave ? '#38bdf8' : '#93c5fd',
            color: '#fff',
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
