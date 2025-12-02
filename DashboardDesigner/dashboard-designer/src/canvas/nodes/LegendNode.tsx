import type { NodeProps } from 'reactflow';
import type { NodeData, DataItem, VisualVariable } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';
import { memo } from 'react';

const LegendNode = (p: NodeProps<NodeData>) => {
  const d: any = p.data;
  const footer = d.data as (string | DataItem)[] | undefined;

  const visualVars: VisualVariable[] = Array.isArray(d.visualVariables)
    ? (d.visualVariables as VisualVariable[])
    : Array.isArray(d.visualVars)
    ? (d.visualVars as VisualVariable[])
    : [];

  return (
    <BaseNodeShell
      {...p}
      footerItems={footer}
      visualVars={visualVars}
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
      cardStyle={{
        borderRadius: 8,
        background: '#E6E6E6',
        borderColor: '#e5e7eb',
      }}
      headerStyle={{ padding: 6 }}
    />
  );
};

export default memo(LegendNode);
