import React, { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import type { DataItem } from '../../domain/types';

type Props = {
  initial: DataItem[];
  onCancel: () => void;
  onSave: (items: DataItem[]) => void;
  initialSelectedIndex?: number;
};

const pill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  borderRadius: 999,
  background: '#e2e8f0',
  color: '#0f172a',
  fontWeight: 700,
  cursor: 'pointer',
  userSelect: 'none',
};

const labelCell: React.CSSProperties = {
  width: 110,
  height: 36,
  lineHeight: '36px',
  borderRadius: 18,
  background: '#cbd5e1',
  color: '#0f172a',
  textAlign: 'center',
  fontWeight: 800,
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

const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '120px minmax(0, 1fr)',
  gap: 12,
  alignItems: 'center',
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

export default function DataPopup({
  initial,
  onCancel,
  onSave,
  initialSelectedIndex,
}: Props) {
  // Items will now always have an ID from the node data
  const [items, setItems] = useState<DataItem[]>(initial ?? []);

  const [editingIndex, setEditingIndex] = useState<number | null>(
    typeof initialSelectedIndex === 'number' && initialSelectedIndex >= 0
      ? initialSelectedIndex
      : null
  );

  const [name, setName] = useState(
    typeof initialSelectedIndex === 'number' && initial?.[initialSelectedIndex]
      ? initial[initialSelectedIndex].name
      : ''
  );
  const [dtype, setDtype] = useState<DataItem['dtype']>(
    typeof initialSelectedIndex === 'number' && initial?.[initialSelectedIndex]
      ? initial[initialSelectedIndex].dtype
      : 'Other'
  );

  const names = useMemo(() => {
    const set = new Set<string>();
    items.forEach((d, i) => {
      // Don't count the item currently being edited against itself
      if (i !== editingIndex) {
        set.add(norm(d.name));
      }
    });
    return set;
  }, [items, editingIndex]);

  const nameTrim = name.trim();
  const isDuplicate = nameTrim.length > 0 && names.has(norm(nameTrim));
  const isNameEmpty = nameTrim.length === 0;
  const canSubmit = !isNameEmpty && !isDuplicate;

  function handleSubmit() {
    if (!canSubmit) return;

    if (editingIndex !== null) {
      // Update existing: Keep the stable ID, update name/dtype
      setItems((prev) =>
        prev.map((item, i) =>
          i === editingIndex ? { ...item, name: nameTrim, dtype } : item
        )
      );
      setEditingIndex(null);
    } else {
      // Add new: Generate a new unique ID
      setItems((prev) => prev.concat({ id: nanoid(), name: nameTrim, dtype }));
    }
    setName('');
    setDtype('Other');
  }

  function startEdit(i: number) {
    if (editingIndex === i) {
      cancelEdit();
      return;
    }
    const item = items[i];
    setName(item.name);
    setDtype(item.dtype);
    setEditingIndex(i);
  }

  function cancelEdit() {
    setName('');
    setDtype('Other');
    setEditingIndex(null);
  }

  function removeAt(i: number) {
    setItems((xs) => xs.filter((_, idx) => idx !== i));
    if (editingIndex === i) {
      cancelEdit();
    } else if (editingIndex !== null && i < editingIndex) {
      setEditingIndex(editingIndex - 1);
    }
  }

  function handleSave() {
    // We no longer need to pass a "renames" map because the IDs are stable.
    // The parent component just replaces the data array.
    onSave(items);
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ ...row }}>
        <div style={labelCell}>Name</div>
        <div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (canSubmit) handleSubmit();
              }
            }}
            placeholder="e.g., Country"
            autoFocus
            style={{
              ...field,
              borderColor: isDuplicate ? '#ef4444' : '#e5e7eb',
            }}
          />
          {isDuplicate && (
            <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
              Name already exists.
            </div>
          )}
        </div>
      </div>

      <div style={{ ...row }}>
        <div style={labelCell}>Type</div>
        <select
          value={dtype}
          onChange={(e) => setDtype(e.target.value as DataItem['dtype'])}
          style={field}
        >
          <option>Binary</option>
          <option>Continuous</option>
          <option>Discrete</option>
          <option>Other</option>
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        {editingIndex !== null && (
          <button
            onClick={cancelEdit}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid #cbd5e1',
              background: '#f1f5f9',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid #7cc1d1',
            background: canSubmit ? '#63b3c3' : '#b8dbe3',
            color: '#fff',
            fontWeight: 800,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            minWidth: 120,
          }}
        >
          {editingIndex !== null ? 'Update' : 'Add'}
        </button>
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
          Current data <span style={{ opacity: 0.5 }}>(Click to edit)</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {items.map((d, i) => (
            <span
              // Use the stable ID as the key
              key={d.id}
              style={{
                ...pill,
                border:
                  editingIndex === i
                    ? '2px solid #38bdf8'
                    : '2px solid transparent',
                background: editingIndex === i ? '#fff' : pill.background,
              }}
              onClick={() => startEdit(i)}
            >
              {d.name} · {d.dtype}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                style={{
                  marginLeft: 6,
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
      </div>

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
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: '#38bdf8',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
