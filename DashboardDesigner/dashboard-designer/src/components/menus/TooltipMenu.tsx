import type { KindProps } from './common';
import type { DataItem, NodeKind } from '../../domain/types';
import {
  NameField,
  TypeField,
  ListSection,
  AddComponentSection,
  DescriptionSection,
  SectionTitle,
} from './sections';
import { useModal } from '../ui/ModalHost';
import { allowedChildKinds } from '../../domain/rules';
import AddComponentPopup from '../popups/ComponentPopup';
import DataPopup from '../popups/DataPopup';

export default function TooltipMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  // Data list can be strings or DataItem objects
  const dataList = d.data as (string | DataItem)[] | undefined;

  const toDataItems = (list?: (string | DataItem)[]): DataItem[] =>
    Array.isArray(list)
      ? list.map((v) =>
          typeof v === 'string' ? { name: v, dtype: 'Other' } : v
        )
      : [];

  const { openModal, closeModal } = useModal();

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      <SectionTitle>Properties</SectionTitle>

      {/*  Name Section */}
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />

      {/* Type Section */}
      <TypeField value="Tooltip" />

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
                  // If you’re standardizing on DataItem[], keep as-is:
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
