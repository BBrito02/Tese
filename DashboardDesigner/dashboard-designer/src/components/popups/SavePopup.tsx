import { useEffect, useRef, useState } from 'react';

type Props = {
  initialName?: string;
  onCancel: () => void;
  onConfirm: (filename: string) => void;
};

function sanitizeBaseName(name: string) {
  // strip extension and illegal filename chars
  const base = name.replace(/\.json$/i, '');
  return (
    base.replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '').trim() ||
    'dashboard-designer'
  );
}

export default function SavePopup({
  initialName = 'dashboard-designer',
  onCancel,
  onConfirm,
}: Props) {
  const [name, setName] = useState(() => sanitizeBaseName(initialName));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const confirm = () => {
    const base = sanitizeBaseName(name);
    const finalName = base.toLowerCase().endsWith('.json')
      ? base
      : `${base}.json`;
    onConfirm(finalName);
  };

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          confirm();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      <label style={{ fontSize: 12, color: '#475569' }}>File name</label>
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="dashboard-designer"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          outline: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 8,
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={confirm}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #2563eb',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
