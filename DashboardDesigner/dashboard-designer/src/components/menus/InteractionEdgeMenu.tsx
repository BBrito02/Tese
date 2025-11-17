// src/components/menus/InteractionEdgeMenu.tsx
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

export default function InteractionEdgeMenu({
  edge,
  sourceTitle,
  targetTitle,
  onDelete,
}: Props) {
  const data = (edge.data || {}) as any;

  const label = data.label ?? '';
  const trigger = data.trigger ?? data.activation ?? 'click';
  const sourceType = data.sourceType ?? data.sourceKind ?? 'component';
  const sourceHandle = data.sourceHandle ?? '';
  const sourceDataRef = data.sourceDataRef ?? '';

  const fromLabel = sourceTitle ?? edge.source;
  const toLabel = targetTitle ?? edge.target;

  // Lists for ListSection
  const connectionItems: string[] = [`From · ${fromLabel}`, `To · ${toLabel}`];

  const behaviourItems: string[] = [
    `Trigger · ${trigger}`,
    `Source type · ${sourceType}`,
  ];

  const technicalItems: string[] = [`Edge id · ${edge.id}`];
  if (label) technicalItems.push(`Label · ${label}`);
  if (sourceHandle) technicalItems.push(`Source handle · ${sourceHandle}`);
  if (sourceDataRef) technicalItems.push(`Source data attr · ${sourceDataRef}`);

  return (
    <EdgesMenu>
      {/* Title / header – same pattern as other menus */}
      <div style={{ fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
        Interaction Edge
      </div>

      <SectionTitle>Properties</SectionTitle>
      <NameField
        value={label || `${fromLabel} → ${toLabel}`}
        placeholder="Interaction name"
        disabled={true}
        onChange={() => {
          /* read-only for now */
        }}
      />
      <TypeField value="Interaction" />

      <SectionTitle>Connection</SectionTitle>
      <ListSection title="Nodes" items={connectionItems} />

      <SectionTitle>Behaviour</SectionTitle>
      <ListSection title="Interaction" items={behaviourItems} />

      {technicalItems.length > 0 && (
        <>
          <SectionTitle>Technical details</SectionTitle>
          <ListSection title="Edge metadata" items={technicalItems} />
        </>
      )}

      {/* Footer – same delete style as node menus */}
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
            Delete interaction edge
          </button>
        </div>
      )}
    </EdgesMenu>
  );
}
