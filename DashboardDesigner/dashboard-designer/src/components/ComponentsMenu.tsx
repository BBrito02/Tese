import { useEffect, useState } from 'react';
import type { Node as RFNode } from 'reactflow';
import type { NodeData, NodeKind } from '../domain/types';
import { MENUS } from './menus';
import { BaseMenu } from './menus/common';

type Props = {
  node?: RFNode<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  onDelete?: () => void;
  onOpen?: (type: 'data' | 'interactions' | 'tooltips') => void; // ← add
};

export default function ComponentsMenu({
  node,
  onChange,
  onDelete,
  onOpen,
}: Props) {
  const [shouldRender, setShouldRender] = useState(!!node);
  const [visible, setVisible] = useState(!!node);
  const [lastNode, setLastNode] = useState<RFNode<NodeData> | undefined>(node);

  useEffect(() => {
    if (node) {
      setLastNode(node);
      setShouldRender(true);
      requestAnimationFrame(() => setVisible(true));
    } else if (shouldRender) {
      setVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node]);

  const handleTransitionEnd: React.TransitionEventHandler<HTMLElement> = (
    e
  ) => {
    if (e.target !== e.currentTarget) return;
    if (!visible) setShouldRender(false);
  };

  if (!shouldRender) return null;

  const panelNode = node ?? lastNode!;
  const disabled = !node;

  const Menu = MENUS[panelNode.data.kind as NodeKind];

  return (
    <aside
      onTransitionEnd={handleTransitionEnd}
      style={{
        width: 280,
        borderLeft: '1px solid #e5e7eb',
        background: '#fafafa',
        padding: 12,
        height: 'calc(100vh - 14px)',
        marginRight: 7,
        marginTop: 7,
        marginBottom: 7,
        borderRadius: 20,
        overflow: 'auto',
        transition: 'opacity 180ms ease, transform 200ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(8px)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {Menu ? (
        <Menu
          node={panelNode}
          onChange={onChange}
          disabled={disabled}
          onOpen={onOpen}
        />
      ) : (
        <BaseMenu node={panelNode} onChange={onChange} disabled={disabled} />
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          disabled={disabled}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #ef4444',
            color: '#ef4444',
            background: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          Delete node
        </button>
      )}
    </aside>
  );
}
