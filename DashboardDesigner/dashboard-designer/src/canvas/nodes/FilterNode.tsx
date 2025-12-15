import type { NodeProps } from 'reactflow';
import type { NodeData, DataItem } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';
import { memo } from 'react';

const FilterNode = (p: NodeProps<NodeData>) => {
  const d: any = p.data;

  // --- CHANGE: Enforce DataItem[] ---
  const footer = d.data as DataItem[] | undefined;

  const perspectiveCount = Array.isArray(d.perspectives)
    ? (d.perspectives as string[]).length
    : 0;

  return (
    <BaseNodeShell
      {...p}
      footerItems={footer}
      cardStyle={{ background: '#E6E6E6', borderRadius: 12 }}
      perspectiveCount={perspectiveCount}
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
    />
  );
};

export default memo(FilterNode);
