import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  ListSection,
  SectionTitle,
  type ListItem, // Import ListItem
} from './sections';
import type { DataItem, Interaction } from '../../domain/types';

import { useModal } from '../ui/ModalHost';
import DataPopup from '../popups/DataPopup';

export default function FilterMenu(p: KindProps) {
  const { openModal, closeModal } = useModal();

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
      <TypeField value="Filter" />

      <SectionTitle>Actions</SectionTitle>

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
