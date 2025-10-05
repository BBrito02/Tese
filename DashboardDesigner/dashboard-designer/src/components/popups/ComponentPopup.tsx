import React, { useMemo, useState } from 'react';
import type { NodeKind, GraphType, VisualVariable } from '../../domain/types';

type Props = {
  kinds: (NodeKind | 'GraphType' | 'VisualVariable')[];
  onCancel: () => void;
  onSave: (
    payload:
      | { kind: NodeKind; title: string; description?: string }
      | { kind: 'GraphType'; graphType: GraphType }
      | { kind: 'VisualVariable'; variables: VisualVariable[] }
  ) => void;
};

export default function AddComponentPopup({ kinds, onCancel, onSave }: Props) {
  const [kind, setKind] = useState<Props['kinds'][number]>(kinds[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // specials state
  const [graphType, setGraphType] = useState<GraphType>('Line');
  const [vSize, setVSize] = useState(false);
  const [vShape, setVShape] = useState(false);
  const [vColor, setVColor] = useState(true);

  const isSpecial = kind === 'GraphType' || kind === 'VisualVariable';

  const canSave = useMemo(() => {
    if (kind === 'GraphType') return Boolean(graphType);
    if (kind === 'VisualVariable') return vSize || vShape || vColor;
    return title.trim().length > 0;
  }, [kind, title, graphType, vSize, vShape, vColor]);

  const save = () => {
    if (!canSave) return;
    if (kind === 'GraphType') {
      onSave({ kind, graphType });
    } else if (kind === 'VisualVariable') {
      const vars: VisualVariable[] = [
        ...(vSize ? (['Size'] as const) : []),
        ...(vShape ? (['Shape'] as const) : []),
        ...(vColor ? (['Color'] as const) : []),
      ];
      onSave({ kind, variables: vars });
    } else {
      onSave({
        kind,
        title: title.trim(),
        description: description.trim() || undefined,
      });
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Kind selector */}
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

      {/* Graph Type form */}
      {kind === 'GraphType' && (
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              opacity: 0.8,
              marginBottom: 6,
            }}
          >
            Graph type
          </label>
          <select
            value={graphType}
            onChange={(e) => setGraphType(e.target.value as GraphType)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
            }}
          >
            {[
              'Dispersion',
              'Line',
              'MultipleLines',
              'Area',
              'Bars',
              'StackedBars',
              'Stacked100',
              'Gantt',
              'Dots',
              'Map',
              'Choropleth',
              'Hexbin',
              'Text',
              'Table',
              'Clock',
            ].map((gt) => (
              <option key={gt} value={gt}>
                {gt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Visual Variable form */}
      {kind === 'VisualVariable' && (
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            Visual variables
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <label
              style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
            >
              <input
                type="checkbox"
                checked={vSize}
                onChange={(e) => setVSize(e.target.checked)}
              />{' '}
              Size
            </label>
            <label
              style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
            >
              <input
                type="checkbox"
                checked={vShape}
                onChange={(e) => setVShape(e.target.checked)}
              />{' '}
              Shape
            </label>
            <label
              style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
            >
              <input
                type="checkbox"
                checked={vColor}
                onChange={(e) => setVColor(e.target.checked)}
              />{' '}
              Color
            </label>
          </div>
        </div>
      )}

      {/* Default node form (hidden for specials) */}
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
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                opacity: 0.8,
                marginBottom: 6,
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                resize: 'vertical',
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
