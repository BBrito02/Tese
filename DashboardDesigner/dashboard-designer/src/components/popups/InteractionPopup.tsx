import { useEffect, useMemo, useRef, useState } from 'react';
import type { InteractionType, InteractionResult } from '../../domain/types';

type Target = { id: string; title: string; kind: string };

type Props = {
  initialName?: string;
  initialType?: InteractionType;
  initialResult?: InteractionResult;
  initialTargets?: string[];
  availableTargets: Target[];
  onCancel: () => void;
  onSave: (payload: {
    name: string;
    trigger: InteractionType;
    result: InteractionResult;
    targets: string[];
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

export default function InteractionPopup({
  initialName = '',
  initialType = 'Click',
  initialResult = 'filter',
  initialTargets = [],
  availableTargets,
  onCancel,
  onSave,
}: Props) {
  const [name, setName] = useState(initialName);
  const [trigger, setTrigger] = useState<InteractionType>(initialType);
  const [result, setResult] = useState<InteractionResult>(initialResult);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialTargets)
  );

  const sortedTargets = useMemo(
    () =>
      availableTargets.slice().sort((a, b) => a.title.localeCompare(b.title)),
    [availableTargets]
  );

  const canSave = name.trim().length > 0 && selected.size > 0;

  // ---------- Multi-select dropdown state ----------
  const [open, setOpen] = useState(false);
  const ddRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ddRef.current) return;
      if (!ddRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const toggleTarget = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const removeTarget = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const selectedArray = Array.from(selected);
  const selectedTargets = selectedArray
    .map((id) => sortedTargets.find((t) => t.id === id))
    .filter(Boolean) as Target[];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
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
          placeholder="e.g., Highlight related charts"
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            fontWeight: 700,
          }}
        />
      </div>

      {/* Trigger */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={pill}>Trigger</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['Hover', 'Click'] as InteractionType[]).map((t) => (
            <label
              key={t}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="int-trigger"
                value={t}
                checked={trigger === t}
                onChange={() => setTrigger(t)}
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      {/* Result */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div style={pill}>Result</div>
        <select
          value={result}
          onChange={(e) => setResult(e.target.value as InteractionResult)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            fontWeight: 700,
          }}
        >
          <option value="filtering">Filtering</option>
          <option value="highlighting">Highlighting</option>
          <option value="dashboard">Dashboard</option>
          <option value="link">Link</option>
        </select>
      </div>

      {/* Affected components (multi-select dropdown + chips) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <div style={pill}>Affected</div>

        <div style={{ display: 'grid', gap: 8 }}>
          {/* Dropdown trigger */}
          <div ref={ddRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                background: '#fff',
                fontWeight: 700,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
              title="Select affected components"
            >
              <span>
                {selected.size > 0
                  ? `${selected.size} selected`
                  : 'Select components'}
              </span>
              <span style={{ opacity: 0.6 }}>▾</span>
            </button>

            {/* Dropdown menu */}
            {open && (
              <div
                style={{
                  position: 'absolute',
                  zIndex: 10000,
                  marginTop: 6,
                  left: 0,
                  right: 0,
                  maxHeight: 260,
                  overflow: 'auto',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  padding: 6,
                }}
              >
                {sortedTargets.map((t) => {
                  const checked = selected.has(t.id);
                  return (
                    <div
                      key={t.id}
                      role="checkbox"
                      aria-checked={checked}
                      tabIndex={0}
                      title={`${t.title} (${t.kind})`}
                      onClick={() => toggleTarget(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          toggleTarget(t.id);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        margin: 4,
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        background: checked ? '#eef2ff' : 'transparent',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {/* purely visual checkbox; click handled by container */}
                      <input
                        type="checkbox"
                        readOnly
                        checked={checked}
                        style={{ pointerEvents: 'none' }}
                      />
                      <span style={{ fontWeight: 700, fontSize: 12 }}>
                        {t.title}{' '}
                        <span style={{ opacity: 0.6 }}>· {t.kind}</span>
                      </span>
                    </div>
                  );
                })}

                {sortedTargets.length === 0 && (
                  <div style={{ padding: 10, opacity: 0.7, fontSize: 12 }}>
                    No components available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected chips */}
          {selectedTargets.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {selectedTargets.map((t) => (
                <span
                  key={t.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: '#e2e8f0',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                  title={`${t.title} (${t.kind})`}
                >
                  {t.title}
                  <button
                    onClick={() => removeTarget(t.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                    aria-label={`Remove ${t.title}`}
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
          disabled={!canSave}
          onClick={() =>
            onSave({
              name: name.trim(),
              trigger,
              result,
              targets: Array.from(selected),
            })
          }
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #38bdf8',
            background: canSave ? '#38bdf8' : '#a3d9ef',
            color: '#fff',
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
          title={canSave ? 'Save interaction' : 'Complete the form'}
        >
          Save
        </button>
      </div>
    </div>
  );
}
