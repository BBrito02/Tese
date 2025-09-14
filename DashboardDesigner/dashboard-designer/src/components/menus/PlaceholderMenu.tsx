import React from 'react';
import { LuPencil, LuTag } from 'react-icons/lu';
import type { KindProps } from './common';
import { WhiteField } from './common';

export default function PlaceholderMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const iconRight: React.CSSProperties = {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    pointerEvents: 'none',
  };

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
            placeholder="Placeholder name"
            value={d.title ?? ''}
            onChange={(e) => p.onChange({ title: e.target.value })}
            disabled={disabled}
            style={{ ...WhiteField, paddingRight: 34 }}
          />
          <LuPencil size={16} style={iconRight} />
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
            value="Placeholder"
            readOnly
            disabled
            style={{
              ...WhiteField,
              paddingRight: 34,
              opacity: 1,
              color: '#0f172a',
            }}
          />
          <LuTag size={16} style={iconRight} />
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
          placeholder="Describe this placeholder"
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
