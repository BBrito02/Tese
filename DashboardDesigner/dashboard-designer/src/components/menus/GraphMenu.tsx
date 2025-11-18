import { WhiteField, type KindProps } from './common';
import {
  TypeField,
  ListAttributesSection,
  SectionTitle,
  DescriptionSection,
} from './sections';
import type { DataItem, GraphType, VisualVariable } from '../../domain/types';
import { GRAPH_TYPE_ICONS, VISUAL_VAR_ICONS } from '../../domain/icons';
import { useModal } from '../ui/ModalHost';
import GraphFieldsPopup from '../popups/GraphFieldsPopup';
import GraphMarkPopup from '../popups/GraphMarkPopup';
import { LuPlus } from 'react-icons/lu';
import { GrBladesHorizontal, GrBladesVertical } from 'react-icons/gr';
import type { ListItem } from './sections';

function namesFromParent(data?: (string | DataItem)[]): string[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((it) => (typeof it === 'string' ? it : it?.name))
    .filter(Boolean) as string[];
}

const vvIcon = (k: 'Color' | 'Size' | 'Shape' | 'Text') => (
  <img
    src={VISUAL_VAR_ICONS[k]}
    alt={k}
    style={{ width: 16, height: 16, objectFit: 'contain', opacity: 0.9 }}
  />
);

// local header row & round icon (mirrors sections.tsx)
const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 12,
  paddingBottom: 3,
  borderBottom: '1px solid #e5e7eb',
};

const roundIconBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  cursor: 'pointer',
  color: '#fff',
  background: '#38bdf8',
};

export default function GraphMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;
  const gt = (p.node.data as any)?.graphType as GraphType | undefined;
  const { openModal, closeModal } = useModal();

  // Prefer parent visualization data; fallback to local data
  const available = namesFromParent((p as any).parentData ?? d?.data);
  const columns = Array.isArray(d.columns) ? (d.columns as string[]) : [];
  const rows = Array.isArray(d.rows) ? (d.rows as string[]) : [];
  const availableRaw = ((p as any).parentData ?? d?.data ?? []) as (
    | string
    | DataItem
  )[];

  // Build a fast lookup: name -> DataItem (if present)
  const dataIndex = new Map<string, DataItem>();
  for (const it of availableRaw) {
    if (typeof it !== 'string' && it?.name) {
      dataIndex.set(it.name, it);
    }
  }

  const asListItems = (names: string[]): ListItem[] =>
    names.map((n) => dataIndex.get(n) ?? n);

  const constrain = (vals: string[]) =>
    available.length ? vals.filter((v) => available.includes(v)) : vals;

  const openFieldsPopup = () => {
    openModal({
      title: 'Graph fields',
      node: (
        <GraphFieldsPopup
          available={available}
          initialColumns={columns}
          initialRows={rows}
          graphType={gt}
          onCancel={closeModal}
          onSave={({ columns: c, rows: r }) => {
            p.onChange({ columns: constrain(c), rows: constrain(r) } as any);
            closeModal();
          }}
        />
      ),
    });
  };

  // ---------- MARKS ----------
  const marks = (d.marks ?? {}) as {
    color?: string | null;
    size?: string | null;
    shape?: string | null;
    text?: string | null;
  };

  const openMarksPopup = () => {
    openModal({
      title: 'Graph Marks',
      node: (
        <GraphMarkPopup
          available={availableRaw}
          initial={marks}
          graphType={gt}
          onCancel={closeModal}
          onSave={(next) => {
            // 1) persist marks on the graph
            p.onChange({ marks: next } as any);

            // 2) auto-ensure corresponding visual variables on parent Visualization
            const need: VisualVariable[] = [];
            if (next.color) need.push('Color');
            if (next.size) need.push('Size');
            if (next.shape) need.push('Shape');
            if (next.text) need.push('Text');

            if (need.length) {
              const parentId = (p.node as any)?.parentNode; // React Flow parent
              if (parentId) {
                window.dispatchEvent(
                  new CustomEvent('designer:ensure-visual-vars', {
                    detail: { parentId, vars: need },
                  })
                );
              }
            }

            closeModal();
          }}
        />
      ),
    });
  };

  // Prepare ListItem[] for rows/columns and marks (so dtype badge appears)
  const columnsItems: ListItem[] = asListItems(columns);
  const rowsItems: ListItem[] = asListItems(rows);

  const colorItems: ListItem[] = marks.color
    ? [dataIndex.get(marks.color) ?? marks.color]
    : [];
  const sizeItems: ListItem[] = marks.size
    ? [dataIndex.get(marks.size) ?? marks.size]
    : [];
  const shapeItems: ListItem[] = marks.shape
    ? [dataIndex.get(marks.shape) ?? marks.shape]
    : [];
  const textItems: ListItem[] = marks.text
    ? [dataIndex.get(marks.text) ?? marks.text]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      <SectionTitle>Properties</SectionTitle>
      <TypeField value="Graph" />

      {/* Graph type (read-only, with icon) */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 6,
            paddingLeft: 6,
          }}
        >
          Graph type
        </label>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            value={gt ?? '(none)'}
            readOnly
            disabled
            style={{
              ...WhiteField,
              width: '100%',
              paddingRight: 40,
              color: '#0f172a',
              opacity: 1,
              fontWeight: 600,
            }}
          />
          {gt && (
            <img
              src={GRAPH_TYPE_ICONS[gt]}
              alt={gt}
              style={{
                position: 'absolute',
                right: 8,
                width: 26,
                height: 26,
                objectFit: 'contain',
                borderRadius: 6,
                background: '#f8fafc',
                padding: 4,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>

      {/* Description Section */}
      <DescriptionSection
        placeholder="Describe this tooltip"
        value={d.description}
        disabled={disabled}
        onChange={(val) => p.onChange({ description: val })} // <- adapt string → patch
      />

      {/* Graph Fields header with + button */}
      <div style={headerRow}>
        <div
          style={{
            marginTop: 18,
            marginBottom: 6,
            fontSize: 14,
            fontWeight: 600,
            color: '#0f172a',
            paddingBottom: 3,
          }}
        >
          Graph Fields
        </div>
        <button
          type="button"
          title="Edit fields"
          onClick={openFieldsPopup}
          disabled={disabled}
          style={{ ...roundIconBtn, opacity: disabled ? 0.6 : 1 }}
        >
          <LuPlus size={16} />
        </button>
      </div>

      {/* Current Columns (chips with dtype) */}
      <ListAttributesSection
        title="Columns"
        items={columnsItems}
        disabled={disabled}
        onRemove={(idx) => {
          const next = columns.filter((_, i) => i !== idx);
          p.onChange({ columns: next } as any);
        }}
        icon={<GrBladesHorizontal size={16} />}
      />

      {/* Current Rows (chips with dtype) */}
      <ListAttributesSection
        title="Rows"
        items={rowsItems}
        disabled={disabled}
        onRemove={(idx) => {
          const next = rows.filter((_, i) => i !== idx);
          p.onChange({ rows: next } as any);
        }}
        icon={<GrBladesVertical size={16} />}
      />

      {/* ---- Marks section + popup ---- */}
      <div style={headerRow}>
        <div
          style={{
            marginTop: 18,
            marginBottom: 6,
            fontSize: 14,
            fontWeight: 600,
            color: '#0f172a',
            paddingBottom: 3,
          }}
        >
          Graph Marks
        </div>
        <button
          type="button"
          title="Edit marks"
          onClick={openMarksPopup}
          disabled={disabled}
          style={{ ...roundIconBtn, opacity: disabled ? 0.6 : 1 }}
        >
          <LuPlus size={16} />
        </button>
      </div>

      {/* Color */}
      <ListAttributesSection
        title="Color"
        items={colorItems}
        disabled={disabled}
        onRemove={() => p.onChange({ marks: { ...marks, color: null } } as any)}
        icon={vvIcon('Color')}
      />

      {/* Size */}
      <ListAttributesSection
        title="Size"
        items={sizeItems}
        disabled={disabled}
        onRemove={() => p.onChange({ marks: { ...marks, size: null } } as any)}
        icon={vvIcon('Size')}
      />

      {/* Shape */}
      <ListAttributesSection
        title="Shape"
        items={shapeItems}
        disabled={disabled}
        onRemove={() => p.onChange({ marks: { ...marks, shape: null } } as any)}
        icon={vvIcon('Shape')}
      />

      {/* Text */}
      <ListAttributesSection
        title="Text"
        items={textItems}
        disabled={disabled}
        onRemove={() => p.onChange({ marks: { ...marks, text: null } } as any)}
        icon={vvIcon('Text')}
      />
    </div>
  );
}
