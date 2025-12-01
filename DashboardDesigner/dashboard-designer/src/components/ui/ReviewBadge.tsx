import { LuMessageSquare, LuCheck } from 'react-icons/lu';

export default function ReviewBadge({
  total,
  unresolved,
  title,
}: {
  total: number;
  unresolved: number;
  title?: string;
}) {
  const has = total > 0;
  const allDone = has && unresolved === 0;

  const bg = allDone ? '#ecfdf5' : has ? '#eff6ff' : '#f1f5f9'; // green / blue / slate
  const br = allDone ? '#86efac' : has ? '#bfdbfe' : '#e2e8f0';
  const fg = allDone ? '#065f46' : has ? '#1e3a8a' : '#334155';

  return (
    <button
      type="button"
      title={
        title ??
        (has
          ? allDone
            ? `${total} reviews · all resolved`
            : `${unresolved}/${total} reviews open`
          : 'No reviews')
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 22,
        padding: '0 8px',
        borderRadius: 999,
        border: `1px solid ${br}`,
        background: bg,
        color: fg,
        fontSize: 11,
        fontWeight: 700,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        userSelect: 'none',
      }}
    >
      {allDone ? <LuCheck size={14} /> : <LuMessageSquare size={14} />}
      <span style={{ lineHeight: 1 }}>
        {unresolved > 0 ? `${unresolved}/${total}` : total}
      </span>
    </button>
  );
}
