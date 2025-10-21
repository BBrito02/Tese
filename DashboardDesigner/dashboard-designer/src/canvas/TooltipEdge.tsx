import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { activationIcons, type ActivationKey } from '../domain/icons';

const ICON_SIZE = 25;

// geometry constants
const EXIT_GAP = 12; // nudge outside the viz border
const H_GAP = 18; // extra horizontal before the long run
const V_STACK = 18; // spacing for multiple tooltips on same viz
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

export default function TooltipEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, style, data } = props;

  // tooltip sizing (your default Tooltip is ~220x120)
  const TARGET_HALF_H = Math.max(12, Number(data?.targetH ?? 120)); // half of tooltip height
  const TARGET_MARGIN = 12; // extra clearance outside tooltip
  const APPROACH_GAP = 12; // how far LEFT of the tooltip to make the final elbow

  // which side of the viz to exit
  const side: 'left' | 'right' =
    data?.sourceSide ?? (targetX >= sourceX ? 'right' : 'left');

  // fan-out offset for multiple tooltips on same viz
  const siblings = Math.max(1, Number(data?.siblings ?? 1));
  const ordinal = Math.min(
    Math.max(0, Number(data?.ordinal ?? 0)),
    siblings - 1
  );
  const centerOffset = (ordinal - (siblings - 1) / 2) * V_STACK;

  // 1) exit the viz slightly outside its border
  const exitX = side === 'right' ? sourceX + EXIT_GAP : sourceX - EXIT_GAP;
  const exitY = sourceY + centerOffset;

  // 2) move farther away horizontally before the long run
  const awayX = side === 'right' ? exitX + H_GAP : exitX - H_GAP;

  // 3) pick a corridor Y that is definitely OUTSIDE the tooltip box
  const targetTop = targetY - TARGET_HALF_H;
  const targetBottom = targetY + TARGET_HALF_H;
  const aboveY = targetTop - TARGET_MARGIN;
  const belowY = targetBottom + TARGET_MARGIN;

  // choose the closer corridor (above or below)
  const corridorY =
    Math.abs(exitY - aboveY) <= Math.abs(exitY - belowY) ? aboveY : belowY;

  // 4) final approach: stop to the LEFT of the tooltip, elbow vertically there,
  //    then a short horizontal into the anchor (so we never enter the tooltip box)
  const approachX = targetX - APPROACH_GAP;

  const leg1 = `M ${sourceX} ${sourceY} L ${exitX} ${exitY}`;
  const leg2 = roundedElbowPath(awayX, exitY, awayX, corridorY);
  const leg3 = `L ${approachX} ${corridorY}`;
  const leg4 = roundedElbowPath(approachX, corridorY, approachX, targetY);
  const leg5 = `L ${targetX} ${targetY}`;

  const path = `${leg1} L ${awayX} ${exitY} ${leg2} ${leg3} ${leg4} ${leg5}`;

  // icon near the exit point
  const key: ActivationKey =
    data?.activation === 'click' || data?.activation === 'hover'
      ? data.activation
      : 'hover';
  const src = activationIcons[key];

  const OUTSET = 1;
  const iconCx = side === 'right' ? sourceX + OUTSET : sourceX - OUTSET;
  const iconCy = exitY;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={24}
        style={{
          stroke: STROKE,
          strokeWidth: 1.5,
          strokeDasharray: '4 4',
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
