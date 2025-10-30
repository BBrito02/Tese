import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function PlaceholderNode(p: NodeProps<NodeData>) {
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
    />
  );
}
