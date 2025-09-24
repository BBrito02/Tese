import type { KindProps } from './common';
import { NameField, TypeField, ListSection } from './sections';
import type { DataItem } from '../../domain/types';

export default function FilterMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const dataList: (string | DataItem)[] = d.data ?? [];
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
      <TypeField value="Filter" />

      {/* Data list */}
      <ListSection
        title="Data list"
        items={dataList}
        onAdd={() => p.onOpen?.('data')}
        addTooltip="Associate data"
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
