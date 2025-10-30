import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function DataActionNode(p: NodeProps<NodeData>) {
  return (
    <BaseNodeShell
      {...p}
      cardStyle={{ borderRadius: 12, background: '#fff' }}
    />
  );
}
