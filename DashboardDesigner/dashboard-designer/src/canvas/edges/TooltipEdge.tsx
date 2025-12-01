// src/canvas/edges/TooltipEdge.tsx
import {
  EdgeLabelRenderer,
  type EdgeProps,
  useNodes,
  getSmoothStepPath,
  Position,
  type Node,
} from 'reactflow';
import { getSmartEdge } from '@tisoap/react-flow-smart-edge';
import { activationIcons, type ActivationKey } from '../../domain/icons';

const ICON_SIZE = 25;
const STROKE_DEFAULT = '#000';
const STROKE_SELECTED = '#3b82f6'; // BLUE when selected

export default function TooltipEdge(props: EdgeProps) {
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
    sourcePosition = Position.Right,
    targetPosition = Position.Left,
    selected,
  } = props;

  const reviewMode = Boolean((data as any)?.reviewMode);
  const reviewUnresolved = Number((data as any)?.reviewUnresolvedCount ?? 0);
  const shouldPulse = reviewMode && reviewUnresolved > 0 && !selected;

  const allNodes = useNodes<Record<string, unknown>>() as unknown as Node[];
  const obstacles = allNodes
    .filter((n) => {
      if (n.id === source || n.id === target) return false;
      if (n.type === 'dashboard' || n.id.startsWith('D0')) return false;
      if ((n as any).hidden) return false;
      return true;
    })
    .map((n) =>
      (n as any).positionAbsolute
        ? { ...n, position: (n as any).positionAbsolute }
        : n
    );

  const side: 'left' | 'right' =
    (data?.sourceSide as 'left' | 'right') ??
    (targetX >= sourceX ? 'right' : 'left');

  const siblings = Math.max(1, Number(data?.siblings ?? 1));
  const ordinal = Math.min(
    Math.max(0, Number(data?.ordinal ?? 0)),
    siblings - 1
  );
  const centerOffset = (ordinal - (siblings - 1) / 2) * 18;
  const adjustedSourceY = sourceY + centerOffset;

  const smartResponse = getSmartEdge({
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY: adjustedSourceY,
    targetX,
    targetY,
    nodes: obstacles as any,
    options: { nodePadding: 10, gridRatio: 2 },
  });

  let finalPath = '';
  if (smartResponse && 'svgPath' in smartResponse) {
    finalPath = smartResponse.svgPath as string;
  } else {
    const [fallbackPath] = getSmoothStepPath({
      sourceX,
      sourceY: adjustedSourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    finalPath = fallbackPath;
  }

  const key: ActivationKey =
    data?.activation === 'click' || data?.activation === 'hover'
      ? (data.activation as ActivationKey)
      : 'hover';
  const src = activationIcons[key];

  const OUTSET = 1;
  const iconCx = side === 'right' ? sourceX + OUTSET : sourceX - OUTSET;
  const iconCy = adjustedSourceY;

  const markerId = `tooltip-arrow-${id}`;
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
          <path d="M 0 0 L 12 6 L 0 12 z" fill="context-stroke" />
        </marker>
      </defs>

      <g
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent('designer:select-edge', {
              detail: { edgeId: id, type: 'tooltip', data },
            })
          );
        }}
        style={{ cursor: 'pointer' }}
      >
        <path
          d={finalPath}
          stroke="transparent"
          strokeWidth={20}
          fill="none"
          pointerEvents="stroke"
        />

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
