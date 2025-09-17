import type { Node as RFNode } from 'reactflow';
import type { NodeData } from '../../domain/types';

export type KindProps = {
  node: RFNode<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  disabled: boolean;
  onOpen?: (type: 'data' | 'interactions' | 'tooltips') => void;
};

export const WhiteField: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#fff',
  fontWeight: 700,
  boxSizing: 'border-box',
};

export const GhostLine: React.CSSProperties = {
  height: 14,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#fff',
};

export function BaseMenu({ node, onChange, disabled }: KindProps) {
  return (
    <>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Properties</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
        ID: {node.id}
      </div>

      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Kind
      </label>
      <div style={{ marginBottom: 10 }}>{node.data.kind}</div>

      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Title
      </label>
      <input
        value={node.data.title ?? ''}
        onChange={(e) => onChange({ title: e.target.value })}
        disabled={disabled}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Description
      </label>
      <textarea
        value={node.data.description ?? ''}
        onChange={(e) => onChange({ description: e.target.value })}
        disabled={disabled}
        rows={3}
        style={{ width: '100%', marginBottom: 10, resize: 'vertical' }}
      />
    </>
  );
}
