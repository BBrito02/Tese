import React, { useState } from 'react';
import type { DataItem } from '../../domain/types';

type Activation = 'hover' | 'click';

type Props = {
  availableData: DataItem[]; // Updated to expect objects with IDs
  onCancel: () => void;
  onSave?: (payload: {
    mode: 'new';
    attachRef: string; // Will now be the ID (UUID)
    activation: Activation;
    newTooltip: { title: string };
  }) => void;
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

export default function TooltipPopup({
  availableData,
  onCancel,
  onSave,
}: Props) {
  // Logic Update: We no longer need to extract names or slugify.
  // We use the DataItem objects directly.

  const [name, setName] = useState('');
  const [attachRef, setAttachRef] = useState(''); // Stores the ID
  const [activation, setActivation] = useState<Activation>('hover');

  const canSave = attachRef.length > 0;

  const handleSave = () => {
    if (!onSave || !canSave) return;
    onSave({
      mode: 'new',
      attachRef,
      activation,
      newTooltip: { title: name || 'Tooltip' },
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* New tooltip name */}
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
          placeholder="Tooltip name"
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            fontWeight: 700,
          }}
        />
      </div>

      {/* Attach to — DATA ONLY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={pill}>Data attribute</div>
        <select
          value={attachRef}
          onChange={(e) => setAttachRef(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            fontWeight: 700,
          }}
        >
          <option value="" disabled>
            (No data attributes in this visualization)
          </option>
          {/* LOGIC CHANGE: Use ID as value, Name as label */}
          {availableData.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Activation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={pill}>Activation</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <input
              type="radio"
              name="tt-activation"
              value="hover"
              checked={activation === 'hover'}
              onChange={() => setActivation('hover')}
            />
            Hover
          </label>
          <label
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <input
              type="radio"
              name="tt-activation"
              value="click"
              checked={activation === 'click'}
              onChange={() => setActivation('click')}
            />
            Click
          </label>
        </div>
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
          onClick={handleSave}
          disabled={!canSave}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: canSave ? '#38bdf8' : '#a3d9ef',
            color: '#fff',
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
          title={canSave ? 'Save changes' : 'Complete the form'}
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
