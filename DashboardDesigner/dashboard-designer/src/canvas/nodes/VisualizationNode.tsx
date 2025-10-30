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
      body={null} // Visualization has no body by itself (graphs are children)
      footerItems={footerItems} // renders data pills with handles
      visualVars={visualVars} // renders VV icons (clickable -> opens VV popup)
      tooltipCount={tooltipCount} // shows T(n)
      // optional per-kind card tweaks:
      cardStyle={undefined}
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
