import type { KindProps } from './common';
import { WhiteField } from './common';
import type { DataItem } from '../../domain/types';
import { NameField, TypeField, ListSection } from './sections';
import { useModal } from '../ui/ModalHost';

export default function TooltipMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  // Data list can be strings or DataItem objects
  const dataList: (string | DataItem)[] = d.data ?? [];

  const { openDataModal } = useModal();

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
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 6,
          }}
        >
          Description
        </label>
        <textarea
          placeholder="Describe this tooltip"
          value={d.description ?? ''}
          onChange={(e) => p.onChange({ description: e.target.value })}
          disabled={disabled}
          rows={4}
          style={{ ...WhiteField, resize: 'vertical' as const }}
        />
      </div>
    </div>
  );
}
