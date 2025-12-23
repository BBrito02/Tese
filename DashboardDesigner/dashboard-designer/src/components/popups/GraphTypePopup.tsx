import { useState, useMemo } from 'react';
import type { GraphType } from '../../domain/types';
import { GRAPH_TYPE_ICONS } from '../../domain/icons';
import { ShowMeHint } from './ShowMeHint';

export type Props = {
  initialGraphTypes: GraphType[];
  onCancel: () => void;
  onConfirm: (types: GraphType[]) => void;
  multiSelect?: boolean; // NEW PROP
};

export default function GraphTypePopup({
  initialGraphTypes,
  onCancel,
  onConfirm,
  multiSelect = true, // Default to multiple
}: Props) {
  // Selected types
  const [selected, setSelected] = useState<Set<GraphType>>(
    new Set(initialGraphTypes)
  );

  // Track active hover
  const [active, setActive] = useState<GraphType | undefined>(undefined);

  const ALL: GraphType[] = Object.keys(GRAPH_TYPE_ICONS) as GraphType[];

  function toggle(gt: GraphType) {
    if (multiSelect) {
      // Standard Toggle behavior
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(gt) ? next.delete(gt) : next.add(gt);
        return next;
      });
    } else {
      // Radio/Single Select behavior
      setSelected(new Set([gt]));
    }
  }

  const list = useMemo(() => Array.from(selected), [selected]);
  const canSave = selected.size > 0;

  return (
    <div style={{ display: 'grid', gap: 16, minWidth: 560 }}>
      {/* Title */}
      <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.85 }}>
        {multiSelect ? 'Select Graph Types' : 'Select Graph Type'}
      </div>

      {/* Selection grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8,
        }}
      >
        {ALL.map((gt) => {
          const isChecked = selected.has(gt);
          const isActive = active === gt;

          return (
            <button
              key={gt}
              type="button"
              onClick={() => toggle(gt)}
              // Hover events
              onMouseEnter={() => setActive(gt)}
              onMouseLeave={() => setActive(undefined)}
              aria-pressed={isChecked}
              title={gt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '6px 8px',
                background: isChecked ? '#eef2ff' : '#fff',
                cursor: 'pointer',
                boxShadow: isActive ? '0 0 0 2px #38bdf8' : 'none',
                transition: 'box-shadow 0.1s ease',
                height: 40,
              }}
            >
              {/* Visual Cue: Radio for single, Checkbox for multi */}
              <input
                type={multiSelect ? 'checkbox' : 'radio'}
                readOnly
                checked={isChecked}
                style={{ cursor: 'pointer' }}
              />
              <img
                src={GRAPH_TYPE_ICONS[gt]}
                alt={gt}
                style={{ width: 22, height: 22, objectFit: 'contain' }}
              />
              <span style={{ fontWeight: 600, fontSize: 12 }}>{gt}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Chips (Only show for MultiSelect) */}
      {multiSelect && list.length > 0 ? (
        <div
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 24 }}
        >
          {list.map((gt) => (
            <button
              key={`cur-${gt}`}
              onClick={() => toggle(gt)}
              onMouseEnter={() => setActive(gt)}
              onMouseLeave={() => setActive(undefined)}
              title={`Remove ${gt}`}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 999,
                padding: '2px 8px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <img
                src={GRAPH_TYPE_ICONS[gt]}
                alt=""
                style={{ width: 14, height: 14 }}
              />
              {gt} ✕
            </button>
          ))}
        </div>
      ) : (
        <div style={{ minHeight: 12 }} />
      )}

      {/* --- Show Me panel --- */}
      <div
        style={{
          marginTop: 4,
          padding: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          background: '#f8fafc',
          height: 200,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: '#0f172a',
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span>
            Show me
            {active ? (
              <span style={{ fontWeight: 400, marginLeft: 4 }}>— {active}</span>
            ) : list.length === 1 ? (
              <span style={{ fontWeight: 400, marginLeft: 4 }}>
                — {list[0]} (Selected)
              </span>
            ) : (
              <span style={{ fontWeight: 400, opacity: 0.5, marginLeft: 4 }}>
                (Hover to see requirements)
              </span>
            )}
          </span>
        </div>

        {/* Content container */}
        <div style={{ flex: 1 }}>
          <ShowMeHint
            type={active || (list.length === 1 ? list[0] : undefined)}
          />
        </div>
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
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(list)}
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
          {multiSelect ? 'Apply' : 'Create Perspective'}
        </button>
      </div>
    </div>
  );
}
