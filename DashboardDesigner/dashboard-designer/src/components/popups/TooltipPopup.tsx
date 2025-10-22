import React, { useMemo, useState } from 'react';
import type { DataItem } from '../../domain/types';

export type ExistingTooltip = {
  id: string;
  title: string;
  badge?: string;
};

type Props = {
  availableData: Array<string | DataItem>;
  availableTooltips: ExistingTooltip[];
  onCancel: () => void;
  onSave?: (payload: TooltipSaveSpec) => void;
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

export type TooltipSaveSpec = {
  mode: 'existing' | 'new';
  activation: 'hover' | 'click';
  attachRef: string; // REQUIRED: label of the data attribute
  existingId?: string;
  newTooltip?: { title: string };
};

const optionLabel = (t: ExistingTooltip) =>
  t.badge
    ? `${t.badge} – ${t.title || '(untitled tooltip)'}`
    : t.title || '(untitled tooltip)';

export default function TooltipPopup({
  availableData,
  availableTooltips,
  onCancel,
  onSave,
}: Props) {
  const hasExisting = availableTooltips.length > 0;
  const [source, setSource] = useState<'existing' | 'new'>(
    hasExisting ? 'new' : 'new'
  );

  const [selectedTooltipId, setSelectedTooltipId] = useState('');
  const [name, setName] = useState('');
  const [attachRef, setAttachRef] = useState(''); // chosen data attribute
  const [activation, setActivation] = useState<'hover' | 'click'>('hover');

  const existingNames = useMemo(
    () => availableData.map((v) => (typeof v === 'string' ? v : v.name)),
    [availableData]
  );

  const canSave =
    attachRef.length > 0 &&
    (source === 'existing' ? selectedTooltipId.length > 0 : true);

  const handleSave = () => {
    if (!onSave || !canSave) return;
    if (source === 'existing') {
      onSave({
        mode: 'existing',
        existingId: selectedTooltipId,
        attachRef,
        activation,
      });
    } else {
      onSave({
        mode: 'new',
        attachRef,
        activation,
        newTooltip: { title: name || 'Tooltip' },
      });
    }
  };

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Tooltip source */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={pill}>Tooltip</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: hasExisting ? 1 : 0.5,
            }}
          >
            <input
              type="radio"
              name="tt-source"
              value="existing"
              disabled={!hasExisting}
              checked={source === 'existing'}
              onChange={() => hasExisting && setSource('existing')}
            />
            Use existing tooltip
          </label>

          <label
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <input
              type="radio"
              name="tt-source"
              value="new"
              checked={source === 'new'}
              onChange={() => setSource('new')}
            />
            Create new tooltip
          </label>
        </div>
      </div>

      {/* Existing tooltip selector */}
      {source === 'existing' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <div style={pill}>Select</div>
          <select
            value={selectedTooltipId}
            onChange={(e) => setSelectedTooltipId(e.target.value)}
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
              Choose a tooltip
            </option>
            {availableTooltips.map((t) => (
              <option key={t.id} value={t.id}>
                {optionLabel(t)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* New tooltip name */}
      {source === 'new' && (
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
      )}

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
          {existingNames.map((n) => (
            <option key={slugify(n)} value={slugify(n)}>
              {n}
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
