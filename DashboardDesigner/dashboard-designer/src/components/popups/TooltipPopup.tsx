// src/components/popups/TooltipPopup.tsx
import React, { useMemo, useState } from 'react';
import type { DataItem, DataType } from '../../domain/types';

type GraphType =
  | 'bar'
  | 'line'
  | 'area'
  | 'scatter'
  | 'pie'
  | 'table'
  | 'heatmap'
  | 'other';

type Props = {
  availableData: Array<string | DataItem>;
  onCancel: () => void;
  onSave?: (payload: unknown) => void;
};

const pill: React.CSSProperties = {
  background: '#cbd5e1',
  color: '#0f172a',
  borderRadius: 999,
  padding: '6px 12px',
  fontWeight: 700,
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

const chip: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid #e5e7eb',
  background: '#f8fafc',
  fontWeight: 700,
  fontSize: 12,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

export default function TooltipPopup({
  availableData,
  onCancel,
  onSave,
}: Props) {
  const existingNames = useMemo(
    () => availableData.map((v) => (typeof v === 'string' ? v : v.name)),
    [availableData]
  );

  // base info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // data selection
  const [dataMode, setDataMode] = useState<'existing' | 'custom'>('existing');
  const [existingRef, setExistingRef] = useState<string>('');

  // custom data (multi)
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<DataType>('Other');
  const [customItems, setCustomItems] = useState<DataItem[]>([]);

  // optional graph
  const [graphType, setGraphType] = useState<GraphType | ''>('');

  const addCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    // avoid duplicates by name + dtype
    if (
      customItems.some((it) => it.name === trimmed && it.dtype === customType)
    ) {
      return;
    }
    setCustomItems((arr) => arr.concat({ name: trimmed, dtype: customType }));
    setCustomName('');
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Name */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={pill}>Name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Random Name"
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            fontWeight: 700,
          }}
        />
      </div>

      {/* Description */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'start',
        }}
      >
        <div style={pill}>Description</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Tooltip description"
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Data */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'start',
        }}
      >
        <div style={pill}>Data</div>

        <div style={{ display: 'grid', gap: 10 }}>
          {/* toggle existing/custom */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <input
                type="radio"
                name="tt-data-mode"
                value="existing"
                checked={dataMode === 'existing'}
                onChange={() => setDataMode('existing')}
              />
              Use visualization data
            </label>
            <label
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <input
                type="radio"
                name="tt-data-mode"
                value="custom"
                checked={dataMode === 'custom'}
                onChange={() => setDataMode('custom')}
              />
              Custom data
            </label>
          </div>

          {dataMode === 'existing' ? (
            <select
              value={existingRef}
              onChange={(e) => setExistingRef(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                background: '#fff',
                fontWeight: 700,
                width: '100%',
              }}
            >
              <option value="" disabled>
                Select an item
              </option>
              {existingNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          ) : (
            <>
              {/* Stacked, wrap-friendly layout (no overflow) */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                  placeholder="Custom data name"
                  style={{
                    flex: '1 1 180px',
                    minWidth: 160,
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    background: '#fff',
                    fontWeight: 700,
                  }}
                />
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as DataType)}
                  style={{
                    flex: '0 1 160px',
                    minWidth: 140,
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
                <button
                  type="button"
                  onClick={addCustom}
                  title="Add custom data"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 12,
                    border: '1px solid #38bdf8',
                    background: '#38bdf8',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>

              {/* show current custom items as removable chips */}
              {customItems.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {customItems.map((it, i) => (
                    <span key={`${it.name}-${it.dtype}-${i}`} style={chip}>
                      {it.name} · {it.dtype}
                      <button
                        onClick={() =>
                          setCustomItems((arr) =>
                            arr.filter((_, idx) => idx !== i)
                          )
                        }
                        title="Remove"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontWeight: 900,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Graph type (optional) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={pill}>Graph</div>
        <select
          value={graphType}
          onChange={(e) => setGraphType(e.target.value as GraphType | '')}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            fontWeight: 700,
          }}
        >
          <option value="">(none)</option>
          <option value="bar">Bar</option>
          <option value="line">Line</option>
          <option value="area">Area</option>
          <option value="scatter">Scatter</option>
          <option value="pie">Pie</option>
          <option value="table">Table</option>
          <option value="heatmap">Heatmap</option>
          <option value="other">Other</option>
        </select>
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
          onClick={() => {
            /* no-op by request */
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: '#38bdf8',
            color: '#fff',
            cursor: 'default',
          }}
          title="Not implemented yet"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
