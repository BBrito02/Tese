// src/canvas/nodes/VisualizationNode.tsx
import type { NodeProps } from 'reactflow';
import BaseNodeShell from './BaseNodeShell';
import type { NodeData, DataItem, VisualVariable } from '../../domain/types';

export default function VisualizationNode(p: NodeProps<NodeData>) {
  const d = p.data as any;

  // footer "data" list (strings or DataItem objects)
  const footerItems: (string | DataItem)[] = Array.isArray(d.data)
    ? d.data
    : [];

  // visual variables — support both shapes for backward compat
  const visualVars: VisualVariable[] = Array.isArray(d.visualVariables)
    ? (d.visualVariables as VisualVariable[])
    : Array.isArray(d.visualVars)
    ? (d.visualVars as VisualVariable[])
    : [];

  // tooltip counter chip
  const tooltipCount = Array.isArray(d.tooltips)
    ? (d.tooltips as string[]).length
    : 0;

  return (
    <BaseNodeShell
      {...p}
      body={null}
      footerItems={footerItems}
      visualVars={visualVars}
      tooltipCount={tooltipCount}
      // ✅ use `d` here (not `data`)
      reviewMode={(d as any).reviewMode ?? false}
      reviewCount={(d as any).reviewTotal ?? 0}
      reviewUnresolvedCount={(d as any).reviewUnresolved ?? 0}
      cardStyle={{
        background: '#deebf7',
      }}
      headerStyle={undefined}
      bodyStyle={undefined}
      footerStyle={undefined}
      hideHeader={false}
      hideFooter={false}
      isParameter={false}
      leftHandle={true}
      rightHandle={true}
    />
  );
}
