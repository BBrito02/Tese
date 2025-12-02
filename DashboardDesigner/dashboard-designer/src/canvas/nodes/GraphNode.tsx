// src/canvas/nodes/GraphNode.tsx
import { memo, useState, useEffect } from 'react';
import { type NodeProps } from 'reactflow';
import { GRAPH_TYPE_ICONS } from '../../domain/icons';
import type { NodeData, GraphType } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';
import { getLocalImageSrc } from '../../utils/localStore';

const GraphNode = (props: NodeProps<NodeData>) => {
  const { data, selected } = props;
  const { graphType, previewImageId } = data as any;

  // 1. Removed manual review mode logic.
  // BaseNodeShell now connects to ReviewContext automatically.

  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (previewImageId) {
      getLocalImageSrc(previewImageId).then((url) => {
        if (active) setCustomImageSrc(url);
      });
    } else {
      setCustomImageSrc(null);
    }
    return () => {
      active = false;
    };
  }, [previewImageId]);

  const IconSrc =
    GRAPH_TYPE_ICONS[graphType as GraphType] || GRAPH_TYPE_ICONS.Line;

  const bodyContent = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {customImageSrc ? (
        <img
          src={customImageSrc}
          alt="Preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <img
          src={IconSrc}
          alt={graphType}
          style={{
            width: '60%',
            height: '60%',
            objectFit: 'contain',
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );

  return (
    <BaseNodeShell
      {...props}
      selected={selected}
      hideHeader={true} // BaseNodeShell will now auto-inject the badge for hidden headers
      hideFooter={true}
      body={bodyContent}
      bodyStyle={{
        padding: 0,
        background: customImageSrc ? '#fff' : '#f8fafc',
      }}
      leftHandle={true}
      rightHandle={true}
    />
  );
};

export default memo(GraphNode);
