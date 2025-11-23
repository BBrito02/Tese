// src/components/menus/LegendMenu.tsx

import type { KindProps } from './common';
import {
  NameField,
  TypeField,
  ListSection,
  AddComponentSection,
  SectionTitle,
} from './sections';
import type {
  DataItem,
  Interaction,
  NodeKind,
  VisualVariable,
} from '../../domain/types';
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

  // store is Interaction[], ListSection wants strings -> format them
  const interactions: Interaction[] = Array.isArray(d.interactions)
    ? (d.interactions as Interaction[])
    : [];
  const interactionLabels: string[] = interactions.map((ix) => {
    const tgtCount = Array.isArray(ix.targets) ? ix.targets.length : 0;
    return `${ix.name} · ${ix.trigger}/${ix.result} · ${tgtCount} target${
      tgtCount === 1 ? '' : 's'
    }`;
  });

  const { openModal, closeModal } = useModal();

  const handleAddComponent = () => {
    const parentKind = (p.node.data?.kind ?? 'Visualization') as NodeKind;
    const baseKinds = allowedChildKinds(parentKind); // NodeKind[]

    // Allow VisualVariable to be added
    const kinds = [...baseKinds, 'VisualVariable'] as const;

    openModal({
      title: 'Component Menu',
      node: (
        <AddComponentPopup
          kinds={
            kinds as unknown as (NodeKind | 'GraphType' | 'VisualVariable')[]
          }
          initialVisualVars={d.visualVars ?? []} // Pass current vars so popup shows them checked
          onCancel={closeModal}
          onSave={(payload) => {
            // Route by payload.kind
            if (payload.kind === 'VisualVariable') {
              // FIX: Use p.onChange directly to update the node data
              p.onChange({ visualVars: payload.variables } as any);

              closeModal();
              return;
            }

            // Handle other adds if necessary
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
        items={interactionLabels}
        onAdd={() => {
          window.dispatchEvent(
            new CustomEvent('designer:open-interactions', {
              detail: { nodeId: p.node.id },
            })
          );
        }}
        addTooltip="Add interaction"
        disabled={disabled}
      />
    </div>
  );
}
