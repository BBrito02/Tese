// VisualizationMenu.tsx
import type { KindProps } from './common';
import type { DataItem, NodeKind, Interaction } from '../../domain/types';
import {
  NameField,
  TypeField,
  ListSection,
  AddComponentSection,
} from './sections';
import { useModal } from '../ui/ModalHost';
import { allowedChildKinds } from '../../domain/rules';
import AddComponentPopup from '../popups/ComponentPopup';

export default function VisualizationMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;
  const { openModal, closeModal, openDataModal } = useModal();

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

  const tooltips: string[] = d.tooltips ?? [];
  const dataList: (string | DataItem)[] = d.data ?? [];

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
          initialGraphTypes={d.graphTypes ?? []} // ← preselect
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
            // default child add
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

  // ... the rest of the menu (data list, objectives, etc.) unchanged ...
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />
      <TypeField value="Visualization" />

      <AddComponentSection
        title="Add component"
        disabled={disabled}
        onAdd={handleAddComponent}
      />

      <ListSection
        title="Data list"
        items={dataList}
        onAdd={() =>
          openDataModal(dataList, (items) => p.onChange({ data: items }))
        }
        addTooltip="Associate data"
        disabled={disabled}
      />

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
      <ListSection
        title="Tooltips"
        items={tooltips}
        onAdd={() => {
          window.dispatchEvent(
            new CustomEvent('designer:open-tooltips', {
              detail: { nodeId: p.node.id },
            })
          );
        }}
        addTooltip="Associate tooltip"
        disabled={disabled}
      />
    </div>
  );
}
