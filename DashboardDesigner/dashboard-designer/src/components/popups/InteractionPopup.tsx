// src/components/popups/InteractionPopup.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  InteractionType,
  InteractionResult,
  NodeKind,
} from '../../domain/types';

type SourceType = 'component' | 'data';

type DataAttrOption = {
  ref: string;
  label: string;
};

type TargetOption = {
  id: string;
  title: string;
  kind: string;
  badge?: string;
  parentId?: string;
  dataAttributes?: DataAttrOption[];
};

type TargetDetail = {
  targetId: string;
  targetType: 'component' | 'data';
  targetDataRef?: string;
};

type Props = {
  sourceKind: NodeKind;
  initialName?: string;
  initialType?: InteractionType;
  initialResult?: InteractionResult;
  initialTargets?: string[];
  availableTargets: TargetOption[];
  dataAttributes?: DataAttrOption[];
  onCancel: () => void;
  onSave: (payload: {
    name: string;
    trigger: InteractionType;
    result: InteractionResult;
    targets: string[];
    sourceType: SourceType;
    sourceDataRef?: string;
    targetDetails: TargetDetail[];
    newDashboardName?: string;
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

const ALLOWED_RESULTS: Partial<Record<NodeKind, InteractionResult[]>> = {
  Legend: ['highlight', 'filter'],
  Button: ['dashboard'],
  Filter: ['filter'],
  Visualization: ['filter', 'highlight', 'dashboard', 'link'],
  Graph: ['filter', 'highlight', 'dashboard', 'link'],
  Tooltip: ['filter', 'highlight', 'dashboard', 'link'],
  Parameter: ['filter', 'highlight', 'dashboard', 'link'],
  DataAction: ['filter', 'highlight'],
  Placeholder: [],
};

const DATA_DELIM = '::data::';
const makeDataKey = (targetId: string, ref: string) =>
  `${targetId}${DATA_DELIM}${ref}`;
const isDataKey = (key: string) => key.includes(DATA_DELIM);

export default function InteractionPopup({
  sourceKind,
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

  // --- CHANGED: Renamed variable to match usage ---
  const [newDashName, setNewDashName] = useState('');
  const isDashboard = result === 'dashboard';

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialTargets)
  );

  const hasSourceDataAttrs = dataAttributes.length > 0;
  const [sourceType, setSourceType] = useState<SourceType>('component');
  const [sourceDataRef, setSourceDataRef] = useState<string>(
    dataAttributes[0]?.ref ?? ''
  );

  const allowedResults = useMemo(() => {
    return (
      ALLOWED_RESULTS[sourceKind] ??
      (['filter', 'highlight', 'dashboard', 'link'] as InteractionResult[])
    );
  }, [sourceKind]);

  useEffect(() => {
    if (allowedResults.length > 0 && !allowedResults.includes(result)) {
      setResult(allowedResults[0]);
    }
  }, [allowedResults, result]);

  useEffect(() => {
    if (!hasSourceDataAttrs) {
      setSourceType('component');
      setSourceDataRef('');
      return;
    }
    if (!dataAttributes.some((a) => a.ref === sourceDataRef)) {
      setSourceDataRef(dataAttributes[0]?.ref ?? '');
    }
  }, [hasSourceDataAttrs, dataAttributes, sourceDataRef]);

  const validTargets = useMemo(() => {
    return availableTargets.filter((t) => t.kind !== 'Graph');
  }, [availableTargets]);

  const targetById = useMemo(() => {
    const m = new Map<string, TargetOption>();
    for (const t of validTargets) m.set(t.id, t);
    return m;
  }, [validTargets]);

  const childrenByParent = useMemo(() => {
    const m = new Map<string | null, TargetOption[]>();
    for (const t of validTargets) {
      const hasParentInList = t.parentId && targetById.has(t.parentId);
      const parentKey: string | null = hasParentInList ? t.parentId! : null;
      const arr = m.get(parentKey) ?? [];
      arr.push(t);
      m.set(parentKey, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.title.localeCompare(b.title));
    }
    return m;
  }, [validTargets, targetById]);

  const rootTargets = childrenByParent.get(null) ?? [];

  // --- FIXED: Now uses 'isDashboard' which is correctly defined ---
  const canSave =
    name.trim().length > 0 &&
    (isDashboard ? newDashName.trim().length > 0 : selected.size > 0) &&
    (sourceType === 'component' || !!sourceDataRef);

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

  const toggleKey = (key: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const removeKey = (key: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(key);
      return n;
    });
  };

  const selectedArray = Array.from(selected);

  const selectedEntries = useMemo(() => {
    const entries: { key: string; label: string }[] = [];
    for (const key of selectedArray) {
      if (isDataKey(key)) {
        const [targetId, dataRef] = key.split(DATA_DELIM);
        const t = targetById.get(targetId);
        const attr =
          t?.dataAttributes?.find((a) => a.ref === dataRef) ?? undefined;
        const badgePrefix = t?.badge ? t.badge + ' ' : '';
        const title = t?.title ?? targetId;
        const attrLabel = attr?.label ?? dataRef;
        entries.push({
          key,
          label: `${badgePrefix}${title} · ${attrLabel}`,
        });
      } else {
        const t = targetById.get(key);
        if (t) {
          const badgePrefix = t?.badge ? t.badge + ' ' : '';
          const title = t?.title ?? key;
          entries.push({
            key,
            label: `${badgePrefix}${title}`,
          });
        }
      }
    }
    return entries;
  }, [selectedArray, targetById]);

  const renderTargetRow = (t: TargetOption, depth: number) => {
    const compChecked = selected.has(t.id);
    const badgePrefix = t.badge ? t.badge + ' ' : '';
    const compLabel = `${badgePrefix}${t.title}`;
    const indent = depth * 18;
    const children = childrenByParent.get(t.id) ?? [];

    return (
      <div key={t.id} style={{ marginBottom: 2 }}>
        <div
          onClick={() => toggleKey(t.id)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              toggleKey(t.id);
            }
          }}
          tabIndex={0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            margin: 4,
            marginLeft: indent,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            background: compChecked ? '#eef2ff' : 'transparent',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              border: '1px solid #94a3b8',
              background: compChecked ? '#4f46e5' : '#fff',
            }}
          />
          <div style={{ fontSize: 13, color: '#0f172a' }}>
            {compLabel} <span style={{ color: '#6b7280' }}>· {t.kind}</span>
          </div>
        </div>
        {t.dataAttributes?.length ? (
          <div style={{ marginLeft: indent + 24, marginTop: 2 }}>
            {t.dataAttributes.map((attr) => {
              const key = makeDataKey(t.id, attr.ref);
              const checked = selected.has(key);
              return (
                <div
                  key={key}
                  onClick={() => toggleKey(key)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleKey(key);
                    }
                  }}
                  tabIndex={0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    margin: '2px 4px',
                    borderRadius: 8,
                    border: '1px dashed #e5e7eb',
                    background: checked ? '#ecfeff' : 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      border: '1px solid #94a3b8',
                      background: checked ? '#06b6d4' : '#fff',
                    }}
                  />
                  <div style={{ fontSize: 12, color: '#0f172a' }}>
                    {attr.label}
                    <span style={{ color: '#6b7280' }}> · data attribute</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        {children.length > 0 && (
          <div>
            {children.map((child) => renderTargetRow(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 360,
      }}
    >
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

      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Trigger
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['hover', 'click'] as InteractionType[]).map((t) => {
            const label = t.charAt(0).toUpperCase() + t.slice(1);
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

      <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
          Source
        </div>
        {!hasSourceDataAttrs && (
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            This component has no data attributes. The source will be the
            component itself.
          </div>
        )}
        {hasSourceDataAttrs && (
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
          {allowedResults.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </section>

      {/* --- CHANGED: Use isDashboard for condition --- */}
      {isDashboard ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            New Dashboard Name
          </div>
          <input
            type="text"
            value={newDashName}
            onChange={(e) => setNewDashName(e.target.value)}
            placeholder="e.g., Sales Detail"
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              fontWeight: 700,
            }}
          />
        </section>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            Affected
          </div>
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
                : 'Select components, nested components, or data attributes'}
              <span>▾</span>
            </button>
            {open && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  maxHeight: 260,
                  overflow: 'auto',
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 8px 20px rgba(15,23,42,0.18)',
                  padding: 4,
                  zIndex: 20,
                }}
              >
                {rootTargets.map((t) => renderTargetRow(t, 0))}
                {validTargets.length === 0 && (
                  <div
                    style={{
                      padding: 8,
                      fontSize: 12,
                      color: '#9ca3af',
                      textAlign: 'center',
                    }}
                  >
                    No connectable components available
                  </div>
                )}
              </div>
            )}
          </div>
          {selectedEntries.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedEntries.map((s) => (
                <span key={s.key} style={pill}>
                  {s.label}
                  <button
                    type="button"
                    onClick={() => removeKey(s.key)}
                    style={{
                      marginLeft: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                    aria-label={`Remove ${s.label}`}
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>
      )}

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
          onClick={() => {
            const selections = Array.from(selected);
            const targetsSet = new Set<string>();
            const targetDetails: TargetDetail[] = [];

            // Only parse selections if NOT dashboard
            if (!isDashboard) {
              for (const key of selections) {
                if (isDataKey(key)) {
                  const [targetId, dataRef] = key.split(DATA_DELIM);
                  targetsSet.add(targetId);
                  targetDetails.push({
                    targetId,
                    targetType: 'data',
                    targetDataRef: dataRef,
                  });
                } else {
                  targetsSet.add(key);
                  targetDetails.push({
                    targetId: key,
                    targetType: 'component',
                  });
                }
              }
            }

            onSave({
              name: name.trim(),
              trigger,
              result,
              targets: Array.from(targetsSet),
              sourceType,
              ...(sourceType === 'data' && sourceDataRef
                ? { sourceDataRef }
                : {}),
              targetDetails,
              newDashboardName: isDashboard ? newDashName.trim() : undefined,
            });
          }}
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
