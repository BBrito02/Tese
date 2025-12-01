import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function PlaceholderNode(p: NodeProps<NodeData>) {
  const d = p.data as any;
  return (
    <BaseNodeShell
      {...p}
      cardStyle={{
        borderRadius: 12,
        background: '#fafafa',
        borderStyle: 'dashed',
        borderColor: '#e5e7eb',
      }}
      hideFooter
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
    />
  );
}
