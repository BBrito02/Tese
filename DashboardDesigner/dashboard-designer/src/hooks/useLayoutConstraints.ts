import { useCallback, useEffect } from 'react';
import type { Node as RFNode } from 'reactflow';
import type { NodeData, NodeKind, GraphType } from '../domain/types';
import {
  baseMinFor,
  getNodeSize,
  isContainerKind,
  PAD_X,
  PAD_TOP,
  PAD_BOTTOM,
  HEADER_H,
} from '../domain/layoutUtils';

type AppNode = RFNode<NodeData>;

export function useLayoutConstraints(
  setNodes: React.Dispatch<React.SetStateAction<AppNode[]>>,
  takeSnapshot: () => void
) {
  const applyConstraints = useCallback((initial: AppNode[]): AppNode[] => {
    let local = initial.map((n) => ({ ...n }));

    for (let pass = 0; pass < 5; pass++) {
      let changed = false;
      const next = local.map((n) => ({ ...n }));

      const patch = (id: string, p: Partial<AppNode>) => {
        const i = next.findIndex((x) => x.id === id);
        if (i >= 0) {
          next[i] = { ...next[i], ...p };
          changed = true;
        }
      };

      for (const parent of local) {
        if (!isContainerKind(parent.data?.kind as NodeKind)) continue;

        const { w: pW, h: pH } = getNodeSize(parent);
        const innerLeft = PAD_X;
        const innerTop = HEADER_H + PAD_TOP;
        const innerRight = pW - PAD_X;
        const innerBottom = pH - PAD_BOTTOM;

        let requiredRight = innerLeft;
        let requiredBottom = innerTop;

        for (const child of local) {
          if (child.parentNode !== parent.id) continue;

          const { w: cW, h: cH } = getNodeSize(child);
          const minX = innerLeft;
          const minY = innerTop;
          let maxX = innerRight - cW;
          let maxY = innerBottom - cH;
          if (maxX < minX) maxX = minX;
          if (maxY < minY) maxY = minY;

          const cx = Math.min(Math.max(child.position.x, minX), maxX);
          const cy = Math.min(Math.max(child.position.y, minY), maxY);
          if (cx !== child.position.x || cy !== child.position.y) {
            patch(child.id, { position: { x: cx, y: cy } } as Partial<AppNode>);
          }

          requiredRight = Math.max(requiredRight, cx + cW, innerLeft + cW);
          requiredBottom = Math.max(requiredBottom, cy + cH, innerTop + cH);
        }

        const base = baseMinFor(parent.data?.kind as NodeKind | undefined);
        const needW = Math.max(pW, requiredRight + PAD_X);
        const needH = Math.max(pH, requiredBottom + PAD_BOTTOM);
        const targetW = Math.max(needW, base.w);
        const targetH = Math.max(needH, base.h);

        if (targetW !== pW || targetH !== pH) {
          patch(parent.id, {
            style: { ...(parent.style || {}), width: targetW, height: targetH },
          });
        }
      }

      local = next;
      if (!changed) break;
    }

    return local;
  }, []);

  const syncParentGraphTypes = useCallback((nodes: AppNode[]): AppNode[] => {
    const map = new Map<string, GraphType[]>();
    for (const n of nodes) {
      if (n.data?.kind === 'Graph') {
        const gt = (n.data as any).graphType as GraphType | undefined;
        const pid = n.parentNode;
        if (pid && gt) (map.get(pid) ?? map.set(pid, []).get(pid)!).push(gt);
      }
    }

    return nodes.map((n) => {
      const k = n.data?.kind as NodeKind | undefined;
      if (!k || (k !== 'Visualization' && k !== 'Tooltip')) return n;

      const wanted = map.get(n.id) ?? [];
      const cur = Array.isArray((n.data as any).graphTypes)
        ? ((n.data as any).graphTypes as GraphType[])
        : [];

      const same =
        cur.length === wanted.length && cur.every((x, i) => x === wanted[i]);
      if (same) return n;

      return {
        ...n,
        data: { ...(n.data as any), graphTypes: wanted } as NodeData,
      } as AppNode;
    });
  }, []);

  const handleLayoutReflow = useCallback(() => {
    takeSnapshot();
    setNodes((nds) => {
      const constrained = applyConstraints(nds as AppNode[]);
      const synced = syncParentGraphTypes(constrained);
      return synced;
    });
  }, [setNodes, takeSnapshot, applyConstraints, syncParentGraphTypes]);

  useEffect(() => {
    window.addEventListener('designer:node-resize-stop', handleLayoutReflow);
    return () =>
      window.removeEventListener(
        'designer:node-resize-stop',
        handleLayoutReflow
      );
  }, [handleLayoutReflow]);

  return {
    applyConstraints,
    handleLayoutReflow,
    syncParentGraphTypes,
  };
}
