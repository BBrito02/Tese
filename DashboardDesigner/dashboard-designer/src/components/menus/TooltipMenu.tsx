import type { KindProps } from './common';
import type { DataItem, NodeKind, Interaction } from '../../domain/types';
import {
  NameField,
  TypeField,
  ListSection,
  AddComponentSection,
  DescriptionSection,
  SectionTitle,
  type ListItem,
} from './sections';
import { nanoid } from 'nanoid'; // Import nanoid
import { useModal } from '../ui/ModalHost';
import { allowedChildKinds } from '../../domain/rules';
import AddComponentPopup from '../popups/ComponentPopup';
import DataPopup from '../popups/DataPopup';

export default function TooltipMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const dataList = d.data as (string | DataItem)[] | undefined;

  // UPDATED: Ensure all items have an ID
  const toDataItems = (list?: (string | DataItem)[]): DataItem[] =>
    Array.isArray(list)
      ? list.map((v) => {
          if (typeof v === 'string') {
            return { id: nanoid(), name: v, dtype: 'Other' };
          }
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

  const { openModal, closeModal } = useModal();

  // --- RESTORED: Add Component Handler ---
  const handleAddComponent = () => {
    const parentKind = (p.node.data?.kind ?? 'Visualization') as NodeKind;
    const baseKinds = allowedChildKinds(parentKind).filter(
      (k) => k !== 'Graph'
    );
    const kinds = [...baseKinds, 'GraphType', 'VisualVariable'] as const;

    openModal({
      title: 'Component Menu',
      node: (
        <AddComponentPopup
          kinds={kinds as any}
          initialVisualVars={d.visualVars ?? []}
          initialGraphTypes={d.graphTypes ?? []}
          onCancel={closeModal}
          onSave={(payload) => {
            if (payload.kind === 'GraphType') {
              window.dispatchEvent(
                new CustomEvent('designer:edit-graphs', {
                  detail: {
                    parentId: p.node.id,
                    graphTypes: payload.graphTypes,
                  },
                })
              );
              closeModal();
              return;
            }
            if (payload.kind === 'VisualVariable') {
              p.onChange({ visualVars: payload.variables });
              closeModal();
              return;
            }
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

      <TypeField value="Tooltip" />

      <SectionTitle>Actions</SectionTitle>

      {/* --- RESTORED: Add Component Section --- */}
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
                // FIXED: Updated signature
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
                // FIXED: Updated signature
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

      {/* Interaction list */}
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

      <DescriptionSection
        placeholder="Describe this tooltip"
        value={d.description}
        disabled={disabled}
        onChange={(val) => p.onChange({ description: val })}
      />
    </div>
  );
}
