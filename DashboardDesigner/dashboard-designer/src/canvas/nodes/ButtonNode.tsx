import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function ButtonNode(p: NodeProps<NodeData>) {
  return (
    <BaseNodeShell
      {...p}
      cardStyle={{ background: '#E6E6E6', borderRadius: 10 }}
    />
  );
}
