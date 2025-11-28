import React, { useState } from 'react';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  leftLabel?: string; // "Editor"
  rightLabel?: string; // "Review"
};

export default function ReviewToggle({
  checked,
  onChange,
  leftLabel = 'Editor',
  rightLabel = 'Review',
}: Props) {
  const [pressed, setPressed] = useState(false);

  const toggle = () => onChange(!checked);
  const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  };

  // Compact sizes
  const H = 22;
  const W = 88;
  const PAD = 2;
  const KNOB = H - PAD * 2; // 18

  // translate distance for the knob
  const dx = W - KNOB - PAD * 2;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        userSelect: 'none',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: checked ? '#64748b' : '#0f172a',
          fontWeight: checked ? 500 : 700,
          minWidth: 38,
          textAlign: 'right',
          transition: 'color 140ms ease',
        }}
      >
        {leftLabel}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={toggle}
        onKeyDown={onKeyDown}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        title={checked ? `${rightLabel}: ON` : `${leftLabel}: ON`}
        style={{
          position: 'relative',
          width: W,
          height: H,
          borderRadius: 999,
          border: '1px solid rgba(15,23,42,0.1)',
          background: checked
            ? 'linear-gradient(180deg, #60a5fa, #3b82f6)'
            : 'linear-gradient(180deg, #e5e7eb, #cbd5e1)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,.7), inset 0 -1px 0 rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.08)',
          cursor: 'pointer',
          outline: 'none',
          padding: PAD,
          transition:
            'background 160ms ease, box-shadow 160ms ease, transform 140ms ease',
          transform: pressed ? 'scale(0.98)' : 'scale(1)',
        }}
      >
        {/* knob */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: PAD,
            left: PAD,
            width: KNOB,
            height: KNOB,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.06)',
            transform: `translateX(${checked ? dx : 0}px) ${
              pressed ? ' scale(0.96)' : ''
            }`,
            transition:
              'transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 160ms ease',
          }}
        />

        {/* subtle focus ring container (kept for a11y – can be enhanced with CSS if desired) */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 999,
            boxShadow: '0 0 0 0 rgba(59,130,246,.28)',
            transition: 'box-shadow 140ms ease',
          }}
        />
      </button>

      <span
        style={{
          fontSize: 11,
          color: checked ? '#0f172a' : '#64748b',
          fontWeight: checked ? 700 : 500,
          minWidth: 40,
          transition: 'color 140ms ease',
        }}
      >
        {rightLabel}
      </span>
    </div>
  );
}
