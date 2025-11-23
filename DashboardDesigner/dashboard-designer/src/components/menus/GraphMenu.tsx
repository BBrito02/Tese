import { useRef, useState, useEffect } from 'react';
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
import { LuPlus, LuImagePlus, LuTrash2, LuLoader } from 'react-icons/lu';
import { GrBladesHorizontal, GrBladesVertical } from 'react-icons/gr';
import type { ListItem } from './sections';

// Import Local Store Utils
import {
  saveLocalImage,
  getLocalImageSrc,
  deleteLocalImage,
} from '../../utils/localStore';

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

  // --- IMAGE LOGIC ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get the ID from node data
  const imageId = d.previewImageId as string | undefined;
  const [viewableSrc, setViewableSrc] = useState<string | null>(null);

  // 1. Load the image from DB when the menu opens or ID changes
  useEffect(() => {
    let active = true;
    if (imageId) {
      getLocalImageSrc(imageId).then((src) => {
        if (active) setViewableSrc(src);
      });
    } else {
      setViewableSrc(null);
    }
    return () => {
      active = false;
    };
  }, [imageId]);

  // 2. Handle Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Save to browser DB
      const newId = await saveLocalImage(file);
      // Save ID to Node Data
      p.onChange({ previewImageId: newId } as any);
    } catch (err) {
      console.error(err);
      alert('Failed to save image locally.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // 3. Handle Remove
  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageId) {
      await deleteLocalImage(imageId); // Clean up DB
    }
    p.onChange({ previewImageId: undefined } as any);
  };

  // 4. Handle Zoom
  const handleZoomImage = () => {
    if (!viewableSrc) return;
    openModal({
      title: 'Reference Image',
      node: (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 10,
            background: '#fff',
          }}
        >
          <img
            src={viewableSrc}
            alt="Reference"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 4,
            }}
          />
        </div>
      ),
    });
  };
  // -------------------

  const available = namesFromParent((p as any).parentData ?? d?.data);
  const columns = Array.isArray(d.columns) ? (d.columns as string[]) : [];
  const rows = Array.isArray(d.rows) ? (d.rows as string[]) : [];
  const availableRaw = ((p as any).parentData ?? d?.data ?? []) as (
    | string
    | DataItem
  )[];

  const dataIndex = new Map<string, DataItem>();
  for (const it of availableRaw) {
    if (typeof it !== 'string' && it?.name) dataIndex.set(it.name, it);
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
            p.onChange({ marks: next } as any);
            const need: VisualVariable[] = [];
            if (next.color) need.push('Color');
            if (next.size) need.push('Size');
            if (next.shape) need.push('Shape');
            if (next.text) need.push('Text');

            if (need.length) {
              const parentId = (p.node as any)?.parentNode;
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

      <DescriptionSection
        placeholder="Describe this graph"
        value={d.description}
        disabled={disabled}
        onChange={(val) => p.onChange({ description: val })}
      />

      {/* --- REFERENCE IMAGE SECTION --- */}
      <div style={{ marginTop: 4 }}>
        <SectionTitle>Reference Image</SectionTitle>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          hidden
          onChange={handleImageUpload}
        />

        {viewableSrc ? (
          <div
            onClick={handleZoomImage}
            title="Click to zoom"
            style={{
              position: 'relative',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 120,
              cursor: 'zoom-in',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = '#94a3b8')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = '#e5e7eb')
            }
          >
            <img
              src={viewableSrc}
              alt="Graph preview"
              style={{
                maxWidth: '100%',
                maxHeight: 180,
                objectFit: 'contain',
                display: 'block',
              }}
            />
            {!disabled && (
              <button
                onClick={handleRemoveImage}
                title="Remove image"
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ef4444',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
              >
                <LuTrash2 size={16} />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isProcessing}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 16,
              border: '1px dashed #cbd5e1',
              borderRadius: 8,
              background: '#f8fafc',
              cursor: disabled || isProcessing ? 'default' : 'pointer',
              color: '#64748b',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!disabled && !isProcessing) {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#94a3b8';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !isProcessing) {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }
            }}
          >
            {isProcessing ? (
              <>
                <LuLoader
                  size={24}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                <div style={{ fontSize: 12, fontWeight: 500 }}>
                  Processing...
                </div>
              </>
            ) : (
              <>
                <LuImagePlus size={24} style={{ opacity: 0.7 }} />
                <div style={{ fontSize: 12, fontWeight: 500 }}>
                  Upload Screenshot
                </div>
              </>
            )}
          </button>
        )}
      </div>
      {/* ------------------------------------------ */}

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

      <ListAttributesSection
        title="Color"
        items={colorItems}
        disabled={disabled}
        onRemove={() => p.onChange({ marks: { ...marks, color: null } } as any)}
        icon={vvIcon('Color')}
      />
      <ListAttributesSection
        title="Size"
        items={sizeItems}
        disabled={disabled}
        onRemove={() => p.onChange({ marks: { ...marks, size: null } } as any)}
        icon={vvIcon('Size')}
      />
      <ListAttributesSection
        title="Shape"
        items={shapeItems}
        disabled={disabled}
        onRemove={() => p.onChange({ marks: { ...marks, shape: null } } as any)}
        icon={vvIcon('Shape')}
      />
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
