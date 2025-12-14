import { useEffect } from 'react';
import type { Node as RFNode, Edge as RFEdge } from 'reactflow';
import { nanoid } from 'nanoid';
import type {
  NodeData,
  VisualVariable,
  GraphType,
  Interaction,
  DataItem,
  NodeKind,
} from '../domain/types';
import { nextBadgeFor } from '../domain/types';
import {
  getAbsolutePosition,
  getNodeSize,
  PAD_X,
  HEADER_H,
  PAD_TOP,
  GRID_GAP,
} from '../domain/layoutUtils';

import InteractionPopup from '../components/popups/InteractionPopup';
import VisualVariablePopup from '../components/popups/VisualVariablePopup';
import TooltipPopup from '../components/popups/TooltipPopup';

type AppNode = RFNode<NodeData>;
type AppEdge = RFEdge<any>;

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

interface UseGlobalEventsProps {
  nodes: AppNode[];
  setNodes: React.Dispatch<React.SetStateAction<AppNode[]>>;
  edges: AppEdge[];
  setEdges: React.Dispatch<React.SetStateAction<AppEdge[]>>;
  setSelectedId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  selectedId: string | null;
  openModal: (content: any) => void;
  closeModal: () => void;
  takeSnapshot: () => void;
  applyConstraints: (nodes: AppNode[]) => AppNode[];
  updateNodeById: (id: string, patch: Partial<NodeData>) => Promise<void>;
  createChildInParent: (parentId: string, payload: any) => void;
}

export function useGlobalEvents({
  nodes,
  setNodes,
  edges,
  setEdges,
  setSelectedId,
  setSelectedEdgeId,
  selectedId,
  openModal,
  closeModal,
  takeSnapshot,
  applyConstraints,
  updateNodeById,
  createChildInParent,
}: UseGlobalEventsProps) {
  // --- Select Tooltip Listener ---
  useEffect(() => {
    const onSelectTooltip = (e: Event) => {
      const { parentId, label } = (e as CustomEvent).detail || {};
      if (!parentId || !label) return;

      const target = nodes.find((n) => {
        if (n.data?.kind !== 'Tooltip') return false;
        const d = n.data as any;
        if (d.attachedTo !== parentId) return false;
        const l = `${d.badge ? d.badge + ' ' : ''}${d.title || ''}`;
        return l === label;
      });

      if (target) {
        console.log('[Editor] selecting tooltip node:', target.id);

        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === target.id,
            hidden: n.id === target.id ? false : n.hidden,
          }))
        );

        setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));

        setSelectedEdgeId(null);
        setSelectedId(target.id);
      } else {
        console.warn('No tooltip found for label:', label);
      }
    };

    window.addEventListener(
      'designer:select-tooltip',
      onSelectTooltip as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:select-tooltip',
        onSelectTooltip as EventListener
      );
  }, [nodes, setNodes, setEdges, setSelectedId, setSelectedEdgeId]);

  // --- Select Interaction Edge Listener ---
  useEffect(() => {
    const onSelectInteraction = (e: Event) => {
      const { interactionId } = (e as CustomEvent).detail || {};
      if (!interactionId) return;

      const targetEdge = edges.find(
        (e) => e.data?.interactionId === interactionId
      );

      if (targetEdge) {
        console.log('[Editor] selecting interaction edge:', targetEdge.id);
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, selected: false } : n))
        );
        setEdges((eds) =>
          eds.map((e) => ({ ...e, selected: e.id === targetEdge.id }))
        );
        setSelectedId(null);
        setSelectedEdgeId(targetEdge.id);
      } else {
        console.warn('No edge found for interaction:', interactionId);
      }
    };

    window.addEventListener(
      'designer:select-interaction',
      onSelectInteraction as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:select-interaction',
        onSelectInteraction as EventListener
      );
  }, [edges, setNodes, setEdges, setSelectedId, setSelectedEdgeId]);

  // 1. EDGE SELECTION
  useEffect(() => {
    const onSelectEdge = (e: Event) => {
      const { edgeId } = (e as CustomEvent).detail || {};
      if (!edgeId) return;
      console.log('[Editor] edge selected', { edgeId });
      setSelectedId(null);
      setSelectedEdgeId(edgeId);
    };
    window.addEventListener(
      'designer:select-edge',
      onSelectEdge as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:select-edge',
        onSelectEdge as EventListener
      );
  }, [setSelectedId, setSelectedEdgeId]);

  // 2. VISUAL VARIABLES
  useEffect(() => {
    function onEnsureVV(e: Event) {
      const { parentId, vars } = (
        e as CustomEvent<{ parentId: string; vars: VisualVariable[] }>
      ).detail;
      takeSnapshot();
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== parentId) return n;
          const cur = Array.isArray((n.data as any).visualVars)
            ? (n.data as any).visualVars
            : [];
          const next = Array.from(new Set([...(cur ?? []), ...(vars ?? [])]));
          if (next.length === cur.length) return n;
          return { ...n, data: { ...(n.data as any), visualVars: next } };
        })
      );
    }
    window.addEventListener('designer:ensure-visual-vars', onEnsureVV as any);
    return () =>
      window.removeEventListener(
        'designer:ensure-visual-vars',
        onEnsureVV as any
      );
  }, [setNodes, takeSnapshot]);

  // 3. OPEN VISUAL VARS MODAL
  useEffect(() => {
    function onOpenVisualVars(e: Event) {
      const { nodeId } = (e as CustomEvent<{ nodeId: string }>).detail || {};
      if (!nodeId) return;
      const node = nodes.find((n) => n.id === nodeId);
      const current = Array.isArray((node?.data as any)?.visualVars)
        ? ([...(node!.data as any).visualVars] as VisualVariable[])
        : [];

      openModal({
        title: 'Visual variables',
        node: (
          <VisualVariablePopup
            initial={current}
            onCancel={closeModal}
            onSave={(vars) => {
              window.dispatchEvent(
                new CustomEvent('designer:patch-node-data', {
                  detail: { nodeId, patch: { visualVars: vars } },
                })
              );
              closeModal();
            }}
          />
        ),
      });
    }
    window.addEventListener(
      'designer:open-visualvars',
      onOpenVisualVars as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:open-visualvars',
        onOpenVisualVars as EventListener
      );
  }, [nodes, openModal, closeModal]);

  // 4. PATCH NODE DATA
  useEffect(() => {
    function onPatchNodeData(
      e: CustomEvent<{ nodeId: string; patch: Partial<NodeData> }>
    ) {
      const { nodeId, patch } = e.detail || ({} as any);
      if (!nodeId || !patch) return;
      updateNodeById(nodeId, patch);
    }
    const handler = onPatchNodeData as unknown as EventListener;
    window.addEventListener('designer:patch-node-data', handler);
    return () =>
      window.removeEventListener('designer:patch-node-data', handler);
  }, [updateNodeById]);

  // 5. ADD COMPONENT
  useEffect(() => {
    function onAddComponent(
      e: CustomEvent<{ parentId: string; payload: any }>
    ) {
      const { parentId, payload } = e.detail || ({} as any);
      if (!parentId || !payload) return;
      createChildInParent(parentId, payload);
    }
    const handler = onAddComponent as unknown as EventListener;
    window.addEventListener('designer:add-component', handler);
    return () => window.removeEventListener('designer:add-component', handler);
  }, [createChildInParent]);

  // 6. ADD GRAPHS
  useEffect(() => {
    function onAddGraphs(e: Event) {
      const { parentId, graphTypes } =
        (e as CustomEvent<{ parentId: string; graphTypes: GraphType[] }>)
          .detail || {};
      if (!parentId || !Array.isArray(graphTypes) || graphTypes.length === 0)
        return;

      takeSnapshot();
      setNodes((nds) => {
        const all = nds.map((n) => ({ ...n }));
        const parent = all.find((n) => n.id === parentId);
        if (!parent) return nds;

        const { w: pW } = getNodeSize(parent);
        const innerWidth = Math.max(0, pW - PAD_X * 2);
        const gSize = { width: 200, height: 140 };
        const cols = Math.max(
          1,
          Math.floor((innerWidth + GRID_GAP) / (gSize.width + GRID_GAP))
        );

        const existing = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );

        graphTypes.forEach((gt, idx) => {
          const reuse = existing[idx];
          if (reuse) {
            const i = all.findIndex((n) => n.id === reuse.id);
            all[i] = {
              ...reuse,
              data: { ...(reuse.data as any), graphType: gt } as any,
            };
          } else {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = PAD_X + col * (gSize.width + GRID_GAP);
            const y = HEADER_H + PAD_TOP + row * (gSize.height + GRID_GAP);
            all.push({
              id: nanoid(),
              type: nodeTypeFor('Graph'),
              position: { x, y },
              parentNode: parentId,
              extent: 'parent',
              style: gSize,
              data: {
                kind: 'Graph',
                title: 'Graph',
                graphType: gt,
                badge: nextBadgeFor('Graph', all),
              } as NodeData,
            } as AppNode);
          }
        });
        return applyConstraints(all);
      });
    }
    window.addEventListener(
      'designer:add-graphs',
      onAddGraphs as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:add-graphs',
        onAddGraphs as EventListener
      );
  }, [setNodes, takeSnapshot, applyConstraints]);

  // 7. EDIT GRAPHS
  useEffect(() => {
    function onEditGraphs(e: Event) {
      const { parentId, graphTypes } =
        (e as CustomEvent<{ parentId: string; graphTypes: GraphType[] }>)
          .detail || {};
      if (!parentId || !Array.isArray(graphTypes)) return;

      takeSnapshot();
      setNodes((nds) => {
        let all = nds.map((n) => ({ ...n }));
        const parent = all.find((n) => n.id === parentId);
        if (!parent) return nds;

        const existing = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );
        const existingMap = new Map<GraphType, AppNode>();
        existing.forEach((n) => existingMap.set((n.data as any).graphType, n));

        const wanted = new Set(graphTypes);
        const toRemoveIds = existing
          .filter((n) => !wanted.has((n.data as any).graphType))
          .map((n) => n.id);
        all = all.filter((n) => !toRemoveIds.includes(n.id));

        const { w: pW } = getNodeSize(parent);
        const innerWidth = Math.max(0, pW - PAD_X * 2);
        const gSize = { width: 200, height: 140 };
        const cols = Math.max(
          1,
          Math.floor((innerWidth + GRID_GAP) / (gSize.width + GRID_GAP))
        );

        const kept = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );
        const needToAdd = graphTypes.filter((gt) => !existingMap.has(gt));

        needToAdd.forEach((gt, i) => {
          const idx = kept.length + i;
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const x = PAD_X + col * (gSize.width + GRID_GAP);
          const y = HEADER_H + PAD_TOP + row * (gSize.height + GRID_GAP);

          all.push({
            id: nanoid(),
            type: nodeTypeFor('Graph'),
            position: { x, y },
            parentNode: parentId,
            extent: 'parent',
            style: gSize,
            data: {
              kind: 'Graph',
              title: 'Graph',
              graphType: gt,
              badge: nextBadgeFor('Graph', all),
            } as NodeData,
          } as AppNode);
        });

        all = all.map((n) =>
          n.id === parentId
            ? ({
                ...n,
                data: { ...n.data, graphTypes: graphTypes.slice() },
              } as any)
            : n
        );
        return applyConstraints(all);
      });
    }
    window.addEventListener(
      'designer:edit-graphs',
      onEditGraphs as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:edit-graphs',
        onEditGraphs as EventListener
      );
  }, [setNodes, takeSnapshot, applyConstraints]);

  // 8. SET GRAPH TYPE
  useEffect(() => {
    function onSetGraphType(e: Event) {
      const { nodeId, graphType } =
        (e as CustomEvent<{ nodeId: string; graphType: GraphType }>).detail ||
        {};
      if (!nodeId || !graphType) return;
      takeSnapshot();
      setNodes((nds) => {
        const all = nds.map((n) => ({ ...n }));
        const parent = all.find((n) => n.id === nodeId);
        if (!parent) return nds;

        const withParent = all.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, graphType } } : n
        );
        const existing = withParent.find(
          (n) => n.parentNode === nodeId && (n.data as any)?.kind === 'Graph'
        );

        if (existing) {
          return withParent.map((n) =>
            n.id === existing.id ? { ...n, data: { ...n.data, graphType } } : n
          ) as AppNode[];
        }

        const size = { width: 200, height: 140 };
        return withParent.concat({
          id: nanoid(),
          type: nodeTypeFor('Graph'),
          position: { x: 16, y: 16 },
          parentNode: nodeId,
          extent: 'parent',
          style: size,
          data: {
            kind: 'Graph',
            title: 'Graph',
            graphType,
            badge: nextBadgeFor('Graph', withParent),
          } as NodeData,
        } as AppNode);
      });
    }
    window.addEventListener(
      'designer:set-graph-type',
      onSetGraphType as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:set-graph-type',
        onSetGraphType as EventListener
      );
  }, [setNodes, takeSnapshot]);

  // 9. INTERACTIONS POPUP
  useEffect(() => {
    function onOpenInteractions(e: Event) {
      const sourceId = (e as CustomEvent<{ nodeId: string }>).detail?.nodeId;
      if (!sourceId) return;
      const source = nodes.find((n) => n.id === sourceId);
      if (!source) return;

      const availableTargets = nodes
        .filter((n) => n.id !== sourceId)
        .map((n) => {
          const nd = n.data as any;
          const dataAttrs = Array.isArray(nd.data)
            ? nd.data.map((v: any) => {
                const label = typeof v === 'string' ? v : v.name;
                const ref = label
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9_-]/g, '');
                return { ref, label };
              })
            : [];
          const isGraph = nd.kind === 'Graph';
          const graphType = nd.graphType as string | undefined;
          const title =
            isGraph && graphType ? `${graphType} Graph` : nd.title || n.id;
          return {
            id: n.id,
            title,
            kind: nd.kind || 'Node',
            badge: nd.badge,
            parentId: n.parentNode as string,
            dataAttributes: dataAttrs,
          };
        });

      const rawData = (source.data as any)?.data;
      const dataAttributes = Array.isArray(rawData)
        ? (rawData as (string | DataItem)[])
            .map((it) => {
              const name = typeof it === 'string' ? it : it?.name;
              if (!name) return null;
              return { ref: name, label: name };
            })
            .filter((x): x is { ref: string; label: string } => x !== null)
        : [];

      openModal({
        title: 'Add interaction',
        node: (
          <InteractionPopup
            sourceKind={source.data.kind}
            availableTargets={availableTargets}
            dataAttributes={dataAttributes}
            onCancel={closeModal}
            onSave={({
              name,
              trigger,
              result,
              targets,
              sourceType,
              sourceDataRef,
              targetDetails,
              newDashboardName,
            }) => {
              const interactionId = nanoid();

              // --- HANDLE DASHBOARD CREATION ---
              let finalTargets = targets;
              let finalTargetDetails = targetDetails;

              if (result === 'dashboard' && newDashboardName) {
                const newDashId = nanoid();

                setNodes((nds) => {
                  const all = [...nds];
                  const sourcePos = source.position;
                  all.push({
                    id: newDashId,
                    type: 'dashboard',
                    position: { x: sourcePos.x + 400, y: sourcePos.y },
                    data: {
                      kind: 'Dashboard',
                      title: newDashboardName,
                      badge: nextBadgeFor('Dashboard', all),
                    } as NodeData,
                    style: { width: 800, height: 600 },
                  } as AppNode);
                  return all;
                });

                finalTargets = [newDashId];
                finalTargetDetails = [
                  { targetId: newDashId, targetType: 'component' },
                ];
              }
              // ---------------------------------

              setNodes((nds) => {
                const next = nds.map((n) => ({ ...n }));
                const i = next.findIndex((n) => n.id === sourceId);
                if (i >= 0) {
                  const cur: Interaction[] = Array.isArray(
                    (next[i].data as any).interactions
                  )
                    ? [...(next[i].data as any).interactions]
                    : [];
                  cur.push({
                    id: interactionId,
                    name,
                    trigger,
                    result,
                    targets: finalTargets,
                    ...({ targetDetails: finalTargetDetails } as any),
                  } as any);
                  next[i] = {
                    ...next[i],
                    data: {
                      ...(next[i].data as any),
                      interactions: cur,
                    } as any,
                  };
                }
                return next;
              });

              const slug = (s: string) =>
                s
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9_-]/g, '');
              const sourceHandleId =
                sourceType === 'component'
                  ? `${sourceId}:act:${trigger}`
                  : `data:${slug(sourceDataRef ?? '')}:${trigger}`;

              setEdges((eds) => {
                const add = finalTargetDetails.map((detail) => {
                  const tid = detail.targetId;
                  const targetHandle =
                    detail.targetType === 'data' && detail.targetDataRef
                      ? `data:${slug(detail.targetDataRef)}:target`
                      : `${tid}:target`;
                  return {
                    id: `ix-${sourceId}-${tid}-${nanoid(4)}`,
                    source: sourceId,
                    sourceHandle: sourceHandleId,
                    target: tid,
                    targetHandle,
                    type: 'interaction',
                    data: {
                      kind: 'interaction-link',
                      label: name,
                      trigger,
                      result,
                      sourceHandle: sourceHandleId,
                      sourceType,
                      ...(sourceType === 'data' && sourceDataRef
                        ? { sourceDataRef }
                        : {}),
                      interactionId,
                      targetId: tid,
                      targetType: detail.targetType,
                      ...(detail.targetDataRef
                        ? { targetDataRef: detail.targetDataRef }
                        : {}),
                    },
                  } as AppEdge;
                });
                return eds.concat(add);
              });
              closeModal();
            }}
          />
        ),
      });
    }
    window.addEventListener(
      'designer:open-interactions',
      onOpenInteractions as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:open-interactions',
        onOpenInteractions as EventListener
      );
  }, [nodes, openModal, closeModal, setNodes, setEdges]);

  // 10. TOOLTIPS POPUP
  useEffect(() => {
    function onOpenTooltips(e: Event) {
      const vizId = (e as CustomEvent<{ nodeId: string }>).detail?.nodeId;
      if (!vizId) return;
      const n = nodes.find((x) => x.id === vizId);
      const availableData = ((n?.data as any)?.data ?? []).map((v: any) =>
        typeof v === 'string' ? { name: v, dtype: 'Other' } : v
      );

      const getAbs = (id: string) => {
        const nn = nodes.find((a) => a.id === id);
        if (!nn) return { x: 0, y: 0, w: 0, h: 0 };
        return getAbsolutePosition(nn, nodes);
      };

      openModal({
        title: 'Tooltip menu',
        node: (
          <TooltipPopup
            availableData={availableData}
            onCancel={closeModal}
            onSave={(spec) => {
              const { attachRef, activation, newTooltip } = spec;
              const abs = getAbs(vizId);
              const tW = 250,
                tH = 180;
              const pos = { x: abs.x - tW - 24, y: abs.y + 8 };
              const tipId = nanoid();

              setNodes((nds) => {
                let next = nds.map((x) => ({ ...x }));
                const tipBadge = nextBadgeFor('Tooltip', next) ?? '';
                const tipTitle = newTooltip?.title?.trim() || 'Tooltip';
                const data: NodeData = {
                  kind: 'Tooltip',
                  title: tipTitle,
                  attachedTo: vizId,
                  attachTarget:
                    attachRef === 'viz'
                      ? { type: 'viz' }
                      : { type: 'data', ref: attachRef },
                  activation,
                  badge: tipBadge,
                } as any;

                next = next.concat({
                  id: tipId,
                  type: 'tooltip',
                  position: pos,
                  data,
                  style: { width: tW, height: tH },
                  hidden: selectedId !== vizId,
                } as AppNode);
                const label = `${tipBadge ? tipBadge + ' ' : ''}${tipTitle}`;
                next = next.map((nn) => {
                  if (nn.id !== vizId) return nn;
                  const existing = Array.isArray((nn.data as any)?.tooltips)
                    ? ([...(nn.data as any).tooltips] as string[])
                    : [];
                  if (existing.includes(label)) return nn;
                  return {
                    ...nn,
                    data: { ...nn.data, tooltips: [...existing, label] },
                  };
                });
                return next;
              });

              const slug = (s: string) =>
                s
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9_-]/g, '');
              const tipTargetHandle = `${tipId}:target`;

              if (attachRef === 'viz') {
                setEdges((eds) =>
                  eds.concat({
                    id: `e-viz-${vizId}-tip-${tipId}`,
                    source: vizId,
                    target: tipId,
                    targetHandle: tipTargetHandle,
                    type: 'tooltip',
                    data: { activation, targetH: 180 },
                  } as AppEdge)
                );
              } else {
                const sourceHandle = `data:${slug(attachRef)}:${activation}`;
                const addEdgeOnce = () => {
                  setEdges((eds) => {
                    if (
                      eds.some(
                        (e) =>
                          e.source === vizId &&
                          e.target === tipId &&
                          e.sourceHandle === sourceHandle
                      )
                    )
                      return eds;
                    return eds.concat({
                      id: `e-viz-${vizId}-${sourceHandle}-tip-${tipId}`,
                      source: vizId,
                      sourceHandle,
                      target: tipId,
                      targetHandle: tipTargetHandle,
                      type: 'tooltip',
                      data: { activation, attachRef, targetH: 180 },
                    } as AppEdge);
                  });
                };
                let tries = 0;
                const tryAdd = () => {
                  if (tries++ < 8) requestAnimationFrame(tryAdd);
                  addEdgeOnce();
                };
                tryAdd();
              }
              closeModal();
            }}
          />
        ),
      });
    }
    window.addEventListener(
      'designer:open-tooltips',
      onOpenTooltips as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:open-tooltips',
        onOpenTooltips as EventListener
      );
  }, [nodes, selectedId, openModal, closeModal, setNodes, setEdges]);
}
