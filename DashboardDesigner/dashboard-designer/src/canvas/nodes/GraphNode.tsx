import { memo, useState, useEffect } from 'react';
import { type NodeProps } from 'reactflow';
import { GRAPH_TYPE_ICONS } from '../../domain/icons';
import type { NodeData, GraphType } from '../../domain/types';
import BaseNodeShell from './BaseNodeShell';
import { getLocalImageSrc } from '../../utils/localStore';

function GraphNode(props: NodeProps<NodeData>) {
  const { data, selected } = props;
  const { graphType, previewImageId } = data as any;

  // State to hold the resolved image URL
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

  // Effect: Load image from IndexedDB
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

  // Fallback Icon
  const IconSrc =
    GRAPH_TYPE_ICONS[graphType as GraphType] || GRAPH_TYPE_ICONS.Line;

  // The content inside the shell
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
            objectFit: 'cover', // Ensures image fills the resized node
            display: 'block',
            pointerEvents: 'none', // Prevents image dragging from interfering with node dragging
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
      // 1. HIDE THE HEADER (No "Graph" title)
      hideHeader={true}
      // 2. HIDE THE FOOTER (No data pills)
      hideFooter={true}
      // 3. FILL THE CONTAINER
      body={bodyContent}
      // Remove default padding and set background
      bodyStyle={{
        padding: 0,
        background: customImageSrc ? '#fff' : '#f8fafc',
      }}
      // Keep connection logic
      leftHandle={true}
      rightHandle={true}
    />
  );
}

export default memo(GraphNode);
