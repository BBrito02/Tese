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

export default function LegendMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const dataList: (string | DataItem)[] = d.data ?? [];

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

  const { openDataModal, openModal, closeModal } = useModal();

  const handleAddComponent = () => {
    const parentKind = (p.node.data?.kind ?? 'Visualization') as NodeKind;
    const baseKinds = allowedChildKinds(parentKind); // NodeKind[]
    const kinds = [...baseKinds, 'VisualVariable'] as const;

    openModal({
      title: 'Component Menu',
      node: (
        <AddComponentPopup
          kinds={
            kinds as unknown as (NodeKind | 'GraphType' | 'VisualVariable')[]
          }
          onCancel={closeModal}
          onSave={(payload) => {
            // Route by payload.kind
            if (payload.kind === 'VisualVariable') {
              window.dispatchEvent(
                new CustomEvent('designer:update-visualization-props', {
                  detail: {
                    nodeId: p.node.id,
                    patch: {
                      visualVars: payload.variables as VisualVariable[],
                    },
                  },
                })
              );
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
        items={interactionLabels}
        // onAdd={() => {
        //   window.dispatchEvent(
        //     new CustomEvent('designer:open-interactions', {
        //       detail: { nodeId: p.node.id },
        //     })
        //   );
        // }}
        onAdd={() => {}}
        addTooltip="Add interaction"
        disabled={disabled}
      />
    </div>
  );
}
