import React, { useMemo, useState } from 'react';
import type { GraphType } from '../../domain/types';
import { ShowMeHint } from './ShowMeHint';

type Props = {
  available: string[]; // fields coming from parent viz
  initialColumns: string[];
  initialRows: string[];
  onCancel: () => void;
  onSave: (next: { columns: string[]; rows: string[] }) => void;
  graphType?: GraphType;
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

export default function GraphFieldsPopup({
  available,
  initialColumns,
  initialRows,
  onCancel,
  onSave,
  graphType,
}: Props) {
  const [columns, setColumns] = useState<string[]>(initialColumns ?? []);
  const [rows, setRows] = useState<string[]>(initialRows ?? []);
  const [colPick, setColPick] = useState('');
  const [rowPick, setRowPick] = useState('');

  const colOptions = useMemo(
    () => available.filter((n) => !columns.includes(n)),
    [available, columns]
  );
  const rowOptions = useMemo(
    () => available.filter((n) => !rows.includes(n)),
    [available, rows]
  );

  const addCol = () => {
    if (!colPick || columns.includes(colPick)) return;
    setColumns((xs) => xs.concat(colPick));
    setColPick('');
  };

  const addRow = () => {
    if (!rowPick || rows.includes(rowPick)) return;
    setRows((xs) => xs.concat(rowPick));
    setRowPick('');
  };

  const removeCol = (i: number) =>
    setColumns((xs) => xs.filter((_, k) => k !== i));
  const removeRow = (i: number) =>
    setRows((xs) => xs.filter((_, k) => k !== i));

  return (
    <div style={{ display: 'grid', gap: 14, minWidth: 440 }}>
      {/* Columns */}
      <div style={{ ...row }}>
        <div style={label}>Columns</div>
        <select
          value={colPick}
          onChange={(e) => setColPick(e.target.value)}
          style={field}
        >
          <option value="">Select a field…</option>
          {colOptions.map((n) => (
            <option key={`c-${n}`} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addCol}
          disabled={!colPick}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: colPick ? '#38bdf8' : '#93c5fd',
            color: '#fff',
            cursor: colPick ? 'pointer' : 'not-allowed',
          }}
        >
          Add
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {columns.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.6 }}>(no columns yet)</div>
        ) : (
          columns.map((name, i) => (
            <span key={`col-${name}-${i}`} style={pill}>
              {name}
              <button
                type="button"
                onClick={() => removeCol(i)}
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
          ))
        )}
      </div>

      {/* Rows */}
      <div style={{ ...row, marginTop: 4 }}>
        <div style={label}>Rows</div>
        <select
          value={rowPick}
          onChange={(e) => setRowPick(e.target.value)}
          style={field}
        >
          <option value="">Select a field…</option>
          {rowOptions.map((n) => (
            <option key={`r-${n}`} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addRow}
          disabled={!rowPick}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: rowPick ? '#38bdf8' : '#93c5fd',
            color: '#fff',
            cursor: rowPick ? 'pointer' : 'not-allowed',
          }}
        >
          Add
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {rows.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.6 }}>(no rows yet)</div>
        ) : (
          rows.map((name, i) => (
            <span key={`row-${name}-${i}`} style={pill}>
              {name}
              <button
                type="button"
                onClick={() => removeRow(i)}
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
          ))
        )}
      </div>

      {/* --- Show Me (requirements) --- */}
      <div
        style={{
          marginTop: 4,
          padding: 10,
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          background: '#f8fafc',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: '#0f172a',
            marginBottom: 6,
          }}
        >
          Show me{graphType ? ` — ${graphType}` : ''}
        </div>
        <ShowMeHint type={graphType} />
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
          onClick={() => onSave({ columns, rows })}
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
