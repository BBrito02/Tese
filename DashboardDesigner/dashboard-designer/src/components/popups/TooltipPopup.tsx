import React, { useMemo, useState } from 'react';
import type { DataItem, DataType, GraphType } from '../../domain/types';

export type ExistingTooltip = {
  id: string;
  title: string;
  description?: string;
  data?: Array<string | DataItem>;
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

// Result sent to Editor on Save
export type TooltipSaveSpec = {
  mode: 'existing' | 'new';
  attachTo: { type: 'viz' | 'data'; ref?: string };
  activation: 'hover' | 'click';
  existingId?: string;
  newTooltip?: {
    title: string;
    description?: string;
    data: Array<string | DataItem>;
    graphType?: GraphType | '';
  };
};

const optionLabel = (t: ExistingTooltip) => {
  const name = t.title || '(untitled tooltip)';
  return t.badge ? `${t.badge} – ${name}` : name;
};

export default function TooltipPopup({
  availableData,
  availableTooltips,
  onCancel,
  onSave,
}: Props) {
  const hasExisting = availableTooltips.length > 0;
  const [source, setSource] = useState<'existing' | 'new'>(
    hasExisting ? 'existing' : 'new'
  );

  const [selectedTooltipId, setSelectedTooltipId] = useState<string>('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [dataMode, setDataMode] = useState<'existing' | 'custom'>('existing');
  const [existingRef, setExistingRef] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<DataType>('Other');
  const [customItems, setCustomItems] = useState<DataItem[]>([]);

  // NEW: association + activation
  const [attachTo, setAttachTo] = useState<'viz' | 'data'>('viz');
  const [attachRef, setAttachRef] = useState<string>('');
  const [activation, setActivation] = useState<'hover' | 'click'>('hover');

  const existingNames = useMemo(
    () => availableData.map((v) => (typeof v === 'string' ? v : v.name)),
    [availableData]
  );

  const addCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    if (
      customItems.some((it) => it.name === trimmed && it.dtype === customType)
    )
      return;
    setCustomItems((arr) => arr.concat({ name: trimmed, dtype: customType }));
    setCustomName('');
  };

  // Validation for Save button
  const canSave =
    (source === 'existing'
      ? selectedTooltipId.length > 0
      : true) /* new tooltip always allowed */ &&
    (attachTo === 'viz' || (attachTo === 'data' && attachRef.length > 0));

  const handleSave = () => {
    if (!onSave || !canSave) return;

    const base = {
      attachTo:
        attachTo === 'viz'
          ? { type: 'viz' as const }
          : { type: 'data' as const, ref: attachRef },
      activation,
    };

    if (source === 'existing') {
      onSave({
        mode: 'existing',
        existingId: selectedTooltipId,
        ...base,
      });
      return;
    }

    // Build data payload for a brand-new tooltip
    const chosenData =
      dataMode === 'existing'
        ? existingRef
          ? [existingRef]
          : []
        : customItems;

    onSave({
      mode: 'new',
      ...base,
      newTooltip: {
        title: name || 'Tooltip',
        description,
        data: chosenData,
        graphType: '' as GraphType | '',
      },
    });
  };

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

      {/* New tooltip form */}
      {source === 'new' && (
        <>
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
        </>
      )}

      {/* NEW: Attach to */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={pill}>Attach to</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <input
              type="radio"
              name="tt-attach"
              value="viz"
              checked={attachTo === 'viz'}
              onChange={() => setAttachTo('viz')}
            />
            Entire visualization
          </label>

          <label
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <input
              type="radio"
              name="tt-attach"
              value="data"
              checked={attachTo === 'data'}
              onChange={() => setAttachTo('data')}
            />
            Specific data
          </label>

          {attachTo === 'data' && (
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
                Select data item
              </option>
              {existingNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* NEW: Activation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={pill}>Activation</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
