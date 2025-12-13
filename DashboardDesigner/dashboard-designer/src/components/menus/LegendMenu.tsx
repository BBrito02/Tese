import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  ListSection,
  AddComponentSection,
  SectionTitle,
  type ListItem, // Import ListItem type
} from './sections';
import type { DataItem, Interaction, NodeKind } from '../../domain/types';
import { useModal } from '../ui/ModalHost';
import { allowedChildKinds } from '../../domain/rules';
import AddComponentPopup from '../popups/ComponentPopup';
import DataPopup from '../popups/DataPopup';

export default function LegendMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const dataList = d.data as (string | DataItem)[] | undefined;

  const toDataItems = (list?: (string | DataItem)[]): DataItem[] =>
    Array.isArray(list)
      ? list.map((v) =>
          typeof v === 'string' ? { name: v, dtype: 'Other' } : v
        )
      : [];

  const interactions: Interaction[] = Array.isArray(d.interactions)
    ? (d.interactions as Interaction[])
    : [];

  // --- CHANGED: Map to objects with { name, badge } ---
  const interactionItems: ListItem[] = interactions.map((ix) => ({
    name: ix.name,
    badge: ix.result,
  }));

  const { openModal, closeModal } = useModal();

  const handleAddComponent = () => {
    const parentKind = (p.node.data?.kind ?? 'Visualization') as NodeKind;
    const baseKinds = allowedChildKinds(parentKind);

    const kinds = [...baseKinds, 'VisualVariable'] as const;

    openModal({
      title: 'Component Menu',
      node: (
        <AddComponentPopup
          kinds={
            kinds as unknown as (NodeKind | 'GraphType' | 'VisualVariable')[]
          }
          initialVisualVars={d.visualVars ?? []}
          onCancel={closeModal}
          onSave={(payload) => {
            if (payload.kind === 'VisualVariable') {
              p.onChange({ visualVars: payload.variables } as any);
              closeModal();
              return;
            }
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

      <SectionTitle>Properties</SectionTitle>

      {/* Component name */}
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />

      {/* Component type */}
      <TypeField value="Legend" />

      <SectionTitle>Actions</SectionTitle>

      <AddComponentSection
        title="Add component"
        disabled={disabled}
        onAdd={handleAddComponent}
      />

      {/* Data list */}
      <ListSection
        title="Data list"
        items={dataList ?? []}
        onAdd={() =>
          openModal({
            title: 'Data fields',
            node: (
              <DataPopup
                initial={toDataItems(dataList)}
                onCancel={closeModal}
                onSave={(items: DataItem[]) => {
                  p.onChange({ data: items } as any);
                  closeModal();
                }}
              />
            ),
          })
        }
        addTooltip="Associate data"
        disabled={disabled}
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
