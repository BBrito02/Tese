import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';
import { memo } from 'react';

const ButtonNode = (p: NodeProps<NodeData>) => {
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
};

export default memo(ButtonNode);
