import React, { useState, useMemo, useEffect } from 'react';
import type { DataItem } from '../../domain/types';

type Activation = 'hover' | 'click';
type SourceType = 'component' | 'data';

type Props = {
  availableData: DataItem[];
  onCancel: () => void;
  onSave?: (payload: {
    mode: 'new';
    attachRef: string; // ID or 'viz'
    attachValue?: string; // Specific value condition
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

// Helper to get display name without value suffix
function getDisplayName(rawName: string) {
  return rawName.split('=')[0].trim();
}

export default function TooltipPopup({
  availableData,
  onCancel,
  onSave,
}: Props) {
  const [name, setName] = useState('');

  // Split Source selection into Type and Reference ID
  const [sourceType, setSourceType] = useState<SourceType>('component');
  const [dataRef, setDataRef] = useState<string>(
    availableData.length > 0 ? availableData[0].id : ''
  );

  const [attachValue, setAttachValue] = useState('');
  const [activation, setActivation] = useState<Activation>('hover');

  // Ensure dataRef is valid if availableData changes
  useEffect(() => {
    if (
      availableData.length > 0 &&
      !availableData.find((d) => d.id === dataRef)
    ) {
      setDataRef(availableData[0].id);
    }
  }, [availableData, dataRef]);

  // Auto-detect current value from name (e.g., "Player = Ronaldo" -> "Ronaldo")
  const selectedItem = useMemo(
    () =>
      sourceType === 'data'
        ? availableData.find((d) => d.id === dataRef)
        : null,
    [availableData, dataRef, sourceType]
  );

  useEffect(() => {
    if (selectedItem && selectedItem.name.includes('=')) {
      const parts = selectedItem.name.split('=');
      if (parts.length > 1) {
        setAttachValue(parts[1].trim());
      }
    } else {
      setAttachValue('');
    }
  }, [selectedItem]);

  const canSave =
    name.trim().length > 0 && (sourceType === 'component' || !!dataRef);

  const handleSave = () => {
    if (!onSave || !canSave) return;

    // Determine the final attachment reference
    const finalAttachRef = sourceType === 'component' ? 'viz' : dataRef;

    onSave({
      mode: 'new',
      attachRef: finalAttachRef,
      // Only send attachValue if attached to data and value is present
      attachValue:
        sourceType === 'data' && attachValue.trim()
          ? attachValue.trim()
          : undefined,
      activation,
      newTooltip: { title: name || 'Tooltip' },
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16, minWidth: 320 }}>
      {/* 1. Name */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Name
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tooltip text..."
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            fontWeight: 700,
          }}
        />
      </section>

      {/* 2. Source Selection */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Attach to
        </div>

        {/* Radio Group */}
        <div style={{ display: 'flex', gap: 12 }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <input
              type="radio"
              name="tt-source"
              checked={sourceType === 'component'}
              onChange={() => setSourceType('component')}
            />
            Entire Component
          </label>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <input
              type="radio"
              name="tt-source"
              checked={sourceType === 'data'}
              onChange={() => setSourceType('data')}
              disabled={availableData.length === 0}
            />
            Data Attribute
          </label>
        </div>

        {/* Data Dropdown (Conditional) */}
        {sourceType === 'data' && (
          <select
            value={dataRef}
            onChange={(e) => setDataRef(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              fontWeight: 700,
            }}
          >
            {availableData.map((d) => (
              <option key={d.id} value={d.id}>
                {getDisplayName(d.name)} ({d.dtype})
              </option>
            ))}
          </select>
        )}
      </section>

      {/* 3. Value Condition (Conditional) */}
      {sourceType === 'data' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
              Value Condition
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Optional</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                ...pill,
                background: '#f1f5f9',
                color: '#64748b',
                fontSize: 11,
                padding: '4px 8px',
              }}
            >
              Value is
            </div>
            <input
              value={attachValue}
              onChange={(e) => setAttachValue(e.target.value)}
              placeholder="Any value"
              title="Only show this tooltip when the attribute value matches this string"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: '#fff',
                fontSize: 13,
              }}
            />
          </div>
        </section>
      )}

      {/* 4. Trigger */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Trigger
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
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
      </section>

      {/* Actions */}
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
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
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
