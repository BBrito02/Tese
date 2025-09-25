// src/components/popups/AddComponentPopup.tsx
import React, { useState } from 'react';
import type { NodeKind } from '../../domain/types';

type Props = {
  kinds: NodeKind[];
  onCancel: () => void;
  onSave: (payload: {
    kind: NodeKind;
    title: string;
    description?: string;
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

const field: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  background: '#fff',
  fontWeight: 700,
  width: '100%',
  boxSizing: 'border-box',
};

export default function AddComponentPopup({ kinds, onCancel, onSave }: Props) {
  const [kind, setKind] = useState<NodeKind | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const canSave = !!kind && title.trim().length > 0;

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Type */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={pill}>Type</div>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as NodeKind)}
          style={field}
        >
          <option value="">Select an Item</option>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

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
          placeholder="Enter Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={field}
        />
      </div>

      {/* Description (optional) */}
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
          placeholder="Enter Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ ...field, resize: 'vertical' as const }}
        />
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
          onClick={() =>
            onSave({
              kind: kind as NodeKind,
              title: title.trim(),
              description: description.trim() || undefined,
            })
          }
          disabled={!canSave}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #93c5fd',
            background: canSave ? '#93c5fd' : '#cbd5e1',
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
