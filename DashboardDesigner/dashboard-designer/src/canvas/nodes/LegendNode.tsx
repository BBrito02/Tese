import type { NodeProps } from 'reactflow';
import type { NodeData, DataItem, VisualVariable } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function LegendNode(p: NodeProps<NodeData>) {
  const d: any = p.data;
  const footer = d.data as (string | DataItem)[] | undefined;
  const vv = d.visualVars as VisualVariable[] | undefined;

  return (
    <BaseNodeShell
      {...p}
      footerItems={footer}
      visualVars={vv}
      cardStyle={{
        borderRadius: 8,
        background: '#E6E6E6',
        borderColor: '#e5e7eb',
      }}
      headerStyle={{ padding: 6 }}
    />
  );
}