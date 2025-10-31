// src/canvas/edges/obstacleRouter.ts
import { useStore, type Node } from 'reactflow';

export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

function inflate(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
}

function segIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: Rect
) {
  const rx2 = r.x + r.w;
  const ry2 = r.y + r.h;

  // horizontal
  if (y1 === y2) {
    const y = y1;
    if (y < r.y || y > ry2) return false;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    return !(maxX < r.x || minX > rx2);
  }
  // vertical
  if (x1 === x2) {
    const x = x1;
    if (x < r.x || x > rx2) return false;
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return !(maxY < r.y || minY > ry2);
  }
  return false; // we only route axis-aligned segments
}

export function useObstacles(
  sourceId?: string,
  targetId?: string,
  margin = 8
): Rect[] {
  // ✅ Use nodeInternals (Map<string, Node>) instead of state.nodes
  const rfNodes = useStore(
    (s) => Array.from(s.nodeInternals.values()) as Node[]
  );

  const rects: Rect[] = [];
  for (const n of rfNodes) {
    if (!n || (n as any).hidden) continue;
    if (n.id === sourceId || n.id === targetId) continue;

    // size
    const w = (n as any).width ?? (n.style as any)?.width ?? 0;
    const h = (n as any).height ?? (n.style as any)?.height ?? 0;
    if (w <= 0 || h <= 0) continue;

    // absolute position (React Flow maintains this)
    const absX = n.positionAbsolute?.x ?? n.position.x;
    const absY = n.positionAbsolute?.y ?? n.position.y;

    rects.push(inflate({ x: absX, y: absY, w, h }, margin));
  }
  return rects;
}

export function routeOrthogonalAvoiding(
  source: Pt,
  target: Pt,
  opts: {
    side: 'left' | 'right';
    exitGap: number;
    hGap: number;
    approachGap: number;
    targetHalfH: number;
    targetMargin: number;
    cornerR: number;
    obstacles: Rect[];
  }
) {
  const {
    side,
    exitGap,
    hGap,
    approachGap,
    targetHalfH,
    targetMargin,
    obstacles,
  } = opts;

  const exitX = side === 'right' ? source.x + exitGap : source.x - exitGap;
  const exitY = source.y;

  const awayX = side === 'right' ? exitX + hGap : exitX - hGap;

  const targetTop = target.y - targetHalfH;
  const targetBottom = target.y + targetHalfH;
  const candidates = [targetTop - targetMargin, targetBottom + targetMargin];
  candidates.sort((a, b) => Math.abs(exitY - a) - Math.abs(exitY - b));

  let corridorY = candidates[0];

  // bump corridor to avoid obstacles
  let tries = 0;
  const MAX_TRIES = 20;
  while (
    tries++ < MAX_TRIES &&
    obstacles.some((r) =>
      segIntersectsRect(awayX, corridorY, target.x - approachGap, corridorY, r)
    )
  ) {
    // pick the first blocking rect and move above/below it
    const r = obstacles.find((rr) =>
      segIntersectsRect(awayX, corridorY, target.x - approachGap, corridorY, rr)
    )!;
    const above = r.y - 6;
    const below = r.y + r.h + 6;
    corridorY =
      Math.abs(corridorY - above) < Math.abs(corridorY - below) ? above : below;
  }

  // final vertical approach; nudge X if we intersect something
  let approachX = target.x - approachGap;
  tries = 0;
  while (
    tries++ < MAX_TRIES &&
    obstacles.some((r) =>
      segIntersectsRect(approachX, corridorY, approachX, target.y, r)
    )
  ) {
    const r = obstacles.find((rr) =>
      segIntersectsRect(approachX, corridorY, approachX, target.y, rr)
    )!;
    approachX = side === 'right' ? r.x - 6 : r.x + r.w + 6;
  }

  return { exitX, exitY, awayX, corridorY, approachX };
}
