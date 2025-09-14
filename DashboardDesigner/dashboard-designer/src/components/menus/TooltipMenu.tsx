import React from 'react';
import { LuPlus, LuPencil, LuTag } from 'react-icons/lu';
import type { KindProps } from './common';
import { WhiteField, GhostLine } from './common';

export default function TooltipMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;
  const dataList: string[] = d.data ?? [];

  const headerRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const smallIconRight: React.CSSProperties = {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    pointerEvents: 'none',
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      {/* Component name (editable) */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 6,
          }}
        >
          Component name
        </label>
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Tooltip name"
            value={d.title ?? ''}
            onChange={(e) => p.onChange({ title: e.target.value })}
            disabled={disabled}
            style={{ ...WhiteField, paddingRight: 34 }}
          />
          <LuPencil size={16} style={smallIconRight} />
        </div>
      </div>

      {/* Component type (read-only) */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 6,
          }}
        >
          Component type
        </label>
        <div style={{ position: 'relative' }}>
          <input
            value="Tooltip"
            readOnly
            disabled
            style={{
              ...WhiteField,
              paddingRight: 34,
              opacity: 1,
              color: '#0f172a',
            }}
          />
          <LuTag size={16} style={smallIconRight} />
        </div>
      </div>

      {/* Data list (header + action button) */}
      <div>
        <div style={headerRow}>
          <label style={{ fontSize: 12, opacity: 0.8 }}>Data list</label>
          <button
            type="button"
            title="Associate data (not implemented)"
            disabled={disabled}
            style={{ ...roundIconBtn, opacity: disabled ? 0.6 : 1 }}
            // onClick={() => {}}
          >
            <LuPlus size={16} />
          </button>
        </div>

        {/* list or single blank placeholder */}
        <div style={{ marginTop: 8 }}>
          {dataList.length === 0 ? (
            <div style={GhostLine} />
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {dataList.map((it, i) => (
                <span
                  key={`${it}-${i}`}
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                  }}
                  title={it}
                >
                  {it}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
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
