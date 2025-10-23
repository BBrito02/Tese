import { useEffect, useMemo, useState } from 'react';
import type { NodeKind, GraphType, VisualVariable } from '../../domain/types';
import { VISUAL_VAR_ICONS, GRAPH_TYPE_ICONS } from '../../domain/icons';

type Props = {
  kinds: (NodeKind | 'GraphType' | 'VisualVariable')[];
  onCancel: () => void;
  onSave: (
    payload:
      | { kind: NodeKind; title: string; description?: string }
      | { kind: 'GraphType'; graphTypes: GraphType[] } // ← array here
      | { kind: 'VisualVariable'; variables: VisualVariable[] }
  ) => void;
  initialVisualVars?: VisualVariable[];
  initialGraphTypes?: GraphType[];
};

export default function AddComponentPopup({
  kinds,
  onCancel,
  onSave,
  initialVisualVars = [],
  initialGraphTypes = [],
}: Props) {
  const [kind, setKind] = useState<Props['kinds'][number]>(kinds[0]);

  // sets the new attributes
  const [variables, setVariables] =
    useState<VisualVariable[]>(initialVisualVars);

  const [selectedGraphTypes, setSelectedGraphTypes] = useState<Set<GraphType>>(
    new Set(initialGraphTypes)
  );

  const GRAPH_TYPES = Object.keys(GRAPH_TYPE_ICONS) as GraphType[];

  // DEFAULT node states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const isSpecial = kind === 'GraphType' || kind === 'VisualVariable';

  // Reset unrelated fields when switching "Type"
  useEffect(() => {
    if (kind === 'VisualVariable') {
      setVariables(initialVisualVars);
    }
    if (kind === 'GraphType') {
      setSelectedGraphTypes(new Set(initialGraphTypes));
    }
  }, [kind, initialVisualVars, initialGraphTypes]);

  function toggleVar(v: VisualVariable) {
    setVariables((xs) =>
      xs.includes(v) ? xs.filter((y) => y !== v) : [...xs, v]
    );
  }

  function toggleGraph(gt: GraphType) {
    setSelectedGraphTypes((prev) => {
      const next = new Set(prev);
      next.has(gt) ? next.delete(gt) : next.add(gt);
      return next;
    });
  }

  const canSave =
    kind === 'GraphType'
      ? selectedGraphTypes.size > 0
      : kind === 'VisualVariable'
      ? variables.length > 0
      : title.trim().length > 0;

  function save() {
    if (!canSave) return;
    if (kind === 'GraphType') {
      onSave({ kind, graphTypes: Array.from(selectedGraphTypes) }); // ← send array
      return;
    }
    if (kind === 'VisualVariable') {
      onSave({ kind, variables });
      return;
    }
    onSave({
      kind: kind as NodeKind,
      title: title.trim(),
      description: description || undefined,
    });
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Type */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 6,
          }}
        >
          Type
        </label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as any)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
          }}
        >
          {kinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {/* GraphType form */}
      {kind === 'GraphType' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.8 }}>
            Graph type
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 8,
            }}
          >
            {GRAPH_TYPES.map((gt) => {
              const checked = selectedGraphTypes.has(gt);
              return (
                <label
                  key={gt}
                  title={gt}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '6px 8px',
                    background: checked ? '#eef2ff' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGraph(gt)}
                  />
                  <img
                    src={GRAPH_TYPE_ICONS[gt]}
                    alt={gt}
                    style={{ width: 22, height: 22, objectFit: 'contain' }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{gt}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* VisualVariable form */}
      {kind === 'VisualVariable' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.8 }}>
            Visual variables
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 8,
            }}
          >
            {(['Size', 'Shape', 'Color'] as VisualVariable[]).map((vv) => {
              const selected = variables.includes(vv);
              return (
                <button
                  key={vv}
                  type="button"
                  onClick={() => toggleVar(vv)}
                  aria-pressed={selected}
                  title={vv}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '6px 8px',
                    background: selected ? '#eef2ff' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <input type="checkbox" readOnly checked={selected} />
                  <img
                    src={VISUAL_VAR_ICONS[vv]}
                    alt={vv}
                    style={{ width: 22, height: 22, objectFit: 'contain' }}
                  />
                  <span
                    style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.1 }}
                  >
                    {vv}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Default (non-special) fields */}
      {!isSpecial && (
        <>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                opacity: 0.8,
                marginBottom: 6,
              }}
            >
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Component title"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
              }}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 4,
        }}
      >
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
          onClick={save}
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
          Save
        </button>
      </div>
    </div>
  );
}
