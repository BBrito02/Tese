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
const STROKE = '#000';

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
  } = props;

  // 1. GET NODES
  // Casting to avoid type conflicts between react-flow versions
  const allNodes = useNodes<Record<string, unknown>>() as unknown as Node[];

  // 2. FILTER & TRANSFORM OBSTACLES
  // This applies the same fix used in InteractionEdge to handle nested nodes
  const obstacles = allNodes
    .filter((n) => {
      // Exclude endpoints
      if (n.id === source || n.id === target) return false;

      // Exclude Dashboard Background (D0) so the edge can travel inside it
      // Check both type and ID prefix to be safe
      if (n.type === 'dashboard' || n.id.startsWith('D0')) return false;

      // Exclude hidden nodes
      if (n.hidden) return false;

      return true;
    })
    .map((n) => {
      // CRITICAL FIX: CONVERT RELATIVE POSITIONS TO ABSOLUTE
      // React Flow stores child nodes (charts inside dashboard) with relative positions (e.g., x: 10).
      // The Smart Edge library calculates paths in global screen space.
      // We must map 'position' to 'positionAbsolute' so the library knows where the obstacles actually are.
      if (n.positionAbsolute) {
        return { ...n, position: n.positionAbsolute };
      }
      return n;
    });

  const side: 'left' | 'right' =
    data?.sourceSide ?? (targetX >= sourceX ? 'right' : 'left');

  // Fan-out alignment logic (offsets edges if multiple connect to same node)
  const siblings = Math.max(1, Number(data?.siblings ?? 1));
  const ordinal = Math.min(
    Math.max(0, Number(data?.ordinal ?? 0)),
    siblings - 1
  );
  // V_STACK = 18
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
    nodes: obstacles as any, // Pass the transformed obstacles
    options: {
      nodePadding: 10, // Small padding to allow routing through tight gaps
      gridRatio: 2, // High precision grid for accurate pathfinding
    },
  });

  // 4. FALLBACK LOGIC
  let finalPath = '';

  if (smartResponse && 'svgPath' in smartResponse) {
    finalPath = smartResponse.svgPath as string;
  } else {
    // Use SmoothStep (right-angled lines) as fallback if smart routing fails
    // This looks cleaner in a dashboard context than curved bezier lines
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

  // 5. ICON & STYLING
  const key: ActivationKey =
    data?.activation === 'click' || data?.activation === 'hover'
      ? data.activation
      : 'hover';
  const src = activationIcons[key];

  const OUTSET = 1;
  const iconCx = side === 'right' ? sourceX + OUTSET : sourceX - OUTSET;
  const iconCy = adjustedSourceY;

  const markerId = `tooltip-arrow-${id}`;

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

      {/* CLICKABLE EDGE GROUP */}
      <g
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(
            new CustomEvent('designer:select-edge', {
              detail: {
                edgeId: id,
                type: 'tooltip',
                data,
              },
            })
          );
        }}
        style={{ cursor: 'pointer' }}
      >
        {/* Invisible wide hit-area for easier clicking */}
        <path
          d={finalPath}
          stroke="transparent"
          strokeWidth={20}
          fill="none"
          pointerEvents="stroke"
        />

        {/* Visible stroke (Solid line for Tooltips) */}
        <path
          d={finalPath}
          stroke={STROKE}
          strokeWidth={1.5}
          fill="none"
          markerEnd={`url(#${markerId})`}
          pointerEvents="none"
          style={style}
        />
      </g>

      {/* Activation Icon */}
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
