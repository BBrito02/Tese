import type { NodeProps } from 'reactflow';
import type { NodeData, GraphType } from '../../domain/types';
import { GRAPH_TYPE_ICONS } from '../../domain/icons';
import BaseNodeShell from './BaseNodeShell';

export default function GraphNode(p: NodeProps<NodeData>) {
  const gt = (p.data as any).graphType as GraphType | undefined;
  return (
    <BaseNodeShell
      {...p}
      hideHeader
      hideFooter
      leftHandle={false}
      rightHandle={false}
      cardStyle={{ borderRadius: 6, background: '#fff' }}
      body={
        gt ? (
          <img
            src={GRAPH_TYPE_ICONS[gt]}
            alt={gt}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : null
      }
    />
  );
}
