// src/canvas/edges/InteractionEdge.tsx
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { activationIcons, type ActivationKey } from '../../domain/icons';
import { useObstacles, routeOrthogonalAvoiding } from './obstacleRouter';

const ICON_SIZE = 25;

// keep visual constants aligned with TooltipEdge (except the dash stays here)
const EXIT_GAP = 12;
const H_GAP = 18;
const V_STACK = 18;
const CORNER_RADIUS = 8;
const STROKE = '#000';

// (kept for fallback use if needed)
function roundedElbowPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  const r = Math.min(CORNER_RADIUS, Math.abs(y2 - y1), Math.abs(x2 - x1));
  const p1x = x1;
  const p1y = y2 - dy * r;
  const p2x = x1 + dx * r;
  const p2y = y2;
  return `L ${p1x} ${p1y} Q ${x1} ${y2} ${p2x} ${p2y} L ${x2} ${y2}`;
}

export default function InteractionEdge(props: EdgeProps) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    data,
  } = props;

  // keep your geometry intent
  const TARGET_HALF_H = Math.max(12, Number(data?.targetH ?? 120));
  const TARGET_MARGIN = 0; // you were using 0 here
  const APPROACH_GAP = 28; // a bit more room near target

  const side: 'left' | 'right' =
    (data?.sourceSide as 'left' | 'right') ??
    (targetX >= sourceX ? 'right' : 'left');

  // fan-out alignment (same as before)
  const siblings = Math.max(1, Number(data?.siblings ?? 1));
  const ordinal = Math.min(
    Math.max(0, Number(data?.ordinal ?? 0)),
    siblings - 1
  );
  const centerOffset = (ordinal - (siblings - 1) / 2) * V_STACK;

  // build obstacle list (exclude this edge's endpoints and their nodes)
  const obstacles = useObstacles(source, target, 8);

  // obstacle-aware orthogonal route (same API as TooltipEdge)
  const routed = routeOrthogonalAvoiding(
    { x: sourceX, y: sourceY + centerOffset },
    { x: targetX, y: targetY },
    {
      side,
      exitGap: EXIT_GAP,
      hGap: H_GAP,
      approachGap: APPROACH_GAP,
      targetHalfH: TARGET_HALF_H,
      targetMargin: TARGET_MARGIN,
      cornerR: CORNER_RADIUS,
      obstacles,
    }
  );

  // compose identical leg structure used in TooltipEdge
  const leg1 = `M ${sourceX} ${sourceY + centerOffset} L ${routed.exitX} ${
    routed.exitY
  }`;
  const leg2 = `L ${routed.awayX} ${routed.exitY}`;
  const leg3 = roundedElbowPath(
    routed.awayX,
    routed.exitY,
    routed.awayX,
    routed.corridorY
  );
  const leg4 = `L ${routed.approachX} ${routed.corridorY}`;
  const leg5 = roundedElbowPath(
    routed.approachX,
    routed.corridorY,
    routed.approachX,
    targetY
  );
  const leg6 = `L ${targetX} ${targetY}`;

  const path = `${leg1} ${leg2} ${leg3} ${leg4} ${leg5} ${leg6}`;

  // source activation icon (unchanged)
  const activation = (data?.activation ?? data?.trigger) as
    | ActivationKey
    | undefined;

  const key: ActivationKey =
    activation === 'click' || activation === 'hover' ? activation : 'hover';
  const src = activationIcons[key];

  const OUTSET = 1;
  const iconCx = side === 'right' ? sourceX + OUTSET : sourceX - OUTSET;
  const iconCy = routed.exitY;

  // arrow marker at target end
  const markerId = `interaction-arrow-${id}`;

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
          <path d="M 0 0 L 12 6 L 0 12 z" fill={STROKE} />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={path}
        interactionWidth={24}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: STROKE,
          strokeWidth: 1.5,
          strokeDasharray: '4 4', // keep dashed look for InteractionEdge
          ...style,
        }}
      />

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
              boxShadow: '0 1px 2px rgba(0,0,0,.25)',
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
