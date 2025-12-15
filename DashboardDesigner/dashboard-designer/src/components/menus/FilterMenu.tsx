import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  ListSection,
  SectionTitle,
  type ListItem,
} from './sections';
import type { DataItem, Interaction } from '../../domain/types';
import { nanoid } from 'nanoid'; // Import nanoid

import { useModal } from '../ui/ModalHost';
import DataPopup from '../popups/DataPopup';

export default function FilterMenu(p: KindProps) {
  const { openModal, closeModal } = useModal();

  const d: any = p.node.data;
  const disabled = p.disabled;

  const dataList = d.data as (string | DataItem)[] | undefined;

  // Helper: Ensure every item has an ID (migrates legacy strings/objects)
  const toDataItems = (list?: (string | DataItem)[]): DataItem[] =>
    Array.isArray(list)
      ? list.map((v) => {
          if (typeof v === 'string') {
            return { id: nanoid(), name: v, dtype: 'Other' };
          }
          // If object exists but lacks ID, assign one
          if (v && !v.id) {
            return { ...v, id: nanoid() };
          }
          return v;
        })
      : [];

  const interactions: Interaction[] = Array.isArray(d.interactions)
    ? (d.interactions as Interaction[])
    : [];

  // Map interactions to { name, badge }
  const interactionItems: ListItem[] = interactions.map((ix) => ({
    name: ix.name,
    badge: ix.result,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      <SectionTitle>Properties</SectionTitle>

      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />

      <TypeField value="Filter" />

      <SectionTitle>Actions</SectionTitle>

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
                // FIXED: Just accept items, no renames map needed
                onSave={(items: DataItem[]) => {
                  p.onChange({ data: items } as any);
                  closeModal();
                }}
              />
            ),
          })
        }
        // --- Click to edit data ---
        onItemClick={(index) => {
          openModal({
            title: 'Data fields',
            node: (
              <DataPopup
                initial={toDataItems(dataList)}
                initialSelectedIndex={index}
                onCancel={closeModal}
                // FIXED: Just accept items
                onSave={(items: DataItem[]) => {
                  p.onChange({ data: items } as any);
                  closeModal();
                }}
              />
            ),
          });
        }}
        addTooltip="Associate data"
        disabled={disabled}
      />

      <ListSection
        title="Interaction list"
        items={interactionItems}
        onAdd={() => {
          window.dispatchEvent(
            new CustomEvent('designer:open-interactions', {
              detail: { nodeId: p.node.id },
            })
          );
        }}
        // --- Click to select interaction edge ---
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
