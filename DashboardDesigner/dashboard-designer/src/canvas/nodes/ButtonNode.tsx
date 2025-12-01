import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function ButtonNode(p: NodeProps<NodeData>) {
  const d = p.data as any;
  return (
    <BaseNodeShell
      {...p}
      cardStyle={{ background: '#E6E6E6', borderRadius: 10 }}
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
    />
  );
}
