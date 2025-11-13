import { useEffect, useMemo, useRef, useState } from 'react';
import type { InteractionType, InteractionResult } from '../../domain/types';

type TargetOption = {
  id: string;
  title: string;
  kind: string;
  badge?: string;
};

type SourceType = 'component' | 'data';

type DataAttrOption = {
  ref: string; // internal reference (e.g., attribute name)
  label: string; // label shown to the user
};

type Props = {
  // existing props
  initialName?: string;
  initialType?: InteractionType;
  initialResult?: InteractionResult;
  initialTargets?: string[];
  availableTargets: TargetOption[];

  // NEW: data attributes from the source component
  dataAttributes?: DataAttrOption[];

  onCancel: () => void;
  onSave: (payload: {
    name: string;
    trigger: InteractionType;
    result: InteractionResult;
    targets: string[];
    sourceType: SourceType;
    sourceDataRef?: string; // only when sourceType === 'data'
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
  initialType = 'click',
  initialResult = 'filter',
  initialTargets = [],
  availableTargets,
  dataAttributes = [],
  onCancel,
  onSave,
}: Props) {
  const [name, setName] = useState(initialName);
  const [trigger, setTrigger] = useState<InteractionType>(initialType);
  const [result, setResult] = useState<InteractionResult>(initialResult);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialTargets)
  );

  // ---------- Source selection (component vs data attribute) ----------

  const hasDataAttrs = dataAttributes.length > 0;

  const [sourceType, setSourceType] = useState<SourceType>('component');

  const [sourceDataRef, setSourceDataRef] = useState<string>(
    dataAttributes[0]?.ref ?? ''
  );

  // Keep sourceDataRef in range if dataAttributes change
  useEffect(() => {
    if (!hasDataAttrs) {
      setSourceType('component');
      setSourceDataRef('');
      return;
    }
    if (!dataAttributes.some((a) => a.ref === sourceDataRef)) {
      setSourceDataRef(dataAttributes[0]?.ref ?? '');
    }
  }, [hasDataAttrs, dataAttributes, sourceDataRef]);

  // ---------- Targets (multi-select) ----------

  const sortedTargets = useMemo(
    () =>
      availableTargets.slice().sort((a, b) => a.title.localeCompare(b.title)),
    [availableTargets]
  );

  const canSave =
    name.trim().length > 0 &&
    selected.size > 0 &&
    (sourceType === 'component' || !!sourceDataRef);

  // Multi-select dropdown state
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
    .filter(Boolean) as TargetOption[];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 360,
      }}
    >
      {/* Name */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Name
        </div>
        <input
          type="text"
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
      </section>

      {/* Trigger */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Trigger
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['hover', 'click'] as InteractionType[]).map((t) => {
            const label = t.charAt(0).toUpperCase() + t.slice(1); // Hover / Click
            return (
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
                {label}
              </label>
            );
          })}
        </div>
      </section>

      {/* Source: component vs data attribute */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Source
        </div>

        {!hasDataAttrs && (
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            This component has no data attributes. The source will be the
            component itself.
          </div>
        )}

        {hasDataAttrs && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="int-source-kind"
                  value="component"
                  checked={sourceType === 'component'}
                  onChange={() => setSourceType('component')}
                />
                Component
              </label>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="int-source-kind"
                  value="data"
                  checked={sourceType === 'data'}
                  onChange={() => setSourceType('data')}
                />
                Data attribute
              </label>
            </div>

            {sourceType === 'data' && (
              <select
                value={sourceDataRef}
                onChange={(e) => setSourceDataRef(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  fontSize: 13,
                }}
              >
                {dataAttributes.map((a) => (
                  <option key={a.ref} value={a.ref}>
                    {a.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </section>

      {/* Result */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Result
        </div>
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
          <option value="filter">Filtering</option>
          <option value="highlight">Highlighting</option>
          <option value="link">Dashboard Link</option>
        </select>
      </section>

      {/* Affected components (multi-select dropdown + chips) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Affected
        </div>

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
            {selected.size > 0
              ? `${selected.size} selected`
              : 'Select components'}
            <span>▾</span>
          </button>

          {/* Dropdown menu */}
          {open && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                maxHeight: 220,
                overflow: 'auto',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 8px 20px rgba(15,23,42,0.18)',
                padding: 4,
                zIndex: 20,
              }}
            >
              {sortedTargets.map((t) => {
                const checked = selected.has(t.id);
                const displayTitle = `${t.badge ? t.badge + ' ' : ''}${
                  t.title
                }`;
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTarget(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleTarget(t.id);
                      }
                    }}
                    tabIndex={0}
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
                    {/* visual checkbox */}
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        border: '1px solid #94a3b8',
                        background: checked ? '#4f46e5' : '#fff',
                      }}
                    />
                    <div style={{ fontSize: 13, color: '#0f172a' }}>
                      {displayTitle}{' '}
                      <span style={{ color: '#6b7280' }}>· {t.kind}</span>
                    </div>
                  </div>
                );
              })}

              {sortedTargets.length === 0 && (
                <div
                  style={{
                    padding: 8,
                    fontSize: 12,
                    color: '#9ca3af',
                    textAlign: 'center',
                  }}
                >
                  No components available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected chips */}
        {selectedTargets.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selectedTargets.map((t) => {
              const displayTitle = `${t.badge ? t.badge + ' ' : ''}${t.title}`;
              return (
                <span key={t.id} style={pill}>
                  {displayTitle}
                  <button
                    type="button"
                    onClick={() => removeTarget(t.id)}
                    style={{
                      marginLeft: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                    aria-label={`Remove ${displayTitle}`}
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </section>

      {/* Actions */}
      <section
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <button
          type="button"
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
          type="button"
          onClick={() =>
            onSave({
              name: name.trim(),
              trigger,
              result,
              targets: Array.from(selected),
              sourceType,
              ...(sourceType === 'data' && sourceDataRef
                ? { sourceDataRef }
                : {}),
            })
          }
          disabled={!canSave}
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
      </section>
    </div>
  );
}
