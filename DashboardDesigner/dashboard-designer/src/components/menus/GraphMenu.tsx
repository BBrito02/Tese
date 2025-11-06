// src/components/menus/GraphMenu.tsx
import { useState } from 'react';
import { WhiteField, type KindProps } from './common';
import { TypeField, ListAttributesSection, SectionTitle } from './sections';
import type { DataItem, GraphType } from '../../domain/types';
import { GRAPH_TYPE_ICONS } from '../../domain/icons';

// extract names from (string | DataItem)[]
function namesFromParent(data?: (string | DataItem)[]): string[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((it) => (typeof it === 'string' ? it : it?.name))
    .filter(Boolean) as string[];
}

const selectCss: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
};

const addBtn: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #38bdf8',
  background: '#38bdf8',
  color: '#fff',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export default function GraphMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;
  const gt = (p.node.data as any)?.graphType as GraphType | undefined;

  // Prefer parent visualization data; fallback to local data
  const available = namesFromParent((p as any).parentData ?? d?.data);
  const columns: string[] = Array.isArray(d.columns) ? d.columns : [];
  const rows: string[] = Array.isArray(d.rows) ? d.rows : [];

  const [colPick, setColPick] = useState<string>('');
  const [rowPick, setRowPick] = useState<string>('');

  const constrain = (vals: string[]) =>
    available.length ? vals.filter((v) => available.includes(v)) : vals;

  const addToColumns = () => {
    if (!colPick || columns.includes(colPick)) return;
    p.onChange({ columns: constrain([...columns, colPick]) } as any);
    setColPick('');
  };

  const addToRows = () => {
    if (!rowPick || rows.includes(rowPick)) return;
    p.onChange({ rows: constrain([...rows, rowPick]) } as any);
    setRowPick('');
  };

  const columnOptions = available.filter((n) => !columns.includes(n));
  const rowOptions = available.filter((n) => !rows.includes(n));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      <SectionTitle>Properties</SectionTitle>

      <TypeField value="Graph" />
      {/* Graph type title */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 6,
            paddingLeft: 6,
          }}
        >
          Graph type
        </label>
        {/* Read-only field with inline icon */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            value={gt ?? '(none)'}
            readOnly
            disabled
            style={{
              ...WhiteField,
              width: '100%',
              paddingRight: 40,
              color: '#0f172a',
              opacity: 1,
              fontWeight: 600,
            }}
          />
          {gt && (
            <img
              src={GRAPH_TYPE_ICONS[gt]}
              alt={gt}
              style={{
                position: 'absolute',
                right: 8,
                width: 26,
                height: 26,
                objectFit: 'contain',
                borderRadius: 6,
                background: '#f8fafc',
                padding: 4,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>

      <SectionTitle>Actions</SectionTitle>

      {/* Columns list (consistent look via ListSection) */}
      <ListAttributesSection
        title="Columns"
        items={columns}
        disabled={disabled}
        onRemove={(idx) => {
          const next = columns.filter((_, i) => i !== idx);
          p.onChange({ columns: next } as any);
        }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={colPick}
          onChange={(e) => setColPick(e.target.value)}
          disabled={disabled}
          style={selectCss}
        >
          <option value="">Select a field…</option>
          {columnOptions.map((name) => (
            <option key={`col-${name}`} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addToColumns}
          disabled={disabled || !colPick}
          style={{ ...addBtn, opacity: disabled || !colPick ? 0.6 : 1 }}
        >
          Add
        </button>
      </div>

      {/* Rows list (consistent look via ListSection) */}
      <ListAttributesSection
        title="Rows"
        items={rows}
        disabled={disabled}
        onRemove={(idx) => {
          const next = rows.filter((_, i) => i !== idx);
          p.onChange({ rows: next } as any);
        }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={rowPick}
          onChange={(e) => setRowPick(e.target.value)}
          disabled={disabled}
          style={selectCss}
        >
          <option value="">Select a field…</option>
          {rowOptions.map((name) => (
            <option key={`row-${name}`} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addToRows}
          disabled={disabled || !rowPick}
          style={{ ...addBtn, opacity: disabled || !rowPick ? 0.6 : 1 }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
