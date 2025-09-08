import type { NodeKind } from '../domain/types';

export default function NodeGhost({
  payload,
}: {
  payload: { kind: NodeKind; title?: string };
}) {
  const isContainer =
    payload.kind === 'Dashboard' || payload.kind === 'Visualization';
  return (
    <div
      style={{
        pointerEvents: 'none',
        borderRadius: 12,
        background: '#fff',
        border: '2px solid #60a5fa',
        boxShadow: '0 8px 24px rgba(0,0,0,.15)',
        opacity: 0.9,
        width: isContainer ? 320 : 200,
        minHeight: isContainer ? 120 : 60,
        padding: 10,
      }}
    >
      <div style={{ fontWeight: 700 }}>{payload.title ?? payload.kind}</div>
      <div style={{ fontSize: 12, opacity: 0.65 }}>{payload.kind}</div>
    </div>
  );
}
