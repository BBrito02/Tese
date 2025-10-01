import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  ListSection,
  AddComponentSection,
} from './sections';

import { useModal } from '../ui/ModalHost';
import AddComponentPopup from '../popups/ComponentPopup';
import { allowedChildKinds } from '../../domain/rules';
import type { NodeKind } from '../../domain/types';

export default function DashboardMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;
  const { openModal, closeModal } = useModal();

  const objectives: string[] = d.objectives ?? [];
  const interactions: string[] = d.interactions ?? [];

  const handleAddComponent = () => {
    const parentKind = (p.node.data?.kind ?? 'Dashboard') as NodeKind;
    const kinds = allowedChildKinds(parentKind);

    openModal({
      title: 'Component Menu',
      node: (
        <AddComponentPopup
          kinds={kinds}
          onCancel={closeModal}
          onSave={(payload) => {
            // notify the Editor to create the child node
            window.dispatchEvent(
              new CustomEvent('designer:add-component', {
                detail: { parentId: p.node.id, payload },
              })
            );
            closeModal();
          }}
        />
      ),
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
      <TypeField value="Dashboard" />

      {/* Add Component (opens modal here) */}
      <AddComponentSection
        title="Add component"
        disabled={disabled}
        onAdd={handleAddComponent}
      />

      {/* Objectives */}
      <ListSection
        title="Objectives"
        items={objectives}
        onAdd={() => {
          /* later */
        }}
        addTooltip="Add objective"
        disabled={disabled}
      />

      {/* Interaction list */}
      <ListSection
        title="Interaction list"
        items={interactions}
        onAdd={() => {
          /* later */
        }}
        addTooltip="Add interaction"
        disabled={disabled}
      />
    </div>
  );
}
