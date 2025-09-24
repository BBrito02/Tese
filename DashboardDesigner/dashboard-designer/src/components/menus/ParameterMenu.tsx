import type { KindProps } from './common';
import { NameField, TypeField, ListSection, OptionsSection } from './sections';

export default function ParameterMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const options: string[] = d.options ?? [];
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
      <TypeField value="Parameter" />

      {/* Options (reusable section) */}
      <OptionsSection
        title="Options"
        placeholder="Enter option"
        addTooltip="Add option"
        items={options}
        disabled={disabled}
        onChange={(next) => p.onChange({ options: next })}
      />

      {/* Interaction list (hook up later with a popup or action) */}
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
