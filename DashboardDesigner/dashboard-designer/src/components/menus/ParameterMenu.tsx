import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  ListSection,
  OptionsSection,
  SectionTitle,
  type ListItem, // Import ListItem
} from './sections';
import type { Interaction } from '../../domain/types';

export default function ParameterMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const options: string[] = d.options ?? [];

  const interactions: Interaction[] = Array.isArray(d.interactions)
    ? (d.interactions as Interaction[])
    : [];

  // --- CHANGED: Map to objects with { name, badge } ---
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
      <TypeField value="Parameter" />

      <SectionTitle>Actions</SectionTitle>

      {/* Options */}
      <OptionsSection
        title="Options"
        placeholder="Enter option"
        addTooltip="Add option"
        items={options}
        disabled={disabled}
        onChange={(next) => p.onChange({ options: next })}
      />

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
        // --- CHANGED: Add click handler ---
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
