// src/components/menus/InteractionEdgeMenu.tsx
import { useEffect } from 'react';
import type { Edge as RFEdge } from 'reactflow';

const PANEL_WIDTH = 280;

type AppEdge = RFEdge<any>;

type Props = {
  edge: AppEdge;
  sourceTitle?: string;
  targetTitle?: string;
  onDelete?: () => void;
};

export default function InteractionEdgeMenu({
  edge,
  sourceTitle,
  targetTitle,
  onDelete,
}: Props) {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('designer:menu-width', {
        detail: { width: PANEL_WIDTH },
      })
    );
  }, []);

  const data = (edge.data || {}) as any;

  const label = data.label ?? '';
  const trigger = data.trigger ?? data.activation ?? 'click';
  const sourceType = data.sourceType ?? data.sourceKind ?? 'component';
  const sourceHandle = data.sourceHandle ?? '';
  const sourceDataRef = data.sourceDataRef ?? '';

  return (
    <aside
      style={{
        width: PANEL_WIDTH,
        minWidth: PANEL_WIDTH,
        maxWidth: PANEL_WIDTH,
        borderLeft: '1px solid #e5e7eb',
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: 0.06,
            textTransform: 'uppercase',
            color: '#6b7280',
          }}
        >
          Interaction link
        </div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Edge details</div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: 12,
          paddingBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          fontSize: 13,
          color: '#111827',
        }}
      >
        <Field label="Edge id" value={edge.id} />
        <Field label="Source" value={sourceTitle ?? edge.source} />
        <Field label="Target" value={targetTitle ?? edge.target} />
        {label && <Field label="Label" value={label} />}
        <Field label="Trigger" value={String(trigger)} />
        <Field label="Source type" value={String(sourceType)} />
        {sourceHandle && <Field label="Source handle" value={sourceHandle} />}
        {sourceDataRef && (
          <Field label="Source data attribute" value={sourceDataRef} />
        )}
      </div>

      {/* Footer */}
      {onDelete && (
        <div
          style={{
            marginTop: 'auto',
            padding: 12,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            type="button"
            onClick={onDelete}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #ef4444',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Delete interaction edge
          </button>
        </div>
      )}
    </aside>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value && value !== '') return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.04,
          color: '#6b7280',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: '#111827' }}>{value}</span>
    </div>
  );
}
