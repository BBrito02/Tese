import type { Node as RFNode } from 'reactflow';
import type { NodeData, NodeKind } from './types';

// Constants extracted from Editor.tsx
export const PAD_X = 5;
export const PAD_TOP = 17;
export const PAD_BOTTOM = 28;
export const HEADER_H = 23;
export const GRID_GAP = 16;

// Type alias for convenience within this file
type AppNode = RFNode<NodeData>;

/** Minimum container base sizes (keeps dashboards a bit larger than visualizations). */
export function baseMinFor(kind: NodeKind | undefined) {
  return {
    w: kind === 'Dashboard' ? 320 : 180,
    h: kind === 'Dashboard' ? 180 : 100,
  };
}

/** Read the current rendered size from node.style (falls back to sensible defaults). */
export function getNodeSize(n: AppNode) {
  const w = (n as any).width ?? (n.style as any)?.width ?? 180;
  const h = (n as any).height ?? (n.style as any)?.height ?? 100;
  return { w: Number(w) || 0, h: Number(h) || 0 };
}

/** Absolute (canvas) position by accumulating parent offsets. */
export function getAbsolutePosition(n: AppNode, all: AppNode[]) {
  let x = n.position.x;
  let y = n.position.y;
  let cur: AppNode | undefined = n;
  while (cur.parentNode) {
    const p = all.find((nn) => nn.id === cur!.parentNode);
    if (!p) break;
    x += p.position.x;
    y += p.position.y;
    cur = p as AppNode;
  }
  return { x, y };
}

/** Depth (nesting level) of a node in the hierarchy. */
export function depthOf(n: AppNode, all: AppNode[]) {
  let d = 0;
  let cur: AppNode | undefined = n;
  while (cur?.parentNode) {
    const p = all.find((nn) => nn.id === cur!.parentNode);
    if (!p) break;
    d++;
    cur = p as AppNode;
  }
  return d;
}

/** Whether a node kind can contain children. */
export function isContainerKind(k: NodeKind | undefined) {
  return k === 'Dashboard' || k === 'Visualization' || k === 'Tooltip';
}

/** True if a flow-space point lies in the *content* area of a container node. */
export function pointInsideContentAbs(
  p: { x: number; y: number },
  n: AppNode,
  all: AppNode[]
) {
  const { w, h } = getNodeSize(n);
  const abs = getAbsolutePosition(n, all);

  const left = abs.x + PAD_X;
  const top = abs.y + HEADER_H + PAD_TOP;
  const right = abs.x + w - PAD_X;
  const bottom = abs.y + h - PAD_BOTTOM;

  return p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
}

// --- NEW HELPERS RESTORED FROM OLD EDITOR ---

/** Collect all descendants (recursive) of a set of root ids. */
export function collectDescendants(all: AppNode[], roots: Set<string>) {
  const toDelete = new Set(roots);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of all) {
      if (n.parentNode && toDelete.has(n.parentNode) && !toDelete.has(n.id)) {
        toDelete.add(n.id);
        changed = true;
      }
    }
  }
  return toDelete;
}

/** Whether `node` lies under the given `ancestorId`. */
export function isDescendant(
  node: AppNode,
  ancestorId: string,
  all: AppNode[]
) {
  let cur: AppNode | undefined = all.find((n) => n.id === node.id);
  while (cur?.parentNode) {
    if (cur.parentNode === ancestorId) return true;
    cur = all.find((n) => n.id === cur!.parentNode);
  }
  return false;
}
