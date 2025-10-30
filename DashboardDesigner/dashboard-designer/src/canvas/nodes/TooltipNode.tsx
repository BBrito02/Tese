import type { NodeProps } from 'reactflow';
import type { NodeData, DataItem, VisualVariable } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

export default function TooltipNode(p: NodeProps<NodeData>) {
  const d: any = p.data;
  const footer = d.data as (string | DataItem)[] | undefined;
  const vv = d.visualVars as VisualVariable[] | undefined;

  return (
    <BaseNodeShell
      {...p}
      footerItems={footer}
      visualVars={vv}
      // neutral card + subtle border, no blue highlight
      cardStyle={{
        background: '#fffef7',
        borderRadius: 10,
      }}
      headerStyle={{ padding: 8 }}
    />
  );
}
