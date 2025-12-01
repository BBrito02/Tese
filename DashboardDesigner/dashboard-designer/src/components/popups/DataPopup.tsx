import React, { useMemo, useState } from 'react';
import type { DataItem } from '../../domain/types';

type Props = {
  initial: DataItem[];
  onCancel: () => void;
  onSave: (items: DataItem[]) => void;
};

const pill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  borderRadius: 999,
  background: '#e2e8f0',
  color: '#0f172a',
  fontWeight: 700,
};

const labelCell: React.CSSProperties = {
  width: 110,
  height: 36,
  lineHeight: '36px',
  borderRadius: 18,
  background: '#cbd5e1',
  color: '#0f172a',
  textAlign: 'center',
  fontWeight: 800,
};

const field: React.CSSProperties = {
  height: 36,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  padding: '0 12px',
  fontWeight: 600,
  width: '100%',
  boxSizing: 'border-box',
};

const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '120px minmax(0, 1fr)',
  gap: 12,
  alignItems: 'center',
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

export default function DataPopup({ initial, onCancel, onSave }: Props) {
  const [items, setItems] = useState<DataItem[]>(initial ?? []);
  const [name, setName] = useState('');
  const [dtype, setDtype] = useState<DataItem['dtype']>('Other');

  const names = useMemo(() => new Set(items.map((d) => norm(d.name))), [items]);

  const nameTrim = name.trim();
  const isDuplicate = nameTrim.length > 0 && names.has(norm(nameTrim));
  const isNameEmpty = nameTrim.length === 0;

  const canAdd = !isNameEmpty && !isDuplicate;

  // ✅ Allow saving when the list changed (including being emptied)
  const isDirty = useMemo(
    () => JSON.stringify(items) !== JSON.stringify(initial ?? []),
    [items, initial]
  );
  const canSave = isDirty;

  function add() {
    if (!canAdd) return;
    setItems((xs) => xs.concat({ name: nameTrim, dtype }));
    setName('');
  }

  function removeAt(i: number) {
    setItems((xs) => xs.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ ...row }}>
        <div style={labelCell}>Name</div>
        <div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (canAdd) add();
              }
            }}
            placeholder="e.g., Country"
            aria-invalid={isDuplicate}
            style={{
              ...field,
              borderColor: isDuplicate ? '#ef4444' : '#e5e7eb',
              outline: 'none',
              boxShadow: isDuplicate ? '0 0 0 3px rgba(239,68,68,.15)' : 'none',
            }}
          />
          {isDuplicate && (
            <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
              A data attribute with this name already exists in this component.
            </div>
          )}
        </div>
      </div>

      <div style={{ ...row }}>
        <div style={labelCell}>Type</div>
        <select
          value={dtype}
          onChange={(e) => setDtype(e.target.value as DataItem['dtype'])}
          style={field}
        >
          <option>Binary</option>
          <option>Continuous</option>
          <option>Discrete</option>
          <option>Other</option>
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={add}
          disabled={!canAdd}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: '1px solid #7cc1d1',
            background: canAdd ? '#63b3c3' : '#b8dbe3',
            color: '#fff',
            fontWeight: 800,
            cursor: canAdd ? 'pointer' : 'not-allowed',
            minWidth: 180,
          }}
        >
          Add to list
        </button>
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
          Current data
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {items.map((d, i) => (
            <span key={`${d.name}-${i}`} style={pill}>
              {d.name} · {d.dtype}
              <button
                onClick={() => removeAt(i)}
                aria-label={`Remove ${d.name}`}
                style={{
                  marginLeft: 6,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: 900,
                }}
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
          {items.length === 0 && (
            <span style={{ fontSize: 12, opacity: 0.6 }}>
              (no items — saving will clear this component&apos;s data list)
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => canSave && onSave(items)}
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
          Save changes
        </button>
      </div>
    </div>
  );
}
