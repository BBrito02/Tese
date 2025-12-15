import type { NodeProps } from 'reactflow';
import type { NodeData, DataItem, VisualVariable } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';
import { memo } from 'react';

const TooltipNode = (p: NodeProps<NodeData>) => {
  const d: any = p.data;

  // --- CHANGE: Enforce DataItem[] ---
  const footer = d.data as DataItem[] | undefined;

  const visualVars: VisualVariable[] = Array.isArray(d.visualVariables)
    ? (d.visualVariables as VisualVariable[])
    : Array.isArray(d.visualVars)
    ? (d.visualVars as VisualVariable[])
    : [];

  const perspectiveCount = Array.isArray(d.perspectives)
    ? (d.perspectives as string[]).length
    : 0;

  return (
    <BaseNodeShell
      {...p}
      footerItems={footer}
      visualVars={visualVars}
      perspectiveCount={perspectiveCount}
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
      // neutral card + subtle border, no blue highlight
      cardStyle={{
        background: '#fffef7',
        borderRadius: 10,
      }}
      headerStyle={{ padding: 8 }}
    />
  );
};

export default memo(TooltipNode);
