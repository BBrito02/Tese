import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';
import { memo } from 'react';

const DashboardNode = (p: NodeProps<NodeData>) => {
  const d = p.data as any;

  // --- ADDED: Perspective counter ---
  const perspectiveCount = Array.isArray(d.perspectives)
    ? (d.perspectives as string[]).length
    : 0;

  return (
    <BaseNodeShell
      {...p}
      cardStyle={{ borderRadius: 18, background: '#fafafa' }}
      leftHandle={true}
      rightHandle={false}
      perspectiveCount={perspectiveCount} // <--- PASS PROP HERE
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
    />
  );
};

export default memo(DashboardNode);
