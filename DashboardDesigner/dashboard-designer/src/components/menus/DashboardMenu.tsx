// src/components/menus/DashboardMenu.tsx
import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  AddComponentSection,
  SectionTitle,
} from './sections';
import { useModal } from '../ui/ModalHost';
import { allowedChildKinds } from '../../domain/rules';
import type { NodeKind } from '../../domain/types';
import AddComponentPopup from '../popups/ComponentPopup'; // ← add this import

export default function DashboardMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;
  const { openModal, closeModal } = useModal(); // ← use generic modal API

  const handleAddComponent = () => {
    const parentKind = (p.node.data?.kind ?? 'Dashboard') as NodeKind;
    const kinds = allowedChildKinds(parentKind);

    openModal({
      title: 'Component Menu',
      node: (
        <AddComponentPopup
          kinds={kinds as any}
          onCancel={closeModal}
          onSave={(payload: any) => {
            // ← annotate to avoid TS7006
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
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      <SectionTitle>Properties</SectionTitle>
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />
      <TypeField value="Dashboard" />

      <SectionTitle>Actions</SectionTitle>
      <AddComponentSection
        title="Add component"
        disabled={disabled}
        onAdd={handleAddComponent}
      />
    </div>
  );
}
