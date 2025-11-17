// src/components/menus/TooltipEdgeMenu.tsx
import type { Edge as RFEdge } from 'reactflow';
import EdgesMenu from './EdgesMenu';
import { NameField, TypeField, ListSection, SectionTitle } from './sections';

type AppEdge = RFEdge<any>;

type Props = {
  edge: AppEdge;
  sourceTitle?: string;
  targetTitle?: string;
  onDelete?: () => void;
};

export default function TooltipEdgeMenu({
  edge,
  sourceTitle,
  targetTitle,
  onDelete,
}: Props) {
  const data = (edge.data || {}) as any;

  const label = data.label ?? '';
  const activation = data.activation ?? 'hover';
  const attachRef = data.attachRef ?? 'viz';

  const fromLabel = sourceTitle ?? edge.source;
  const toLabel = targetTitle ?? edge.target;

  const connectionItems: string[] = [`From · ${fromLabel}`, `To · ${toLabel}`];

  const behaviourItems: string[] = [
    `Activation · ${activation}`,
    `Attach to · ${attachRef}`,
  ];

  const technicalItems: string[] = [`Edge id · ${edge.id}`];
  if (label) technicalItems.push(`Label · ${label}`);

  return (
    <EdgesMenu>
      {/* Title / header */}
      <div style={{ fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
        Tooltip Edge
      </div>

      <SectionTitle>Properties</SectionTitle>
      <NameField
        value={label || `${fromLabel} → ${toLabel}`}
        placeholder="Tooltip name"
        disabled={true}
        onChange={() => {
          /* read-only for now */
        }}
      />
      <TypeField value="Tooltip" />

      <SectionTitle>Connection</SectionTitle>
      <ListSection title="Nodes" items={connectionItems} />

      <SectionTitle>Tooltip behaviour</SectionTitle>
      <ListSection title="Behaviour" items={behaviourItems} />

      {technicalItems.length > 0 && (
        <>
          <SectionTitle>Technical details</SectionTitle>
          <ListSection title="Edge metadata" items={technicalItems} />
        </>
      )}

      {onDelete && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 12,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            type="button"
            onClick={onDelete}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #ef4444',
              background: 'white',
              color: '#ef4444',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Delete tooltip edge
          </button>
        </div>
      )}
    </EdgesMenu>
  );
}
