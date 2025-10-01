import type { KindProps } from './common';
import type { DataItem } from '../../domain/types';
import { NameField, TypeField, ListSection } from './sections';

import { useModal } from '../ui/ModalHost';
import DataPopup from '../popups/DataPopup';

export default function VisualizationMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;
  const { openModal, closeModal } = useModal();

  const objectives: string[] = d.objectives ?? [];
  const interactions: string[] = d.interactions ?? [];
  const tooltips: string[] = d.tooltips ?? [];
  const dataList: (string | DataItem)[] = d.data ?? [];

  // normalize (string | DataItem)[] -> DataItem[]
  const initialData: DataItem[] = dataList.map((v) =>
    typeof v === 'string' ? { name: v, dtype: 'Other' } : v
  );

  const openDataModal = () => {
    openModal({
      title: 'Data menu',
      node: (
        <DataPopup
          initial={initialData}
          onCancel={closeModal}
          onSave={(items) => {
            p.onChange({ data: items });
            closeModal();
          }}
        />
      ),
    });
  };

  const openTooltipsModal = () => {
    window.dispatchEvent(
      new CustomEvent('designer:open-tooltips', {
        detail: { nodeId: p.node.id },
      })
    );
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

      <ListSection
        title="Data list"
        items={dataList}
        onAdd={openDataModal}
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
