// src/components/menus/DashboardMenu.tsx
import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  ListSection,
  AddComponentSection,
} from './sections';
import { useModal } from '../ui/ModalHost';
import { allowedChildKinds } from '../../domain/rules';
import type { NodeKind } from '../../domain/types';

export default function DashboardMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;
  const { openAddComponentModal } = useModal();

  const objectives: string[] = d.objectives ?? [];
  const interactions: string[] = d.interactions ?? [];

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
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />
      <TypeField value="Dashboard" />

      <AddComponentSection
        title="Add component"
        disabled={disabled}
        onAdd={handleAddComponent}
      />

      <ListSection
        title="Objectives"
        items={objectives}
        onAdd={() => {}}
        addTooltip="Add objective"
        disabled={disabled}
      />

      <ListSection
        title="Interaction list"
        items={interactions}
        onAdd={() => {}}
        addTooltip="Add interaction"
        disabled={disabled}
      />
    </div>
  );
}
