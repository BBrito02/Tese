// src/components/menus/TooltipEdgeMenu.tsx
import { useEffect, useState } from 'react';
import type { Edge as RFEdge } from 'reactflow';
import { NameField, TypeField, SectionTitle } from './sections';

const PANEL_WIDTH = 280;

type AppEdge = RFEdge<any>;

type Props = {
  edge: AppEdge;
  sourceTitle?: string;
  targetTitle?: string;
  onDelete?: () => void;
  onChange?: (patch: { label?: string }) => void; // NEW
};

export default function TooltipEdgeMenu({
  edge,
  sourceTitle,
  targetTitle,
  onDelete,
  onChange,
}: Props) {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('designer:menu-width', {
        detail: { width: PANEL_WIDTH },
      })
    );
  }, []);

  const data = (edge.data || {}) as any;

  const activation = data.activation ?? 'hover';
  const attachRef = data.attachRef ?? 'viz';

  // --- editable name coming from edge.data.label ---
  const [name, setName] = useState<string>(data.label ?? '');

  useEffect(() => {
    // keep in sync if a different edge gets selected
    setName(data.label ?? '');
  }, [edge.id, data.label]);

  return (
    <aside
      style={{
        width: PANEL_WIDTH,
        minWidth: PANEL_WIDTH,
        maxWidth: PANEL_WIDTH,
        borderLeft: '1px solid #e5e7eb',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        borderRadius: 20,
        marginTop: 7,
        marginBottom: 7,
        padding: 12,
        boxSizing: 'border-box',
      }}
    >
      {/* Header – mimics your node menus */}
      <div
        style={{
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        EDGE MENU
      </div>

      <SectionTitle>Properties</SectionTitle>

      {/* Type: tooltip/trigger/source/target */}
      <TypeField value="Tooltip edge" />
      <TypeField value={`Trigger: ${String(activation)}`} />
      <TypeField value={`Attach: ${String(attachRef)}`} />
      <TypeField value={`Source: ${sourceTitle ?? edge.source}`} />
      <TypeField value={`Target: ${targetTitle ?? edge.target}`} />

      {/* Footer */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #ef4444',
            background: '#fef2f2',
            color: '#b91c1c',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Delete tooltip edge
        </button>
      )}
    </aside>
  );
}
