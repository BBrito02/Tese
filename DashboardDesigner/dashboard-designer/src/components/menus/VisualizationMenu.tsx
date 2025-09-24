import type { KindProps } from './common';
import type { DataItem } from '../../domain/types';
import { NameField, TypeField, ListSection } from './sections';

export default function VisualizationMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const objectives: string[] = d.objectives ?? [];
  const interactions: string[] = d.interactions ?? [];
  const tooltips: string[] = d.tooltips ?? [];
  const dataList: (string | DataItem)[] = d.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />
      <TypeField value="Visualization" />

      {/* Data List Section */}
      <ListSection
        title="Data list"
        items={dataList}
        onAdd={() => p.onOpen?.('data')}
        addTooltip="Associate data"
        disabled={disabled}
      />

      {/* Objectives Section */}
      <ListSection
        title="Objectives"
        items={objectives}
        onAdd={() => {
          /* hook later */
        }}
        addTooltip="Add objective"
        disabled={disabled}
      />

      {/* Interaction Section */}
      <ListSection
        title="Interaction list"
        items={interactions}
        onAdd={() => {
          /* hook later */
        }}
        addTooltip="Add interaction"
        disabled={disabled}
      />

      {/* Tooltips Section */}
      <ListSection
        title="Tooltips"
        items={tooltips}
        onAdd={() => p.onOpen?.('tooltips')}
        addTooltip="Associate tooltip"
        disabled={disabled}
      />
    </div>
  );
}
