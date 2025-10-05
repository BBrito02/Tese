import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  ListSection,
  AddComponentSection,
} from './sections';
import type { DataItem, NodeKind } from '../../domain/types';
import { useModal } from '../ui/ModalHost';
import { allowedChildKinds } from '../../domain/rules';

export default function LegendMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const dataList: (string | DataItem)[] = d.data ?? [];
  const interactions: string[] = d.interactions ?? [];

  const { openDataModal, openAddComponentModal } = useModal();

  const handleAddComponent = () => {
    const parentKind = (p.node.data?.kind ?? 'Dashboard') as NodeKind;
    const kinds = allowedChildKinds(parentKind);
    openAddComponentModal(kinds, (payload) => {
      // Let Editor create the child (keeps graph logic centralized)
      window.dispatchEvent(
        new CustomEvent('designer:add-component', {
          detail: { parentId: p.node.id, payload },
        })
      );
    });
  };

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

      <AddComponentSection
        title="Add component"
        disabled={disabled}
        onAdd={handleAddComponent}
      />

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
