import { useState } from 'react';
import type { Dispatch, SetStateAction, RefObject } from 'react';
import {
  useSensors,
  useSensor,
  PointerSensor,
  type DragStartEvent,
  type DragMoveEvent,
  type DragCancelEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { nanoid } from 'nanoid';
import type { ReactFlowInstance, Node as RFNode } from 'reactflow';
import type { NodeData, NodeKind } from '../domain/types';
import { allowedChildKinds } from '../domain/rules';
import { nextBadgeFor } from '../domain/types';
import type { DragData } from '../components/menus/SideMenu';
import {
  pointInsideContentAbs,
  depthOf,
  isContainerKind,
} from '../domain/layoutUtils';

type AppNode = RFNode<NodeData>;

// Local helper to define node types without depending on Editor.tsx
function nodeTypeFor(kind: NodeKind): string {
  switch (kind) {
    case 'Dashboard':
      return 'dashboard';
    case 'Visualization':
      return 'visualization';
    case 'Tooltip':
      return 'tooltip';
    case 'Legend':
      return 'legend';
    case 'Button':
      return 'button';
    case 'Filter':
      return 'filter';
    case 'Parameter':
      return 'parameter';
    case 'DataAction':
      return 'dataaction';
    case 'Placeholder':
      return 'placeholder';
    case 'Graph':
      return 'graph';
    default:
      return 'visualization';
  }
}

export function useCanvasDrag(
  nodes: AppNode[],
  setNodes: Dispatch<SetStateAction<AppNode[]>>,
  takeSnapshot: () => void,
  rf: ReactFlowInstance | null,
  wrapperRef: RefObject<HTMLDivElement | null>, // <--- FIXED TYPE HERE
  onDropInParent: (parentId: string, kind: NodeKind) => void
) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const [isDraggingFromPalette, setIsDraggingFromPalette] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragData | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [cursorPoint, setCursorPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [dragTargetParentId, setDragTargetParentId] = useState<string | null>(
    null
  );
  const [dragAllowed, setDragAllowed] = useState(false);
  const [cachedContainers, setCachedContainers] = useState<AppNode[]>([]);

  function getPointFromEvent(ev: Event): { x: number; y: number } | null {
    if ('clientX' in ev && 'clientY' in ev) {
      const e = ev as unknown as { clientX: number; clientY: number };
      return { x: e.clientX, y: e.clientY };
    }
    if ('touches' in ev && (ev as TouchEvent).touches[0]) {
      const t = (ev as TouchEvent).touches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return null;
  }

  function getDragCenter(e: DragEndEvent): { x: number; y: number } | null {
    const { current } = e.active.rect;
    if (current.translated) {
      const { left, top, width, height } = current.translated;
      return { x: left + width / 2, y: top + height / 2 };
    }
    if (current.initial) {
      const { left, top, width, height } = current.initial;
      return {
        x: left + e.delta.x + width / 2,
        y: top + e.delta.y + height / 2,
      };
    }
    return null;
  }

  const handleDragStart = (e: DragStartEvent) => {
    setIsDraggingFromPalette(true);
    setDragPreview((e.active.data.current as DragData) ?? null);
    const p = getPointFromEvent(e.activatorEvent);
    setDragStartPoint(p);
    setCursorPoint(p);
    // Cache containers at start of drag
    const containers = nodes.filter((n) => isContainerKind(n.data?.kind));
    setCachedContainers(containers);
  };

  const handleDragMove = (e: DragMoveEvent) => {
    if (!dragStartPoint) return;
    const nextCursor = {
      x: dragStartPoint.x + e.delta.x,
      y: dragStartPoint.y + e.delta.y,
    };
    setCursorPoint(nextCursor);
    if (!rf || !wrapperRef.current) return;

    const flowPt = rf.screenToFlowPosition({
      x: nextCursor.x,
      y: nextCursor.y,
    });

    let best: { id: string; kind: NodeKind; depth: number } | null = null;
    for (const n of cachedContainers) {
      if (pointInsideContentAbs(flowPt, n, nodes)) {
        const d = depthOf(n, nodes);
        if (!best || d > best.depth)
          best = { id: n.id, kind: n.data.kind!, depth: d };
      }
    }

    const parentId = best?.id ?? null;
    const parentKind = best?.kind;
    setDragTargetParentId(parentId);

    const payload = e.active?.data?.current as DragData | undefined;
    const childKind = payload?.kind as NodeKind | undefined;
    const isAllowed = !!(
      parentKind &&
      childKind &&
      allowedChildKinds(parentKind).includes(childKind)
    );
    setDragAllowed(isAllowed);

    if (parentId) {
      document.body.style.cursor = isAllowed ? 'copy' : 'not-allowed';
    } else {
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleDragCancel = (_e: DragCancelEvent) => {
    setIsDraggingFromPalette(false);
    setDragPreview(null);
    setDragStartPoint(null);
    setCursorPoint(null);
    setDragTargetParentId(null);
    setDragAllowed(false);
    document.body.style.cursor = '';
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setIsDraggingFromPalette(false);
    const payload = e.active.data.current as DragData | undefined;
    setDragPreview(null);

    const parentId = dragTargetParentId;
    const allowed = dragAllowed;
    setDragTargetParentId(null);
    setDragAllowed(false);
    document.body.style.cursor = '';

    if (!payload || !rf || !wrapperRef.current) return;

    if (allowed && parentId) {
      onDropInParent(parentId, payload.kind as NodeKind);
      return;
    }

    const viewportPt = cursorPoint ?? getDragCenter(e);
    setDragStartPoint(null);
    setCursorPoint(null);
    if (!viewportPt) return;

    takeSnapshot();

    const flowCenter = rf.screenToFlowPosition({
      x: viewportPt.x,
      y: viewportPt.y,
    });

    let data: NodeData;
    if (payload.kind === 'Graph') {
      data = {
        kind: 'Graph',
        title: payload.title ?? 'Graph',
        graphType: 'Line',
      };
    } else {
      data = {
        kind: payload.kind,
        title: payload.title ?? payload.kind,
      } as NodeData;
    }

    const defaultSizeFor = (kind: NodeKind) => {
      if (kind === 'Dashboard') return { width: 700, height: 380 };
      if (kind === 'Visualization') return { width: 320, height: 200 };
      return { width: 180, height: 100 };
    };
    const size = defaultSizeFor(data.kind);

    const position = {
      x: flowCenter.x - size.width / 2,
      y: flowCenter.y - size.height / 2,
    };

    setNodes((nds) =>
      nds.concat({
        id: nanoid(),
        type: nodeTypeFor(data.kind) as any,
        position,
        data: { ...data, badge: nextBadgeFor(data.kind, nds) },
        style: size,
      } as AppNode)
    );
  };

  return {
    sensors,
    isDraggingFromPalette,
    dragPreview,
    handleDragStart,
    handleDragMove,
    handleDragCancel,
    handleDragEnd,
  };
}
