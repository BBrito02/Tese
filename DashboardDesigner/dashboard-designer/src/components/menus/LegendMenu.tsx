import type { KindProps } from './common';
import { NameField, TypeField, ListSection } from './sections';
import type { DataItem } from '../../domain/types';
import { useModal } from '../ui/ModalHost';

export default function LegendMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const dataList: (string | DataItem)[] = d.data ?? [];
  const interactions: string[] = d.interactions ?? [];

  const { openDataModal } = useModal();

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
      <TypeField value="Legend" />

      {/* Data list */}
      <ListSection
        title="Data list"
        items={dataList}
        onAdd={() =>
          openDataModal(dataList, (items) => p.onChange({ data: items }))
        }
        addTooltip="Associate data"
        disabled={disabled}
      />

      {/* Interaction list */}
      <ListSection
        title="Interaction list"
        items={interactions}
        onAdd={() => {
          /* hook later */
        }}
        addTooltip="Add interaction"
        disabled={disabled}
      />
    </div>
  );
}
