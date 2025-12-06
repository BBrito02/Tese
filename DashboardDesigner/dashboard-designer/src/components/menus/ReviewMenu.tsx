import { useState, useMemo } from 'react';
import type { Review, Reply } from '../../domain/types';
import { SectionTitle, NameField } from '../menus/sections';
import {
  LuCheck,
  LuTrash2,
  LuPencil,
  LuX,
  LuSave,
  LuCornerDownRight,
  LuSend,
  LuUser,
} from 'react-icons/lu';

// --- PILL COMPONENTS ---
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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px', // Reduced padding
        fontSize: 9, // Slightly smaller font
        fontWeight: 700,
        borderRadius: 999,
        background: styles.bg,
        border: `1px solid ${styles.br}`,
        color: styles.fg,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        whiteSpace: 'nowrap', // Prevent pill breaking
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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        fontSize: 9,
        fontWeight: 700,
        borderRadius: 999,
        background: styles.bg,
        border: `1px solid ${styles.br}`,
        color: styles.fg,
        letterSpacing: 0.2,
        whiteSpace: 'nowrap',
        maxWidth: 80, // Truncate really long custom categories
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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
  onUpdate,
  onReply,
  onDeleteReply,
}: {
  targetLabel?: string;
  sourceLabel?: string;
  reviews: Review[];
  onCreate: (
    text: string,
    category: Review['category'],
    priority: Review['priority'],
    author: string
  ) => void;
  onToggle: (id: string, nextResolved: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Review>) => void;
  onReply: (reviewId: string, text: string, author: string) => void;
  onDeleteReply: (reviewId: string, replyId: string) => void;
}) {
  const [currentUser, setCurrentUser] = useState('');

  // Add Form State
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Review['category']>('Design');
  const [priority, setPriority] = useState<Review['priority']>('Medium');
  const [customCategory, setCustomCategory] = useState<string>('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] =
    useState<Review['category']>('Design');
  const [editPriority, setEditPriority] =
    useState<Review['priority']>('Medium');
  const [editCustomCategory, setEditCustomCategory] = useState('');

  // Reply State
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 4,
  };

  // ✅ FIX 1: Ensure all inputs use border-box so padding doesn't expand width
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    fontSize: 12,
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box', // Crucial for layout
  };

  const needsCustom = category === 'Other';
  const canSubmit = !!text.trim() && (!needsCustom || !!customCategory.trim());

  // Edit Logic
  const startEdit = (r: Review) => {
    setEditingId(r.id);
    const baseCat = ['Design', 'Functionality', 'Data', 'Other'].includes(
      String(r.category)
    )
      ? (r.category as Review['category'])
      : 'Other';
    setEditCategory(baseCat as Review['category']);
    setEditCustomCategory(baseCat === 'Other' ? String(r.category) : '');
    setEditPriority(r.priority || 'Medium');
    setEditText(r.text || '');
    setReplyingId(null);
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
    const effCat =
      editCategory === 'Other'
        ? editCustomCategory.trim() || 'Other'
        : editCategory;
    onUpdate(editingId, {
      text: t,
      category: effCat as Review['category'],
      priority: editPriority,
    });
    cancelEdit();
  };

  const submitReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    onReply(reviewId, replyText, currentUser || 'Anonymous');
    setReplyText('');
    setReplyingId(null);
  };

  const needsCustomEdit = editCategory === 'Other';
  const canSaveEdit =
    !!editText.trim() && (!needsCustomEdit || !!editCustomCategory.trim());

  return (
    <div style={{ paddingBottom: 20, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
        REVIEWS
      </div>

      <SectionTitle>Details</SectionTitle>
      <div style={{ display: 'grid', gap: 8 }}>
        <NameField
          label="Component"
          placeholder=""
          value={targetLabel ?? ''}
          onChange={() => {}}
          disabled
        />
      </div>

      <SectionTitle>Add Review</SectionTitle>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {/* Author Input */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <LuUser size={14} style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              placeholder="Your Name (Optional)"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 12,
                width: '100%',
                outline: 'none',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: 2,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
          >
            <div style={{ minWidth: 0 }}>
              {' '}
              {/* minWidth 0 prevents flex blowouts */}
              <label style={fieldLabel}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                style={inputStyle}
              >
                <option>Design</option>
                <option>Functionality</option>
                <option>Data</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ minWidth: 0 }}>
              <label style={fieldLabel}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                style={inputStyle}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>

          {needsCustom && (
            <input
              placeholder="Custom category..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              style={inputStyle}
            />
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="What should be improved?"
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />

          <button
            onClick={() => {
              const t = text.trim();
              const custom = customCategory.trim();
              if (!t) return;
              if (needsCustom && !custom) return;
              const effectiveCategory = needsCustom
                ? (custom as any)
                : category;
              onCreate(
                t,
                effectiveCategory as any,
                priority,
                currentUser || 'Anonymous'
              );
              setText('');
              if (needsCustom) setCustomCategory('');
            }}
            disabled={!canSubmit}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 6,
              border: 'none',
              background: canSubmit ? '#3b82f6' : '#93c5fd',
              color: '#fff',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: 12,
              boxSizing: 'border-box',
            }}
          >
            Add Review
          </button>
        </div>
      </div>

      <SectionTitle>Discussion</SectionTitle>
      <div style={{ display: 'grid', gap: 12 }}>
        {sorted.length === 0 && (
          <div
            style={{
              padding: 16,
              border: '1px dashed #cbd5e1',
              borderRadius: 10,
              background: '#fff',
              color: '#64748b',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            No reviews yet. Be the first!
          </div>
        )}

        {sorted.map((r) => {
          const isEditing = editingId === r.id;
          const isReplying = replyingId === r.id;

          return (
            <div
              key={r.id}
              style={{
                background: r.resolved ? '#f0fdf4' : '#fff',
                border: r.resolved ? '1px solid #86efac' : '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 12,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 200ms ease',
                boxSizing: 'border-box', // Ensure padding doesn't cause overflow
                width: '100%',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  marginBottom: 8,
                  flexWrap: 'wrap',
                }}
              >
                <strong style={{ fontSize: 12, color: '#1e293b' }}>
                  {r.author || 'Anonymous'}
                </strong>
                {!isEditing && (
                  <>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    {r.category && <CategoryPill category={r.category} />}
                    {r.priority && <PriorityPill level={r.priority} />}
                  </>
                )}
                <span
                  style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}
                >
                  {new Date(r.createdAt).toLocaleString(undefined, {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* === MAIN CONTENT === */}
              {!isEditing ? (
                // ✅ FIX 2: Break long words to prevent horizontal scroll
                <div
                  style={{
                    color: r.resolved ? '#15803d' : '#334155',
                    fontSize: 13,
                    lineHeight: 1.5,
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {r.text}
                </div>
              ) : (
                // EDIT MODE UI
                <div
                  style={{
                    background: '#f8fafc',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    display: 'grid',
                    gap: 8,
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <label style={fieldLabel}>Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as any)}
                        style={inputStyle}
                      >
                        <option>Design</option>
                        <option>Functionality</option>
                        <option>Data</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <label style={fieldLabel}>Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as any)}
                        style={inputStyle}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                  </div>

                  {needsCustomEdit && (
                    <input
                      placeholder="Custom category..."
                      value={editCustomCategory}
                      onChange={(e) => setEditCustomCategory(e.target.value)}
                      style={inputStyle}
                    />
                  )}

                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={saveEdit}
                      disabled={!canSaveEdit}
                      style={{
                        flex: 1,
                        background: canSaveEdit ? '#3b82f6' : '#93c5fd',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px',
                        fontSize: 12,
                        cursor: canSaveEdit ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <LuSave size={14} /> Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        flex: 1,
                        background: '#fff',
                        color: '#64748b',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '6px',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <LuX size={14} /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* REPLIES SECTION */}
              {r.replies && r.replies.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {r.replies.map((reply) => (
                    <div
                      key={reply.id}
                      style={{
                        position: 'relative',
                        alignSelf: 'stretch',
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '8px 12px',
                          paddingRight: 24,
                          borderRadius: '12px',
                          borderTopLeftRadius: '2px',
                          fontSize: 12,
                          lineHeight: 1.4,
                          // ✅ FIX 3: Break long words in replies too
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        <strong
                          style={{
                            color: '#475569',
                            marginRight: 4,
                            fontSize: 11,
                          }}
                        >
                          {reply.author || 'User'}:
                        </strong>
                        {reply.text}
                      </div>
                      <button
                        onClick={() => onDeleteReply(r.id, reply.id)}
                        title="Delete reply"
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          border: 'none',
                          background: 'transparent',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        <LuX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* REPLY INPUT */}
              {isReplying && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 8,
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <LuUser size={12} color="#94a3b8" flex-shrink="0" />
                    <input
                      value={currentUser}
                      onChange={(e) => setCurrentUser(e.target.value)}
                      placeholder="Your Name..."
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: 11,
                        width: '100%',
                        outline: 'none',
                        color: '#334155',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      style={{
                        flex: 1,
                        fontSize: 12,
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        boxSizing: 'border-box',
                        minWidth: 0,
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && submitReply(r.id)}
                    />
                    <button
                      onClick={() => submitReply(r.id)}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '0 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <LuSend size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              {!isEditing && (
                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    marginTop: 12,
                    paddingTop: 8,
                    borderTop: '1px solid #f1f5f9',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => onToggle(r.id, !r.resolved)}
                    style={{
                      flex: 1,
                      minWidth: '80px', // Prevent crushing
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: r.resolved
                        ? '1px solid #86efac'
                        : '1px solid #cbd5e1',
                      background: r.resolved ? '#dcfce7' : '#fff',
                      color: r.resolved ? '#166534' : '#475569',
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      boxSizing: 'border-box',
                    }}
                  >
                    <LuCheck size={14} /> {r.resolved ? 'Resolved' : 'Resolve'}
                  </button>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => {
                        setReplyingId(isReplying ? null : r.id);
                        setReplyText('');
                      }}
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        border: '1px solid transparent',
                        background: isReplying ? '#f1f5f9' : 'transparent',
                        cursor: 'pointer',
                      }}
                      title="Reply"
                    >
                      <LuCornerDownRight size={16} color="#64748b" />
                    </button>

                    <button
                      onClick={() => startEdit(r)}
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        border: '1px solid transparent',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                      title="Edit"
                    >
                      <LuPencil size={15} color="#64748b" />
                    </button>

                    <button
                      onClick={() => onDelete(r.id)}
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        border: '1px solid transparent',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                      title="Delete"
                    >
                      <LuTrash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
