import { useState, useMemo } from 'react';
import type { Review } from '../../domain/types';
import { SectionTitle, NameField } from '../menus/sections';
import { LuCheck, LuTrash2, LuPencil, LuX, LuSave } from 'react-icons/lu';

/*function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        fontSize: 10,
        borderRadius: 999,
        background: '#f1f5f9',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
      }}
    >
      {children}
    </span>
  );
}*/

function PriorityPill({ level }: { level: Review['priority'] }) {
  const norm = String(level || '').toLowerCase();
  const styles =
    norm === 'high'
      ? { bg: '#fef2f2', br: '#fecaca', fg: '#991b1b' }
      : norm === 'medium'
      ? { bg: '#fffbeb', br: '#fde68a', fg: '#92400e' }
      : { bg: '#ecfdf5', br: '#a7f3d0', fg: '#065f46' };

  return (
    <span
      title={`Priority: ${level}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 999,
        background: styles.bg,
        border: `1px solid ${styles.br}`,
        color: styles.fg,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}
    >
      {level}
    </span>
  );
}

function CategoryPill({ category }: { category: Review['category'] | string }) {
  const norm = String(category || '').toLowerCase();
  const styles =
    norm === 'design'
      ? { bg: '#eff6ff', br: '#bfdbfe', fg: '#1e3a8a' }
      : norm === 'functionality'
      ? { bg: '#f5f3ff', br: '#ddd6fe', fg: '#4c1d95' }
      : norm === 'data'
      ? { bg: '#ecfeff', br: '#a5f3fc', fg: '#164e63' }
      : { bg: '#f1f5f9', br: '#e2e8f0', fg: '#0f172a' };

  return (
    <span
      title={`Category: ${category}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 999,
        background: styles.bg,
        border: `1px solid ${styles.br}`,
        color: styles.fg,
        letterSpacing: 0.2,
      }}
    >
      {category}
    </span>
  );
}

export default function ReviewMenu({
  targetLabel,
  sourceLabel,
  reviews,
  onCreate,
  onToggle,
  onDelete,
  onUpdate, // NEW
}: {
  targetLabel?: string;
  sourceLabel?: string;
  reviews: Review[];
  onCreate: (
    text: string,
    category: Review['category'],
    priority: Review['priority']
  ) => void;
  onToggle: (id: string, nextResolved: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Review>) => void; // NEW
}) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Review['category']>('Design');
  const [priority, setPriority] = useState<Review['priority']>('Medium');
  const [customCategory, setCustomCategory] = useState<string>('');

  // ---- Edit state (per review) ----
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] =
    useState<Review['category']>('Design');
  const [editPriority, setEditPriority] =
    useState<Review['priority']>('Medium');
  const [editCustomCategory, setEditCustomCategory] = useState('');

  const sorted = useMemo(() => {
    const list = [...reviews];
    list.sort((a, b) => {
      if (!!a.resolved !== !!b.resolved) return a.resolved ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
    return list;
  }, [reviews]);

  const fieldLabel: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 6,
    paddingLeft: 6,
  };

  const needsCustom = category === 'Other';
  const canSubmit = !!text.trim() && (!needsCustom || !!customCategory.trim());

  // Helpers for editing
  const startEdit = (r: Review) => {
    setEditingId(r.id);
    // prefill category/custom
    const baseCat = ['Design', 'Functionality', 'Data', 'Other'].includes(
      String(r.category)
    )
      ? (r.category as Review['category'])
      : 'Other';
    setEditCategory(baseCat as Review['category']);
    setEditCustomCategory(
      baseCat === 'Other' ? String(r.category) : '' // if custom, keep it
    );
    setEditPriority(r.priority || 'Medium');
    setEditText(r.text || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditCustomCategory('');
    setEditCategory('Design');
    setEditPriority('Medium');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const t = editText.trim();
    if (!t) return;

    const needsCustomEdit = editCategory === 'Other';
    const effCat = needsCustomEdit
      ? editCustomCategory.trim() || 'Other'
      : editCategory;

    onUpdate(editingId, {
      text: t,
      category: effCat as Review['category'],
      priority: editPriority,
    });
    cancelEdit();
  };

  const needsCustomEdit = editCategory === 'Other';
  const canSaveEdit =
    !!editText.trim() && (!needsCustomEdit || !!editCustomCategory.trim());

  return (
    <>
      {/* Header like MENU */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>REVIEWS</div>

      {/* Details */}
      <SectionTitle>Details</SectionTitle>
      <div style={{ display: 'grid', gap: 8 }}>
        {sourceLabel ? (
          <>
            <NameField
              label="Source"
              placeholder="Source"
              value={sourceLabel}
              onChange={() => {}}
              disabled
            />
            <NameField
              label="Target"
              placeholder="Target"
              value={targetLabel ?? ''}
              onChange={() => {}}
              disabled
            />
          </>
        ) : (
          <NameField
            label="Component"
            placeholder="Component"
            value={targetLabel ?? ''}
            onChange={() => {}}
            disabled
          />
        )}
      </div>

      {/* Add review */}
      <SectionTitle>Review</SectionTitle>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <label style={fieldLabel}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                background: '#fff',
              }}
            >
              <option>Design</option>
              <option>Functionality</option>
              <option>Data</option>
              <option>Other</option>
            </select>
          </div>

          {needsCustom && (
            <>
              <SectionTitle>Custom category</SectionTitle>
              <NameField
                label="Custom category"
                placeholder="Enter a custom category"
                value={customCategory}
                onChange={setCustomCategory}
                disabled={false}
              />
            </>
          )}

          <div>
            <label style={fieldLabel}>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                background: '#fff',
              }}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div>
            <label style={fieldLabel}>Comment</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="What should be improved?"
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                resize: 'vertical',
                background: '#fff',
              }}
            />
          </div>

          <button
            onClick={() => {
              const t = text.trim();
              const custom = customCategory.trim();
              if (!t) return;
              if (needsCustom && !custom) return;

              const effectiveCategory = needsCustom
                ? (custom as any)
                : category;

              onCreate(t, effectiveCategory as any, priority);
              setText('');
              if (needsCustom) setCustomCategory('');
            }}
            disabled={!canSubmit}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid transparent',
              background: canSubmit ? '#3b82f6' : '#93c5fd',
              color: '#fff',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            Add review
          </button>
        </div>
      </div>

      {/* Notes list */}
      <SectionTitle>Notes</SectionTitle>
      <div style={{ display: 'grid', gap: 8 }}>
        {sorted.length === 0 && (
          <div
            style={{
              padding: 10,
              border: '1px dashed #cbd5e1',
              borderRadius: 10,
              background: '#fff',
              color: '#64748b',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            No reviews yet.
          </div>
        )}

        {sorted.map((r) => {
          const isEditing = editingId === r.id;

          return (
            <div
              key={r.id}
              style={{
                background: r.resolved ? '#ecfdf5' : '#fff',
                border: r.resolved ? '1px solid #86efac' : '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 10,
                transition: 'background 160ms ease, border-color 160ms ease',
              }}
            >
              {/* Header line */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                {!isEditing && (
                  <>
                    {r.category && <CategoryPill category={r.category} />}
                    {r.priority && <PriorityPill level={r.priority} />}
                  </>
                )}
                <span
                  style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b' }}
                >
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Content / Edit form */}
              {!isEditing ? (
                <div
                  style={{
                    color: r.resolved ? '#065f46' : '#0f172a',
                    fontSize: 13,
                    lineHeight: 1.35,
                  }}
                >
                  {r.text}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <label style={fieldLabel}>Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) =>
                        setEditCategory(e.target.value as Review['category'])
                      }
                      style={{
                        width: '100%',
                        padding: 8,
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                      }}
                    >
                      <option>Design</option>
                      <option>Functionality</option>
                      <option>Data</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {needsCustomEdit && (
                    <NameField
                      label="Custom category"
                      placeholder="Enter a custom category"
                      value={editCustomCategory}
                      onChange={setEditCustomCategory}
                      disabled={false}
                    />
                  )}

                  <div>
                    <label style={fieldLabel}>Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) =>
                        setEditPriority(e.target.value as Review['priority'])
                      }
                      style={{
                        width: '100%',
                        padding: 8,
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                      }}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>

                  <div>
                    <label style={fieldLabel}>Comment</label>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      placeholder="Edit comment"
                      style={{
                        width: '100%',
                        padding: 8,
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        resize: 'vertical',
                        background: '#fff',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => onToggle(r.id, !r.resolved)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: r.resolved
                          ? '1px solid #86efac'
                          : '1px solid #a7f3d0',
                        background: r.resolved ? '#d1fae5' : '#ecfdf5',
                        color: '#059669',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                      title={
                        r.resolved ? 'Mark as unresolved' : 'Mark as resolved'
                      }
                    >
                      <LuCheck size={14} />
                      {r.resolved ? 'Resolved' : 'Resolve'}
                    </button>

                    <button
                      onClick={() => startEdit(r)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                      title="Edit review"
                    >
                      <LuPencil size={14} />
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(r.id)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#ef4444',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Delete review"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={saveEdit}
                      disabled={!canSaveEdit}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid #3b82f6',
                        background: canSaveEdit ? '#3b82f6' : '#93c5fd',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: canSaveEdit ? 'pointer' : 'not-allowed',
                      }}
                      title="Save changes"
                    >
                      <LuSave size={14} />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        color: '#0f172a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                      title="Cancel"
                    >
                      <LuX size={14} />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
