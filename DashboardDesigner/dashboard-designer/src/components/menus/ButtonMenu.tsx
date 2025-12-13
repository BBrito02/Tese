import type { Interaction } from '../../domain/types';
import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  ListSection,
  SectionTitle,
  type ListItem, // Import ListItem type
} from './sections';

export default function ButtonMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const interactions: Interaction[] = Array.isArray(d.interactions)
    ? (d.interactions as Interaction[])
    : [];

  // --- CHANGED: Map to objects with { name, badge } for styling ---
  const interactionItems: ListItem[] = interactions.map((ix) => ({
    name: ix.name,
    badge: ix.result,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      <SectionTitle>Properties</SectionTitle>

      {/* Component name */}
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />

      {/* Component type */}
      <TypeField value="Button" />

      <SectionTitle>Actions</SectionTitle>

      {/* Interaction list */}
      <ListSection
        title="Interaction list"
        items={interactionItems} // Use mapped items
        onAdd={() => {
          window.dispatchEvent(
            new CustomEvent('designer:open-interactions', {
              detail: { nodeId: p.node.id },
            })
          );
        }}
        // --- CHANGED: Add click handler to select edge ---
        onItemClick={(i) => {
          const ix = interactions[i];
          if (ix) {
            window.dispatchEvent(
              new CustomEvent('designer:select-interaction', {
                detail: { interactionId: ix.id },
              })
            );
          }
        }}
        addTooltip="Add interaction"
        disabled={disabled}
      />
    </div>
  );
}
