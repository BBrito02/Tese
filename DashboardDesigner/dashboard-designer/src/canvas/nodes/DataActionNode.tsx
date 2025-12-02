import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';
import { memo } from 'react';

const DataActionNode = (p: NodeProps<NodeData>) => {
  const d = p.data as any;
  return (
    <BaseNodeShell
      {...p}
      cardStyle={{ borderRadius: 12, background: '#fff' }}
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
    />
  );
};

export default memo(DataActionNode);
