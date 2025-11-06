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

// --- New styles for tooltip pills ---
const tooltipPill: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 8px',
  borderRadius: 999,
  background: '#eef2ff', // light blue background
  border: '1px solid #c7d2fe',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};

const tooltipBadge: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: 999,
  background: '#fff', // white badge now
  border: '1px solid #cbd5e1',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 700,
  color: '#000000ff', // dark blue text inside the badge
};

// helper to detect tooltip strings
const parseTooltip = (s: string) => {
  const m = s.match(/^(\w+\d+)\s+(.*)$/); // e.g., "T0 Tester-Tooltip"
  if (!m) return null;
  return { badge: m[1], title: m[2] };
};

export function SectionTitle({ children }: { children: string }) {
  return (
    <div
      style={{
        marginTop: 18,
        marginBottom: 6,
        fontSize: 14,
        fontWeight: 600, // ← bold
        color: '#0f172a', // slate-900 (strong, readable)
        borderBottom: '1px solid #e5e7eb', // subtle divider
        paddingBottom: 3,
      }}
    >
      {children}
    </div>
  );
}

// function that prints the data attributes + tooltips
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
        // --- Data items (keep old blue style) ---
        if (typeof it !== 'string') {
          const label = it.name;
          const dtype = it.dtype;
          return (
            <span
              key={`data-${label}-${dtype}-${i}`}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 999,
                background: '#eef2ff',
                border: '1px solid #c7d2fe',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title={`${label}${dtype ? ` · ${dtype}` : ''}`}
            >
              {label}
              {dtype && <span style={dtypeBadge}>{dtype}</span>}
            </span>
          );
        }

        // --- Tooltip entries (new white badge + blue background) ---
        const parsed = parseTooltip(it);
        if (parsed) {
          return (
            <span
              key={`tip-${it}-${i}`}
              style={tooltipPill}
              title={parsed.title}
            >
              <span style={tooltipBadge}>{parsed.badge}</span>
              <span style={{ fontWeight: 600, color: '#000000ff' }}>
                {parsed.title}
              </span>
            </span>
          );
        }

        // --- Fallback: plain string ---
        return (
          <span
            key={`str-${it}-${i}`}
            style={{
              fontSize: 12,
              padding: '4px 8px',
              borderRadius: 999,
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            title={it}
          >
            {it}
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
          paddingLeft: 6,
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
          paddingLeft: 6,
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

export function SubTypeField(props: { value: string }) {
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
        Grpah type
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
        <label style={{ fontSize: 12, opacity: 0.8, paddingLeft: 6 }}>
          {title}
        </label>
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

// sections.tsx
export function ListAttributesSection(props: {
  title: string;
  items: (string | DataItem)[];
  onAdd?: () => void;
  addTooltip?: string;
  disabled?: boolean;
  onRemove?: (index: number) => void;
}) {
  const { title, items, onAdd, addTooltip, disabled, onRemove } = props;
  return (
    <div>
      <div style={headerRow}>
        <label style={{ fontSize: 12, opacity: 0.8, paddingLeft: 6 }}>
          {title}
        </label>
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

      {/* Show ghost line if empty */}
      {!items?.length ? (
        <div style={{ marginTop: 8 }}>
          <div style={GhostLine} />
        </div>
      ) : (
        <div
          style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}
        >
          {items.map((it, i) => {
            const label = typeof it === 'string' ? it : it?.name;

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
                  gap: 6,
                }}
                title={label}
              >
                {label}
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    disabled={disabled}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      padding: 0,
                      lineHeight: 1,
                      fontSize: 14,
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// sections.tsx (unchanged)
export function DescriptionSection({
  label = 'Description',
  placeholder = 'Describe this component',
  value,
  onChange,
  disabled,
  rows = 4,
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
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
        {label}
      </label>
      <textarea
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        style={{ ...WhiteField, resize: 'vertical' as const }}
      />
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
          paddingLeft: 6,
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

// Add new component section
export function AddComponentSection({
  title = 'Add component',
  onAdd,
  disabled,
}: {
  // arguments it receives
  title?: string;
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div style={headerRow}>
        <label style={{ fontSize: 12, opacity: 0.8, paddingLeft: 6 }}>
          {title}
        </label>
        <button
          type="button"
          title="Create a new component"
          onClick={onAdd}
          disabled={disabled}
          style={{ ...roundIconBtn, opacity: disabled ? 0.6 : 1 }}
        >
          <LuPlus size={16} />
        </button>
      </div>
    </div>
  );
}

// --- NEW: FieldPickerSection (click-to-select chips) ---
export function FieldPickerSection({
  title,
  available,
  selected,
  onChange,
  disabled,
}: {
  title: string;
  available: string[]; // fields you can pick from (e.g., from parent viz)
  selected: string[]; // current chosen fields
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const add = (v: string) => {
    if (disabled) return;
    if (!selected.includes(v)) onChange([...selected, v]);
  };

  const remove = (v: string) => {
    if (disabled) return;
    onChange(selected.filter((s) => s !== v));
  };

  return (
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
        {title}
      </label>

      {/* Available chips */}
      <div style={{ marginTop: 4 }}>
        {available.length === 0 ? (
          <div style={GhostLine} />
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {available.map((name) => {
              const isPicked = selected.includes(name);
              return (
                <button
                  key={`avail-${name}`}
                  type="button"
                  disabled={disabled || isPicked}
                  onClick={() => add(name)}
                  title={isPicked ? 'Already selected' : `Add "${name}"`}
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: '1px solid #c7d2fe',
                    background: isPicked ? '#e2e8f0' : '#eef2ff',
                    color: '#0f172a',
                    cursor: disabled || isPicked ? 'not-allowed' : 'pointer',
                    opacity: disabled || isPicked ? 0.6 : 1,
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected chips */}
      <div style={{ marginTop: 8 }}>
        {selected.length === 0 ? (
          <div style={GhostLine} />
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {selected.map((name) => (
              <span
                key={`sel-${name}`}
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
                title={name}
              >
                {name}
                <button
                  type="button"
                  onClick={() => remove(name)}
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
        )}
      </div>
    </div>
  );
}
