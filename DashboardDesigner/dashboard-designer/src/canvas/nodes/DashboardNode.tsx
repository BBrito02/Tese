import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function DashboardNode(p: NodeProps<NodeData>) {
  return (
    <BaseNodeShell
      {...p}
      cardStyle={{ borderRadius: 18, background: '#f5f5f5' }}
    />
  );
}
