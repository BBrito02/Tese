import React, { useState } from 'react';
import { LuPlus, LuPencil } from 'react-icons/lu';
import type { KindProps } from './common';
import { WhiteField, GhostLine } from './common';

export default function ParameterMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const [newOption, setNewOption] = useState('');

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

  const PillStyle: React.CSSProperties = {
    display: 'inline-block',
    background: '#cffafe',
    color: '#0f172a',
    fontWeight: 700,
    padding: '6px 14px',
    borderRadius: 999,
  };

  const options: string[] = d.options ?? [];
  const interactions: string[] = d.interactions ?? [];

  const addOption = () => {
    const v = newOption.trim();
    if (!v) return;
    p.onChange({ options: [...options, v] });
    setNewOption('');
  };

  const removeOption = (index: number) => {
    const next = [...options];
    next.splice(index, 1);
    p.onChange({ options: next });
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
            placeholder="Parameter name"
            value={d.title ?? ''}
            onChange={(e) => p.onChange({ title: e.target.value })}
            disabled={disabled}
            style={{ ...WhiteField, paddingRight: 34 }}
          />
          <LuPencil size={16} style={smallIconRight} />
        </div>
      </div>

      {/* Category (visual pill) */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span style={PillStyle}>Category</span>
      </div>

      {/* Options (enter option → displayed in component dropdown) */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 6,
          }}
        >
          Options
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Enter option and press Enter"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addOption();
            }}
            disabled={disabled}
            style={{ ...WhiteField, flex: 1, paddingRight: 10 }}
          />
          <button
            type="button"
            onClick={addOption}
            disabled={disabled || !newOption.trim()}
            style={{
              ...roundIconBtn,
              opacity: disabled || !newOption.trim() ? 0.6 : 1,
            }}
            title="Add option"
          >
            <LuPlus size={16} />
          </button>
        </div>

        {/* show options as small chips (or one blank line if none) */}
        <div style={{ marginTop: 8 }}>
          {options.length === 0 ? (
            <div style={GhostLine} />
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {options.map((it, i) => (
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
                    onClick={() => removeOption(i)}
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
        <div style={{ marginTop: 8 }}>
          {interactions.length === 0 ? (
            <div style={GhostLine} />
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {interactions.map((it, i) => (
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
    </div>
  );
}
