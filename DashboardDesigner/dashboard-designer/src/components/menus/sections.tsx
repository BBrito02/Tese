// src/components/menus/sections.tsx
import React, { useState } from 'react';
import { LuPlus, LuPencil, LuTag } from 'react-icons/lu';
import type { DataItem } from '../../domain/types';
import { WhiteField, GhostLine } from './common';

export type ListItem = string | DataItem;

// badge css
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

// react-icons css
const smallIconRight: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#64748b',
  pointerEvents: 'none',
};

// popup activation button css
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

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

// label of the component
const labelOf = (v: ListItem) => (typeof v === 'string' ? v : v.name);

// type of the component
const typeOf = (v: ListItem) => (typeof v === 'string' ? undefined : v.dtype);

// function that prints the data attributes
export function Chips({ items }: { items: ListItem[] }) {
  if (!items?.length) {
    return (
      <div style={{ marginTop: 8 }}>
        <div style={GhostLine} />
      </div>
    );
  }
  return (
    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map((it, i) => {
        const label = labelOf(it);
        const dtype = typeOf(it);
        return (
          <span
            key={`${label}-${dtype ?? ''}-${i}`}
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
}

// name field section
export function NameField(props: {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (val: string) => void;
}) {
  const { value, onChange, disabled, placeholder = 'Component name' } = props;
  return (
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
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{ ...WhiteField, paddingRight: 34 }}
        />
        <LuPencil size={16} style={smallIconRight} />
      </div>
    </div>
  );
}

// type field section
export function TypeField(props: { value: string }) {
  return (
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
          value={props.value}
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
  );
}

/**
 * Generic section that shows a title, optional (+) button, and a chip list.
 * Use `items` as string[] or DataItem[]. If the list is empty, shows GhostLine.
 */
export function ListSection(props: {
  title: string;
  items: ListItem[];
  onAdd?: () => void;
  addTooltip?: string;
  disabled?: boolean;
}) {
  const { title, items, onAdd, addTooltip, disabled } = props;
  return (
    <div>
      <div style={headerRow}>
        <label style={{ fontSize: 12, opacity: 0.8 }}>{title}</label>
        {onAdd && (
          <button
            type="button"
            title={addTooltip ?? 'Add'}
            disabled={disabled}
            style={{ ...roundIconBtn, opacity: disabled ? 0.6 : 1 }}
            onClick={onAdd}
          >
            <LuPlus size={16} />
          </button>
        )}
      </div>
      <Chips items={items} />
    </div>
  );
}

/** Reusable add/remove string list with chips */
export function OptionsSection({
  title = 'Options',
  placeholder = 'Enter option',
  addTooltip = 'Add option',
  items,
  onChange,
  disabled,
}: {
  title?: string;
  placeholder?: string;
  addTooltip?: string;
  items: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState('');

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

  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...(items ?? []), v]);
    setInput('');
  };

  const remove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          opacity: 0.8,
          marginBottom: 6,
        }}
      >
        {title}
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
          disabled={disabled}
          style={{ ...WhiteField, flex: 1, paddingRight: 10 }}
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || !input.trim()}
          style={{
            ...roundIconBtn,
            opacity: disabled || !input.trim() ? 0.6 : 1,
          }}
          title={addTooltip}
        >
          <LuPlus size={16} />
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {items.map((it, i) => (
            <span
              key={`${it}-${i}`}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 999,
                background: '#eef2ff',
                border: '1px solid #c7d2fe',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title={it}
            >
              {it}
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                }}
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
