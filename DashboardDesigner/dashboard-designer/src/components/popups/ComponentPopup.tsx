import { useEffect, useState } from 'react';
import type { NodeKind, GraphType, VisualVariable } from '../../domain/types';
import VisualVariablePopup from '../popups/VisualVariablePopup';
import GraphTypePopup from './GraphTypePopup';

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

  const [variables, setVariables] =
    useState<VisualVariable[]>(initialVisualVars);

  const [selectedGraphTypes, setSelectedGraphTypes] = useState<Set<GraphType>>(
    new Set(initialGraphTypes)
  );

  const [title, setTitle] = useState('');

  const isSpecial = kind === 'GraphType' || kind === 'VisualVariable';

  useEffect(() => {
    if (kind === 'VisualVariable') setVariables(initialVisualVars);
    if (kind === 'GraphType') setSelectedGraphTypes(new Set(initialGraphTypes));
  }, [kind, initialVisualVars, initialGraphTypes]);

  const canSave =
    kind === 'GraphType'
      ? selectedGraphTypes.size > 0
      : kind === 'VisualVariable'
      ? variables.length > 0
      : title.trim().length > 0;

  function save() {
    if (!canSave) return;
    if (kind === 'GraphType') {
      onSave({ kind, graphTypes: Array.from(selectedGraphTypes) });
      return;
    }
    if (kind === 'VisualVariable') {
      onSave({ kind, variables });
      return;
    }
    onSave({ kind: kind as NodeKind, title: title.trim() });
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

      {/* Delegate to dedicated popups */}
      {kind === 'GraphType' && (
        <GraphTypePopup
          initialGraphTypes={initialGraphTypes}
          onCancel={onCancel}
          onConfirm={(graphTypes) => onSave({ kind: 'GraphType', graphTypes })}
        />
      )}

      {kind === 'VisualVariable' && (
        <VisualVariablePopup
          initial={initialVisualVars}
          onCancel={onCancel}
          onSave={(nextVars) =>
            onSave({ kind: 'VisualVariable', variables: nextVars })
          }
        />
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

          {/* Actions only for non-special */}
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
        </>
      )}
    </div>
  );
}
