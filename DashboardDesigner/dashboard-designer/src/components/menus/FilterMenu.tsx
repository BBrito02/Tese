import React from 'react';
import { LuPlus, LuPencil, LuTag } from 'react-icons/lu';
import type { KindProps } from './common';
import { WhiteField, GhostLine } from './common';
import type { DataItem } from '../../domain/types';

export default function FilterMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const headerRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const dtypeBadge: React.CSSProperties = {
    marginLeft: 6,
    padding: '2px 6px',
    borderRadius: 999,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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

  // array list of the data attributes
  const dataList: (string | DataItem)[] = d.data ?? [];

  // array list of the interactions (to be done)
  const interactions: string[] = d.interactions ?? [];

  const labelOf = (v: string | DataItem) =>
    typeof v === 'string' ? v : v.name;
  const typeOf = (v: string | DataItem) =>
    typeof v === 'string' ? undefined : v.dtype;

  // function that prints the lists of elements
  const Chips = ({ items }: { items: Array<string | DataItem> }) =>
    items.length === 0 ? (
      <div style={{ marginTop: 8 }}>
        <div style={GhostLine} />
      </div>
    ) : (
      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {items.map((it, i) => {
          const label = labelOf(it);
          const dtype = typeOf(it);
          return (
            <span
              key={`${label}-${i}`}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 999,
                background: '#eef2ff',
                border: '1px solid #c7d2fe',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title={dtype ? `${label} · ${dtype}` : label}
            >
              {label}
              {dtype && <span style={dtypeBadge}>{dtype}</span>}
            </span>
          );
        })}
      </div>
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      {/* Component name */}
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
            placeholder="Filter name"
            value={d.title ?? ''}
            onChange={(e) => p.onChange({ title: e.target.value })}
            disabled={disabled}
            style={{ ...WhiteField, paddingRight: 34 }}
          />
          <LuPencil size={16} style={smallIconRight} />
        </div>
      </div>

      {/* Component type */}
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
            value="Filter"
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

      {/* Data list */}
      <div>
        <div style={headerRow}>
          <label style={{ fontSize: 12, opacity: 0.8 }}>Data list</label>
          <button
            type="button"
            title="Associate data"
            disabled={disabled}
            style={{ ...roundIconBtn, opacity: disabled ? 0.6 : 1 }}
            onClick={() => p.onOpen?.('data')}
          >
            <LuPlus size={16} />
          </button>
        </div>
        <Chips items={dataList} />
      </div>

      {/* Interaction list */}
      <div>
        <div style={headerRow}>
          <label style={{ fontSize: 12, opacity: 0.8 }}>Interaction list</label>
          <button
            type="button"
            title="Add interaction (not implemented)"
            disabled={disabled}
            style={{ ...roundIconBtn, opacity: disabled ? 0.6 : 1 }}
          >
            <LuPlus size={16} />
          </button>
        </div>
        <Chips items={interactions} />
      </div>
    </div>
  );
}
