import React, { useMemo, useState } from 'react';
import type { DataItem } from '../../domain/types';

type Marks = {
  color?: string | null;
  size?: string | null;
  shape?: string | null;
};

type Props = {
  available: (string | DataItem)[];
  initial: Marks;
  onCancel: () => void;
  onSave: (next: Marks) => void;
};

// --- shared styles (mirrors GraphFieldsPopup) ---
const field: React.CSSProperties = {
  height: 36,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  padding: '0 12px',
  fontWeight: 600,
  width: '100%',
  boxSizing: 'border-box',
};

const pill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  borderRadius: 999,
  background: '#eef2ff',
  border: '1px solid #c7d2fe',
  fontSize: 12,
};

const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '110px 1fr 80px',
  gap: 10,
  alignItems: 'center',
};

const label: React.CSSProperties = {
  fontWeight: 700,
  color: '#0f172a',
  opacity: 0.85,
};

function namesFrom(av: (string | DataItem)[]): string[] {
  const out: string[] = [];
  for (const it of av ?? []) {
    const n = typeof it === 'string' ? it : it?.name;
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

export default function GraphMarkPopup({
  available,
  initial,
  onCancel,
  onSave,
}: Props) {
  // current assignments (single value each)
  const [color, setColor] = useState<string | null>(initial?.color ?? null);
  const [size, setSize] = useState<string | null>(initial?.size ?? null);
  const [shape, setShape] = useState<string | null>(initial?.shape ?? null);

  // pickers
  const [colorPick, setColorPick] = useState('');
  const [sizePick, setSizePick] = useState('');
  const [shapePick, setShapePick] = useState('');

  const names = useMemo(() => namesFrom(available), [available]);

  // options: we allow duplicates across marks (Tableau-style),
  // so we don't filter them out by other marks
  const colorOptions = useMemo(
    () => names.filter((n) => n !== color),
    [names, color]
  );
  const sizeOptions = useMemo(
    () => names.filter((n) => n !== size),
    [names, size]
  );
  const shapeOptions = useMemo(
    () => names.filter((n) => n !== shape),
    [names, shape]
  );

  const addColor = () => {
    if (!colorPick) return;
    setColor(colorPick);
    setColorPick('');
  };
  const addSize = () => {
    if (!sizePick) return;
    setSize(sizePick);
    setSizePick('');
  };
  const addShape = () => {
    if (!shapePick) return;
    setShape(shapePick);
    setShapePick('');
  };

  return (
    <div style={{ display: 'grid', gap: 14, minWidth: 480 }}>
      {/* Color */}
      <div style={row}>
        <div style={label}>Color</div>
        <select
          value={colorPick}
          onChange={(e) => setColorPick(e.target.value)}
          style={field}
        >
          <option value="">{color ? 'Replace…' : 'Select a field…'}</option>
          {colorOptions.map((n) => (
            <option key={`c-${n}`} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addColor}
          disabled={!colorPick}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: colorPick ? '#38bdf8' : '#93c5fd',
            color: '#fff',
            cursor: colorPick ? 'pointer' : 'not-allowed',
          }}
        >
          Add
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {color ? (
          <span style={pill}>
            {color}
            <button
              type="button"
              onClick={() => setColor(null)}
              title="Remove"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.6 }}>(no color yet)</div>
        )}
      </div>

      {/* Size */}
      <div style={{ ...row, marginTop: 4 }}>
        <div style={label}>Size</div>
        <select
          value={sizePick}
          onChange={(e) => setSizePick(e.target.value)}
          style={field}
        >
          <option value="">{size ? 'Replace…' : 'Select a field…'}</option>
          {sizeOptions.map((n) => (
            <option key={`s-${n}`} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addSize}
          disabled={!sizePick}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: sizePick ? '#38bdf8' : '#93c5fd',
            color: '#fff',
            cursor: sizePick ? 'pointer' : 'not-allowed',
          }}
        >
          Add
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {size ? (
          <span style={pill}>
            {size}
            <button
              type="button"
              onClick={() => setSize(null)}
              title="Remove"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.6 }}>(no size yet)</div>
        )}
      </div>

      {/* Shape */}
      <div style={{ ...row, marginTop: 4 }}>
        <div style={label}>Shape</div>
        <select
          value={shapePick}
          onChange={(e) => setShapePick(e.target.value)}
          style={field}
        >
          <option value="">{shape ? 'Replace…' : 'Select a field…'}</option>
          {shapeOptions.map((n) => (
            <option key={`sh-${n}`} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addShape}
          disabled={!shapePick}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: shapePick ? '#38bdf8' : '#93c5fd',
            color: '#fff',
            cursor: shapePick ? 'pointer' : 'not-allowed',
          }}
        >
          Add
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {shape ? (
          <span style={pill}>
            {shape}
            <button
              type="button"
              onClick={() => setShape(null)}
              title="Remove"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.6 }}>(no shape yet)</div>
        )}
      </div>

      {/* Footer */}
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
          onClick={() => onSave({ color, size, shape })}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: '#38bdf8',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Save marks…
        </button>
      </div>
    </div>
  );
}
