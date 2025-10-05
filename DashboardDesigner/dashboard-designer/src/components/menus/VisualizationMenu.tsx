import type { KindProps } from './common';
import type {
  DataItem,
  GraphType,
  NodeKind,
  VisualVariable,
} from '../../domain/types';
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
  const { openDataModal, openModal, closeModal } = useModal();

  const objectives: string[] = d.objectives ?? [];
  const interactions: string[] = d.interactions ?? [];
  const tooltips: string[] = d.tooltips ?? [];
  const dataList: (string | DataItem)[] = d.data ?? [];

  const openTooltipsModal = () => {
    window.dispatchEvent(
      new CustomEvent('designer:open-tooltips', {
        detail: { nodeId: p.node.id },
      })
    );
  };

  const handleAddComponent = () => {
    const parentKind = (p.node.data?.kind ?? 'Visualization') as NodeKind;
    const baseKinds = allowedChildKinds(parentKind); // NodeKind[]
    const kinds = [...baseKinds, 'GraphType', 'VisualVariable'] as const;

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
            if (payload.kind === 'GraphType') {
              window.dispatchEvent(
                new CustomEvent('designer:update-visualization-props', {
                  detail: {
                    nodeId: p.node.id,
                    patch: { graphType: payload.graphType as GraphType },
                  },
                })
              );
            } else if (payload.kind === 'VisualVariable') {
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
            } else {
              // regular child component -> let Editor create it
              window.dispatchEvent(
                new CustomEvent('designer:add-component', {
                  detail: { parentId: p.node.id, payload },
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

      <ListSection
        title="Tooltips"
        items={tooltips}
        onAdd={openTooltipsModal}
        addTooltip="Associate tooltip"
        disabled={disabled}
      />
    </div>
  );
}
