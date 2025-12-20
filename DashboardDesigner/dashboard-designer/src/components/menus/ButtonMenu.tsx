import type { KindProps } from './common';
import type { DataItem, Interaction } from '../../domain/types';
import {
  NameField,
  TypeField,
  ListSection,
  SectionTitle,
  type StyledListItem,
} from './sections';
import { nanoid } from 'nanoid';
import { useModal } from '../ui/ModalHost';
import DataPopup from '../popups/DataPopup';

type ExtendedKindProps = KindProps & {
  nodeNames?: Record<string, string>;
};

export default function ButtonMenu(p: ExtendedKindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;
  const { openModal, closeModal } = useModal();

  const handleToggleHidden = (
    category: 'data' | 'interactions',
    val: boolean
  ) => {
    const nextCats = { ...(d.collapsedCategories || {}), [category]: val };
    p.onChange({ collapsedCategories: nextCats } as any);
    window.dispatchEvent(
      new CustomEvent('designer:toggle-hidden', {
        detail: { nodeId: p.node.id, category, hidden: val },
      })
    );
  };

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

  const interactionListItems: (StyledListItem & {
    _interactionId: string;
    _targetId?: string;
    _targetDataRef?: string;
  })[] = [];

  interactions.forEach((ix) => {
    if (ix.targetDetails && ix.targetDetails.length > 0) {
      ix.targetDetails.forEach((detail) => {
        const targetName =
          p.nodeNames?.[detail.targetId] || detail.targetId || 'Unknown';
        let subtitle = `Target: ${targetName}`;
        if (detail.targetDataRef) subtitle += ' (Data)';
        interactionListItems.push({
          name: ix.name,
          badge: ix.result,
          subtitle,
          _interactionId: ix.id,
          _targetId: detail.targetId,
          _targetDataRef: detail.targetDataRef,
        });
      });
    } else if (ix.targets && ix.targets.length > 0) {
      ix.targets.forEach((targetId) => {
        const targetName = p.nodeNames?.[targetId] || targetId;
        interactionListItems.push({
          name: ix.name,
          badge: ix.result,
          subtitle: `Target: ${targetName}`,
          _interactionId: ix.id,
          _targetId: targetId,
        });
      });
    } else {
      interactionListItems.push({
        name: ix.name,
        badge: ix.result,
        subtitle: '(No target)',
        _interactionId: ix.id,
      });
    }
  });

  const dataList = d.data as (string | DataItem)[] | undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>
      <SectionTitle>Properties</SectionTitle>
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />
      <TypeField value="Button" />

      <SectionTitle>Actions</SectionTitle>

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
                  p.onChange({
                    data: items,
                  } as any);
                  closeModal();
                }}
              />
            ),
          })
        }
        onItemClick={(index) => {
          openModal({
            title: 'Data fields',
            node: (
              <DataPopup
                initial={toDataItems(dataList)}
                initialSelectedIndex={index}
                onCancel={closeModal}
                onSave={(items: DataItem[]) => {
                  p.onChange({
                    data: items,
                  } as any);
                  closeModal();
                }}
              />
            ),
          });
        }}
        addTooltip="Associate data"
        disabled={disabled}
      />

      <ListSection
        title="Interaction list"
        items={interactionListItems}
        onAdd={() => {
          window.dispatchEvent(
            new CustomEvent('designer:open-interactions', {
              detail: { nodeId: p.node.id },
            })
          );
        }}
        onItemClick={(i) => {
          const item = interactionListItems[i];
          if (item) {
            window.dispatchEvent(
              new CustomEvent('designer:select-interaction', {
                detail: {
                  interactionId: item._interactionId,
                  targetId: item._targetId,
                  targetDataRef: item._targetDataRef,
                },
              })
            );
          }
        }}
        addTooltip="Add interaction"
        disabled={disabled}
        hidden={d.collapsedCategories?.interactions}
        onToggleHidden={(v) => handleToggleHidden('interactions', v)}
      />
    </div>
  );
}
