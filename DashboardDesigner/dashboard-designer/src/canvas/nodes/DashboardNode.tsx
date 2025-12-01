import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function DashboardNode(p: NodeProps<NodeData>) {
  const d = p.data as any;
  return (
    <BaseNodeShell
      {...p}
      cardStyle={{ borderRadius: 18, background: '#f5f5f5' }}
      leftHandle={true}
      rightHandle={false}
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
    />
  );
}
