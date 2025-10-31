import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { activationIcons, type ActivationKey } from '../../domain/icons';

const ICON_SIZE = 25;

// geometry constants (kept identical to TooltipEdge)
const EXIT_GAP = 12;
const H_GAP = 18;
const V_STACK = 18;
const CORNER_RADIUS = 8;
const STROKE = '#000';

// rounded L elbow from (x1,y1) -> (x1,y2) -> (x2,y2)
function roundedElbowPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  const r = Math.min(CORNER_RADIUS, Math.abs(y2 - y1), Math.abs(x2 - x1));
  const p1x = x1;
  const p1y = y2 - dy * r;
  const p2x = x1 + dx * r;
  const p2y = y2;
  return `M ${x1} ${y1} L ${p1x} ${p1y} Q ${x1} ${y2} ${p2x} ${p2y} L ${x2} ${y2}`;
}

export default function InteractionEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, style, data } = props;

  // keep same target geometry logic
  const TARGET_HALF_H = Math.max(12, Number(data?.targetH ?? 120));
  const TARGET_MARGIN = 0;
  const APPROACH_GAP = 28;

  const side: 'left' | 'right' =
    data?.sourceSide ?? (targetX >= sourceX ? 'right' : 'left');

  const siblings = Math.max(1, Number(data?.siblings ?? 1));
  const ordinal = Math.min(
    Math.max(0, Number(data?.ordinal ?? 0)),
    siblings - 1
  );
  const centerOffset = (ordinal - (siblings - 1) / 2) * V_STACK;

  const exitX = side === 'right' ? sourceX + EXIT_GAP : sourceX - EXIT_GAP;
  const exitY = sourceY + centerOffset;
  const awayX = side === 'right' ? exitX + H_GAP : exitX - H_GAP;

  const targetTop = targetY - TARGET_HALF_H;
  const targetBottom = targetY + TARGET_HALF_H;
  const aboveY = targetTop - TARGET_MARGIN;
  const belowY = targetBottom + TARGET_MARGIN;
  const corridorY =
    Math.abs(exitY - aboveY) <= Math.abs(exitY - belowY) ? aboveY : belowY;

  const approachX = targetX - APPROACH_GAP;

  const leg1 = `M ${sourceX} ${sourceY} L ${exitX} ${exitY}`;
  const leg2 = roundedElbowPath(awayX, exitY, awayX, corridorY);
  const leg3 = `L ${approachX} ${corridorY}`;
  const leg4 = roundedElbowPath(approachX, corridorY, approachX, targetY);
  const leg5 = `L ${targetX} ${targetY}`;

  const path = `${leg1} L ${awayX} ${exitY} ${leg2} ${leg3} ${leg4} ${leg5}`;

  // source icon (hover/click) — identical placement as TooltipEdge
  const key: ActivationKey =
    data?.activation === 'click' || data?.activation === 'hover'
      ? data.activation
      : 'hover';
  const src = activationIcons[key];

  const OUTSET = 1;
  const iconCx = side === 'right' ? sourceX + OUTSET : sourceX - OUTSET;
  const iconCy = exitY;

  // unique marker id per edge (avoids collisions across edges)
  const markerId = `tooltip-arrow-${id}`;

  return (
    <>
      {/* Define the arrow marker inside the same SVG layer */}
      <defs>
        <marker
          id={markerId}
          markerWidth="12"
          markerHeight="12"
          refX="10" // where the path end meets the arrow tip
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          {/* Triangle arrowhead; fill matches stroke color */}
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
          strokeDasharray: '4 4', // keep same dash as TooltipEdge
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
