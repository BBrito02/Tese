import { WhiteField, type KindProps } from './common';
import { TypeField, ListAttributesSection, SectionTitle } from './sections';
import type { DataItem, GraphType } from '../../domain/types';
import { GRAPH_TYPE_ICONS } from '../../domain/icons';
import { useModal } from '../ui/ModalHost';
import GraphFieldsPopup from '../popups/GraphFieldsPopup';
import { LuPlus } from 'react-icons/lu';

function namesFromParent(data?: (string | DataItem)[]): string[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((it) => (typeof it === 'string' ? it : it?.name))
    .filter(Boolean) as string[];
}

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
  const columns: string[] = Array.isArray(d.columns) ? d.columns : [];
  const rows: string[] = Array.isArray(d.rows) ? d.rows : [];

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
          onCancel={closeModal}
          onSave={({ columns: c, rows: r }) => {
            p.onChange({ columns: constrain(c), rows: constrain(r) } as any);
            closeModal();
          }}
        />
      ),
    });
  };

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

      {/* Graph Fields header with + button */}
      <div style={headerRow}>
        <div
          style={{
            marginTop: 18,
            marginBottom: 6,
            fontSize: 14,
            fontWeight: 600, // ← bold
            color: '#0f172a', // slate-900 (strong, readable)
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

      {/* Current Columns */}
      <ListAttributesSection
        title="Columns"
        items={columns}
        disabled={disabled}
        onRemove={(idx) => {
          const next = columns.filter((_, i) => i !== idx);
          p.onChange({ columns: next } as any);
        }}
      />

      {/* Current Rows */}
      <ListAttributesSection
        title="Rows"
        items={rows}
        disabled={disabled}
        onRemove={(idx) => {
          const next = rows.filter((_, i) => i !== idx);
          p.onChange({ rows: next } as any);
        }}
      />
    </div>
  );
}
