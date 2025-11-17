// src/components/menus/InteractionEdgeMenu.tsx
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

export default function InteractionEdgeMenu({
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

  const label = data.label ?? '';
  const trigger = data.trigger ?? data.activation ?? 'click';
  const sourceType = data.sourceType ?? data.sourceKind ?? 'component';
  const sourceHandle = data.sourceHandle ?? '';
  const sourceDataRef = data.sourceDataRef ?? '';

  // editable name (interaction label)
  const [name, setName] = useState<string>(label);

  useEffect(() => {
    setName(label);
  }, [edge.id, label]);

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
      {/* Header to match other menus */}
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

      {/* Name – interaction name, editable */}
      <NameField
        value={name}
        onChange={(val) => {
          setName(val);
          onChange?.({ label: val });
        }}
        disabled={!onChange}
      />

      {/* Type & metadata */}
      <TypeField value="Interaction edge" />
      <TypeField value={`Trigger: ${String(trigger)}`} />
      <TypeField value={`Source: ${sourceTitle ?? edge.source}`} />
      <TypeField value={`Target: ${targetTitle ?? edge.target}`} />
      <TypeField value={`Source type: ${String(sourceType)}`} />
      {sourceHandle && <TypeField value={`Source handle: ${sourceHandle}`} />}
      {sourceDataRef && (
        <TypeField value={`Source data attribute: ${sourceDataRef}`} />
      )}

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
          Delete interaction edge
        </button>
      )}
    </aside>
  );
}
