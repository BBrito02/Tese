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
const STROKE = '#000';

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
  } = props;

  // 1. GET NODES
  const allNodes = useNodes<Record<string, unknown>>() as unknown as Node[];

  // 2. FILTER & TRANSFORM OBSTACLES
  // This is the logic that fixes the overlap
  const obstacles = allNodes
    .filter((n) => {
      // Exclude endpoints so we can connect to them
      if (n.id === source || n.id === target) return false;

      // Exclude the Dashboard Background (D0) so the line can travel *inside* it
      // Adjust 'dashboard' or 'D0' to match your specific ID/Type
      if (n.type === 'dashboard' || n.id.startsWith('D0')) return false;

      // Exclude hidden nodes
      if (n.hidden) return false;

      return true;
    })
    .map((n) => {
      // CRITICAL FIX: CONVERT RELATIVE TO ABSOLUTE
      // If a node is inside a parent (like your charts inside the dashboard),
      // n.position is relative. n.positionAbsolute is the screen coordinate.
      // We overwrite 'position' so the smart edge library sees the REAL location.
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
      nodePadding: 10, // Small padding to squeeze through gaps
      gridRatio: 2, // High precision for tight layouts
    },
  });

  // 4. FALLBACK
  let finalPath = '';

  if (smartResponse && 'svgPath' in smartResponse) {
    finalPath = smartResponse.svgPath as string;
  } else {
    // Use SmoothStep (right angles) as fallback, looks better in dashboards
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

      {/* HIT AREA */}
      <g
        onClick={(e) => {
          e.stopPropagation();
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
        <path
          d={finalPath}
          stroke="transparent"
          strokeWidth={20}
          fill="none"
          pointerEvents="stroke"
        />

        <path
          d={finalPath}
          stroke={STROKE}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="none"
          markerEnd={`url(#${markerId})`}
          pointerEvents="none"
          style={style}
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
