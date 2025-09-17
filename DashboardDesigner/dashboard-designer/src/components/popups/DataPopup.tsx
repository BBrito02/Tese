import React, { useState } from 'react';
import type { DataItem, DataType } from '../../domain/types';

type Props = {
  initial: DataItem[]; // current list for that node
  onSave: (items: DataItem[]) => void;
  onCancel: () => void;
};

const labelPill: React.CSSProperties = {
  background: '#cbd5e1',
  color: '#0f172a',
  borderRadius: 999,
  padding: '6px 12px',
  fontWeight: 700,
  textAlign: 'center',
};

export default function DataPopup({ initial, onSave, onCancel }: Props) {
  const [items, setItems] = useState<DataItem[]>(initial ?? []);
  const [name, setName] = useState('');
  const [dtype, setDtype] = useState<DataType>('Other');

  const addItem = () => {
    const n = name.trim();
    if (!n) return;
    setItems((xs) => [...xs, { name: n, dtype }]);
    setName('');
    setDtype('Other');
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 10 }}>
        {/* Row: Name + input */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <div style={labelPill}>Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Random Name"
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              fontWeight: 700,
            }}
          />
        </div>
        {/* Row: Type + select */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <div style={labelPill}>Type</div>
          <select
            value={dtype}
            onChange={(e) => setDtype(e.target.value as DataType)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              fontWeight: 700,
            }}
          >
            <option value="Binary">Binary</option>
            <option value="Continuous">Continuous</option>
            <option value="Discrete">Discrete</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Add button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={addItem}
            disabled={!name.trim()}
            style={{
              padding: '10px 16px',
              borderRadius: 999,
              border: 'none',
              background: '#67b7cc',
              color: '#fff',
              fontWeight: 800,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              width: 240,
            }}
          >
            Add to list
          </button>
        </div>
      </div>

      {/* Preview of items added in this session */}
      <div>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
          Current data
        </div>
        {items.length === 0 ? (
          <div
            style={{
              height: 14,
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: '#fff',
            }}
          />
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {items.map((it, i) => (
              <span
                key={`${it.name}-${i}`}
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: '#eef2ff',
                  border: '1px solid #c7d2fe',
                }}
              >
                {it.name} · {it.dtype}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
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
          onClick={() => onSave(items)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: '#38bdf8',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
