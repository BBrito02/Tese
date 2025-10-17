import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow';
import { activationIcons, type ActivationKey } from '../domain/icons';

const ICON_SIZE = 16; // px
const HALF = ICON_SIZE / 2;

export default function TooltipEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, markerEnd, style, data } =
    props;

  const [path] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY });

  // Which side of the viz border does this edge start from?
  const side: 'left' | 'right' =
    data?.sourceSide ?? (targetX >= sourceX ? 'right' : 'left');

  // Center the icon on the *source* handle (half inside/half outside).
  // Nudge it 1px outward so the circle looks crisp against the border.
  const OUTSET = 1;
  const iconCx = sourceX + (side === 'right' ? OUTSET : -OUTSET);
  const iconCy = sourceY;

  const key: ActivationKey = (
    data?.activation === 'click' || data?.activation === 'hover'
      ? data.activation
      : 'hover'
  ) as ActivationKey;

  const src = activationIcons[key];

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{ strokeDasharray: '4 4', ...style }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            // Place the *center* of the image exactly at (iconCx, iconCy)
            transform: `translate(-50%, -50%) translate(${iconCx}px, ${iconCy}px)`,
            zIndex: 2,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: ICON_SIZE,
              height: ICON_SIZE,
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={src}
              alt={key}
              width={ICON_SIZE}
              height={ICON_SIZE}
              style={{ display: 'block' }}
            />
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
