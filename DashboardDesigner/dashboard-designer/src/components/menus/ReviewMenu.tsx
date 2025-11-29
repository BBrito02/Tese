import { useState } from 'react';
import type { Review } from '../../domain/types';
import { SectionTitle, NameField } from '../menus/sections';
import { LuCheck, LuTrash2 } from 'react-icons/lu';

function Chip({ children }: { children: React.ReactNode }) {
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
}

export default function ReviewMenu({
  targetLabel,
  sourceLabel,
  reviews,
  onCreate,
  onToggle,
  onDelete,
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
}) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Review['category']>('Design');
  const [priority, setPriority] = useState<Review['priority']>('Medium');

  const sorted = [...reviews].sort((a, b) => {
    if (!!a.resolved !== !!b.resolved) return a.resolved ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  const fieldLabel: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 6,
    paddingLeft: 6,
  };

  return (
    <>
      {/* Header like MENU */}
      <div
        style={{
          fontWeight: 700,
          textAlign: 'center',
        }}
      >
        REVIEWS
      </div>

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
              if (!t) return;
              onCreate(t, category, priority);
              setText('');
            }}
            disabled={!text.trim()}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid transparent',
              background: text.trim() ? '#3b82f6' : '#93c5fd',
              color: '#fff',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
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

        {sorted.map((r) => (
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
            <div
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              {r.category && <Chip>{r.category}</Chip>}
              {r.priority && <Chip>{r.priority}</Chip>}
              <span
                style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b' }}
              >
                {new Date(r.createdAt).toLocaleString()}
              </span>
            </div>

            <div
              style={{
                color: r.resolved ? '#065f46' : '#0f172a',
                fontSize: 13,
                lineHeight: 1.35,
              }}
            >
              {r.text}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
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
                title={r.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
              >
                <LuCheck size={14} />
                {r.resolved ? 'Resolved' : 'Resolve'}
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
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
