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
  DescriptionSection,
} from './sections';
import { useModal } from '../ui/ModalHost';
import { allowedChildKinds } from '../../domain/rules';
import AddComponentPopup from '../popups/ComponentPopup';

export default function TooltipMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  // Data list can be strings or DataItem objects
  const dataList: (string | DataItem)[] = d.data ?? [];

  const { openDataModal, openModal, closeModal } = useModal();

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
          onCancel={closeModal}
          onSave={(payload) => {
            if (payload.kind === 'GraphType') {
              window.dispatchEvent(
                new CustomEvent('designer:set-graph-type', {
                  detail: {
                    nodeId: p.node.id,
                    graphType: payload.graphType as GraphType,
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
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      {/*  Name Section */}
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />

      {/* Type Section */}
      <TypeField value="Tooltip" />

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

      {/* Description Section */}
      <DescriptionSection
        placeholder="Describe this tooltip"
        value={d.description}
        disabled={disabled}
        onChange={(val) => p.onChange({ description: val })} // <- adapt string → patch
      />
    </div>
  );
}
