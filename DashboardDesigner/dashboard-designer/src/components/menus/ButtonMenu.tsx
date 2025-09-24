import type { KindProps } from './common';
import { NameField, TypeField, ListSection } from './sections';

export default function ButtonMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

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
      <TypeField value="Button" />

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
