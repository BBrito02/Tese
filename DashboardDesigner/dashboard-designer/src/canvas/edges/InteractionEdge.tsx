import {
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath, // Use standard React Flow path
  Position,
} from 'reactflow';
import { activationIcons, type ActivationKey } from '../../domain/icons';

const ICON_SIZE = 25;
const STROKE_DEFAULT = '#000';
const STROKE_SELECTED = '#3b82f6';

export default function InteractionEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Right,
    targetPosition = Position.Left,
    style,
    data,
    selected,
  } = props;

  const reviewMode = Boolean((data as any)?.reviewMode);
  const reviewUnresolved = Number((data as any)?.reviewUnresolvedCount ?? 0);
  const shouldPulse = reviewMode && reviewUnresolved > 0 && !selected;

  // 1. REMOVED: useNodes() and obstacles calculation.
  // This was the main cause of the lag.

  const side: 'left' | 'right' =
    (data?.sourceSide as 'left' | 'right') ??
    (targetX >= sourceX ? 'right' : 'left');

  // Keep your custom logic for multiple lines between same nodes
  const siblings = Math.max(1, Number(data?.siblings ?? 1));
  const ordinal = Math.min(
    Math.max(0, Number(data?.ordinal ?? 0)),
    siblings - 1
  );
  const centerOffset = (ordinal - (siblings - 1) / 2) * 18;
  const adjustedSourceY = sourceY + centerOffset;

  // 2. CHANGED: Use standard getSmoothStepPath
  const [finalPath] = getSmoothStepPath({
    sourceX,
    sourceY: adjustedSourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12, // slightly rounded corners look better
  });

  const activation = (data?.activation ?? data?.trigger) as
    | ActivationKey
    | undefined;
  const key: ActivationKey =
    activation === 'click' || activation === 'hover' ? activation : 'hover';
  const src = activationIcons[key];

  const OUTSET = 1;
  const iconCx = side === 'right' ? sourceX + OUTSET : sourceX - OUTSET;
  const iconCy = adjustedSourceY;

  const markerId = `interaction-arrow-${id}`;
  const currentStroke = selected ? STROKE_SELECTED : STROKE_DEFAULT;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="12"
          markerHeight="12"
          refX="12"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0 L 12 6 L 0 12 z" fill={currentStroke} />
        </marker>
      </defs>

      <g
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent('designer:select-edge', {
              detail: { edgeId: id, type: 'interaction', data },
            })
          );
        }}
        style={{ cursor: 'pointer' }}
      >
        {/* Invisible fat stroke for easier clicking */}
        <path
          d={finalPath}
          stroke="transparent"
          strokeWidth={20}
          fill="none"
          pointerEvents="stroke"
        />

        {/* Visible stroke */}
        <path
          d={finalPath}
          stroke={currentStroke}
          strokeWidth={selected ? 2.5 : 1.5}
          strokeDasharray="6 3"
          fill="none"
          markerEnd={`url(#${markerId})`}
          pointerEvents="none"
          className={shouldPulse ? 'edge-pulse-red' : undefined}
          style={{
            ...style,
            filter: selected
              ? 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.6))'
              : undefined,
            transition: 'stroke 0.2s, stroke-width 0.2s',
          }}
        />
      </g>

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${iconCx}px, ${iconCy}px)`,
            zIndex: 100000,
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
              boxShadow: selected
                ? `0 0 0 2px ${STROKE_SELECTED}, 0 1px 4px rgba(0,0,0,0.2)`
                : '0 1px 2px rgba(0,0,0,.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'box-shadow 0.2s',
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
