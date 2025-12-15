import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import type { NodeData, DataItem, VisualVariable } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';

const VisualizationNode = (p: NodeProps<NodeData>) => {
  const d = p.data as any;

  // --- CHANGE: Enforce DataItem[] (remove string support) ---
  const footer = d.data as DataItem[] | undefined;

  const visualVars: VisualVariable[] = Array.isArray(d.visualVariables)
    ? (d.visualVariables as VisualVariable[])
    : Array.isArray(d.visualVars)
    ? (d.visualVars as VisualVariable[])
    : [];

  const perspectiveCount = Array.isArray(d.perspectives)
    ? (d.perspectives as string[]).length
    : 0;

  const tooltipCount = Array.isArray(d.tooltips) ? d.tooltips.length : 0;

  return (
    <BaseNodeShell
      {...p}
      footerItems={footer}
      visualVars={visualVars}
      tooltipCount={tooltipCount}
      perspectiveCount={perspectiveCount}
      reviewMode={d.reviewMode ?? false}
      reviewCount={d.reviewTotal ?? 0}
      reviewUnresolvedCount={d.reviewUnresolved ?? 0}
      // Visualizations typically have a white/clean card style
      cardStyle={{ background: '#deebf7' }}
    />
  );
};

export default memo(VisualizationNode);
