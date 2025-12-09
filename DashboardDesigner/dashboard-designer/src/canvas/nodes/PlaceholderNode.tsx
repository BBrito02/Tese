import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';
import { memo } from 'react';

const PlaceholderNode = (p: NodeProps<NodeData>) => {
  const d = p.data as any;
  const perspectiveCount = Array.isArray(d.perspectives)
    ? (d.perspectives as string[]).length
    : 0;
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
      perspectiveCount={perspectiveCount}
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
    />
  );
};

export default memo(PlaceholderNode);
