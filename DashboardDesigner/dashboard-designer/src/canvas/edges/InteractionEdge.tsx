// src/canvas/edges/InteractionEdge.tsx
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
const STROKE_SELECTED = '#3b82f6'; // Bright blue for selection

export default function InteractionEdge(props: EdgeProps) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Right,
    targetPosition = Position.Left,
    style,
    data,
    selected, // <--- 1. React Flow passes this automatically
  } = props;

  // 1. GET NODES
  const allNodes = useNodes<Record<string, unknown>>() as unknown as Node[];

  // 2. FILTER & TRANSFORM OBSTACLES
  const obstacles = allNodes
    .filter((n) => {
      if (n.id === source || n.id === target) return false;
      if (n.type === 'dashboard' || n.id.startsWith('D0')) return false;
      if (n.hidden) return false;
      return true;
    })
    .map((n) => {
      if (n.positionAbsolute) {
        return { ...n, position: n.positionAbsolute };
      }
      return n;
    });

  const side: 'left' | 'right' =
    (data?.sourceSide as 'left' | 'right') ??
    (targetX >= sourceX ? 'right' : 'left');

  // Fan-out alignment logic
  const siblings = Math.max(1, Number(data?.siblings ?? 1));
  const ordinal = Math.min(
    Math.max(0, Number(data?.ordinal ?? 0)),
    siblings - 1
  );
  const centerOffset = (ordinal - (siblings - 1) / 2) * 18;
  const adjustedSourceY = sourceY + centerOffset;

  // 3. CALCULATE SMART PATH
  const smartResponse = getSmartEdge({
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY: adjustedSourceY,
    targetX,
    targetY,
    nodes: obstacles as any,
    options: {
      nodePadding: 10,
      gridRatio: 2,
    },
  });

  // 4. FALLBACK
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

  // 5. ICON LOGIC
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

  // 2. DETERMINE STROKE COLOR
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
          {/* 3. Apply color to arrow head */}
          <path d="M 0 0 L 12 6 L 0 12 z" fill={currentStroke} />
        </marker>
      </defs>

      {/* HIT AREA */}
      <g
        onClick={() => {
          //e.stopPropagation();
          // Dispatch custom event AND let React Flow handle selection internally via prop
          window.dispatchEvent(
            new CustomEvent('designer:select-edge', {
              detail: {
                edgeId: id,
                type: 'interaction',
                data,
              },
            })
          );
        }}
        style={{ cursor: 'pointer' }}
      >
        {/* Invisible thick path for easier clicking */}
        <path
          d={finalPath}
          stroke="transparent"
          strokeWidth={20}
          fill="none"
          pointerEvents="stroke"
        />

        {/* Visible path */}
        <path
          d={finalPath}
          stroke={currentStroke} // 4. Apply dynamic color
          strokeWidth={selected ? 2.5 : 1.5} // 5. Make thicker when selected
          strokeDasharray="4 4"
          fill="none"
          markerEnd={`url(#${markerId})`}
          pointerEvents="none"
          style={{
            ...style,
            // Add a subtle glow/shadow if selected
            filter: selected
              ? 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))'
              : 'none',
            transition: 'stroke 0.2s, stroke-width 0.2s',
          }}
        />
      </g>

      {/* ICON */}
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
              // Highlight icon border if selected
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
