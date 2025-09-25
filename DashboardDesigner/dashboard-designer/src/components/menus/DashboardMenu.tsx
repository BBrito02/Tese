import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  ListSection,
  AddComponentSection,
} from './sections';

export default function DashboardMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const objectives: string[] = d.objectives ?? [];
  const interactions: string[] = d.interactions ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      {/* Component name */}
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />

      {/* Component type */}
      <TypeField value="Dashboard" />

      {/* Add Component Section */}
      <AddComponentSection
        title="Add component"
        disabled={disabled}
        onAdd={() => p.onOpen?.('add-component')}
      />

      {/* Objectives */}
      <ListSection
        title="Objectives"
        items={objectives}
        onAdd={() => {
          /* hook later: p.onOpen?.('objectives') */
        }}
        addTooltip="Add objective"
        disabled={disabled}
      />

      {/* Interaction list */}
      <ListSection
        title="Interaction list"
        items={interactions}
        onAdd={() => {
          /* hook later: p.onOpen?.('interactions') */
        }}
        addTooltip="Add interaction"
        disabled={disabled}
      />
    </div>
  );
}
