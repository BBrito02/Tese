import React, { useMemo, useState } from 'react';
import type { VisualVariable } from '../../domain/types';
import { VISUAL_VAR_ICONS } from '../../domain/icons';

type Props = {
  initial: VisualVariable[];
  onCancel: () => void;
  onSave: (vars: VisualVariable[]) => void;
};

const ALL_VV: VisualVariable[] = ['Size', 'Shape', 'Color'];

export default function VisualVariablePopup({
  initial,
  onCancel,
  onSave,
}: Props) {
  const [setVars, setSetVars] = useState(new Set(initial));

  const toggle = (vv: VisualVariable) => {
    setSetVars((prev) => {
      const next = new Set(prev);
      next.has(vv) ? next.delete(vv) : next.add(vv);
      return next;
    });
  };

  const list = useMemo(() => Array.from(setVars), [setVars]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.8 }}>
        Visual variables
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8,
        }}
      >
        {ALL_VV.map((vv) => {
          const selected = setVars.has(vv);
          return (
            <button
              key={vv}
              type="button"
              onClick={() => toggle(vv)}
              aria-pressed={selected}
              title={vv}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '6px 8px',
                background: selected ? '#eef2ff' : '#fff',
                cursor: 'pointer',
              }}
            >
              <input type="checkbox" readOnly checked={selected} />
              <img
                src={VISUAL_VAR_ICONS[vv]}
                alt={vv}
                style={{ width: 22, height: 22, objectFit: 'contain' }}
              />
              <span style={{ fontWeight: 600, fontSize: 12 }}>{vv}</span>
            </button>
          );
        })}
      </div>

      {/* Current list with delete buttons */}
      {list.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {list.map((vv) => (
            <button
              key={`cur-${vv}`}
              onClick={() => toggle(vv)}
              title={`Remove ${vv}`}
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
                src={VISUAL_VAR_ICONS[vv]}
                alt=""
                style={{ width: 14, height: 14 }}
              />
              {vv} ✕
            </button>
          ))}
        </div>
      )}

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
          onClick={() => onSave(list)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: '#38bdf8',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
