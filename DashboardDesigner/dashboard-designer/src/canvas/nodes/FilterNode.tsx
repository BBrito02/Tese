import type { NodeProps } from 'reactflow';
import type { NodeData, DataItem } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function FilterNode(p: NodeProps<NodeData>) {
  const d: any = p.data;
  const footer = d.data as (string | DataItem)[] | undefined;
  return (
    <BaseNodeShell
      {...p}
      footerItems={footer}
      cardStyle={{ background: '#E6E6E6', borderRadius: 12 }}
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
    />
  );
}
