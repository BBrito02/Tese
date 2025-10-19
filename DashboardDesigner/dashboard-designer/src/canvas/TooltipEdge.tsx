import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow';
import { activationIcons, type ActivationKey } from '../domain/icons';

const ICON_SIZE = 16;

export default function TooltipEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, style, data } = props;

  // compute path
  const [path] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY });

  // Which side the edge starts from
  const side: 'left' | 'right' =
    data?.sourceSide ?? (targetX >= sourceX ? 'right' : 'left');

  const OUTSET = 1;
  const iconCx = sourceX + (side === 'right' ? OUTSET : -OUTSET);
  const iconCy = sourceY;

  const key: ActivationKey =
    data?.activation === 'click' || data?.activation === 'hover'
      ? data.activation
      : 'hover';

  const src = activationIcons[key];

  return (
    <>
      {/* Define a simple arrow marker */}
      <svg width="0" height="0">
        <defs>
          <marker
            id={`arrow-${id}`}
            markerWidth="10"
            markerHeight="10"
            refX="6"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L6,3 z" fill="#000" />
          </marker>
        </defs>
      </svg>

      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: '#000',
          strokeWidth: 1.5,
          ...style,
        }}
        markerEnd={`url(#arrow-${id})`} // attach arrow here
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
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
