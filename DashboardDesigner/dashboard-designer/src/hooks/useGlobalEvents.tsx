// src/hooks/useGlobalEvents.tsx
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
import { slug } from '../domain/utils';

import InteractionPopup from '../components/popups/InteractionPopup';
import VisualVariablePopup from '../components/popups/VisualVariablePopup';
import TooltipPopup from '../components/popups/TooltipPopup';

type AppNode = RFNode<NodeData>;
type AppEdge = RFEdge<any>;

// Helper to determine ReactFlow node type string from NodeKind
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
  // 1. SELECT TOOLTIP LISTENER
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

  // 2. SELECT INTERACTION EDGE LISTENER
  useEffect(() => {
    const onSelectInteraction = (e: Event) => {
      const { interactionId } = (e as CustomEvent).detail || {};
      if (!interactionId) return;

      const targetEdge = edges.find(
        (e) => e.data?.interactionId === interactionId
      );

      if (targetEdge) {
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, selected: false } : n))
        );
        setEdges((eds) =>
          eds.map((e) => ({
            ...e,
            selected: e.id === targetEdge.id,
          }))
        );

        setSelectedId(null);
        setSelectedEdgeId(targetEdge.id);
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

  // 3. SELECT EDGE (CANVAS CLICK)
  useEffect(() => {
    const onSelectEdge = (e: Event) => {
      const { edgeId } = (e as CustomEvent).detail || {};
      if (!edgeId) return;
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

  // 4. VISUAL VARIABLES SYNC
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

  // 5. OPEN VISUAL VARS MODAL
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

  // 6. PATCH NODE DATA
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

  // 7. ADD COMPONENT
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

  // 8. ADD GRAPHS
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

  // 9. EDIT GRAPHS
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

  // 10. SET GRAPH TYPE
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

  // 11. INTERACTIONS POPUP (MAIN LOGIC)
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
                const ref = slug(label);
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

              // --- LOGIC: Parameter Renaming (Initial Setup) ---
              const isParameter = source.data.kind === 'Parameter';
              const renamesByNode: Record<string, Record<string, string>> = {};
              let finalTargetDetails = [...targetDetails];

              if (isParameter) {
                finalTargetDetails = finalTargetDetails.map((detail) => {
                  if (detail.targetType === 'data' && detail.targetDataRef) {
                    const oldSlug = detail.targetDataRef;

                    // We need the original display name from the target node to rename it
                    const targetNode = nodes.find(
                      (n) => n.id === detail.targetId
                    );
                    const rawDataList = (targetNode?.data as any)?.data || [];
                    const originalItem = rawDataList.find(
                      (it: any) =>
                        slug(typeof it === 'string' ? it : it.name) === oldSlug
                    );
                    const originalName = originalItem
                      ? typeof originalItem === 'string'
                        ? originalItem
                        : originalItem.name
                      : oldSlug;

                    // New name logic: "City" -> "City = ?"
                    const newName = `${originalName} = ?`;

                    if (!renamesByNode[detail.targetId])
                      renamesByNode[detail.targetId] = {};
                    renamesByNode[detail.targetId][originalName] = newName;
                    renamesByNode[detail.targetId][slug(originalName)] =
                      newName;

                    return { ...detail, targetDataRef: slug(newName) };
                  }
                  return detail;
                });
              }

              // --- LOGIC: Dashboard Creation ---
              let finalTargets = targets;
              let finalTargetDetailsList = finalTargetDetails;

              if (result === 'dashboard' && newDashboardName) {
                const newDashId = nanoid();

                setNodes((nds) => {
                  const all = [...nds];
                  const sourcePos = source.position;

                  // CREATE NEW DASHBOARD NODE
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
                finalTargetDetailsList = [
                  { targetId: newDashId, targetType: 'component' },
                ];
              }

              // --- BATCH UPDATE NODES (Applies Renames & Add Interaction) ---
              setNodes((nds) => {
                const all = nds.map((n) => ({ ...n }));

                // 1. Apply renames to target data attributes (Visual Update)
                Object.entries(renamesByNode).forEach(([nodeId, renameMap]) => {
                  const nodeIndex = all.findIndex((n) => n.id === nodeId);
                  if (nodeIndex >= 0) {
                    const node = all[nodeIndex];
                    const oldDataList = (node.data as any).data || [];

                    const newDataList = Array.isArray(oldDataList)
                      ? oldDataList.map((item: any) => {
                          const itemName =
                            typeof item === 'string' ? item : item.name;
                          const itemSlug = slug(itemName);

                          const newName =
                            renameMap[itemName] || renameMap[itemSlug];

                          if (newName) {
                            return typeof item === 'string'
                              ? newName
                              : { ...item, name: newName };
                          }
                          return item;
                        })
                      : [];

                    // Update target node data structure
                    const nextData = { ...node.data };
                    if ((node.data as any).data) {
                      (nextData as any).data = newDataList;
                    }

                    all[nodeIndex] = { ...node, data: nextData };
                  }
                });

                // 2. Add Interaction to Source
                const i = all.findIndex((n) => n.id === sourceId);
                if (i >= 0) {
                  const cur: Interaction[] = Array.isArray(
                    (all[i].data as any).interactions
                  )
                    ? [...(all[i].data as any).interactions]
                    : [];

                  cur.push({
                    id: interactionId,
                    name,
                    trigger,
                    result,
                    targets: finalTargets,
                    ...({ targetDetails: finalTargetDetailsList } as any),
                  } as any);

                  all[i] = {
                    ...all[i],
                    data: {
                      ...(all[i].data as any),
                      interactions: cur,
                    } as any,
                  };
                }
                return all;
              });

              // --- BATCH UPDATE EDGES (Deferred to avoid Handle missing warning) ---
              setTimeout(() => {
                setEdges((eds) => {
                  let nextEdges = [...eds];

                  // 1. Fix existing edges if handles were renamed (check BOTH source and target)
                  if (Object.keys(renamesByNode).length > 0) {
                    nextEdges = nextEdges.map((e) => {
                      const updateHandle = (
                        handle: string | null | undefined,
                        nodeId: string
                      ) => {
                        if (!handle || !renamesByNode[nodeId]) return handle;
                        const map = renamesByNode[nodeId];
                        for (const [oldName, newName] of Object.entries(map)) {
                          const oldSlug = slug(oldName);
                          const newSlug = slug(newName);
                          // Data handles look like "data:slug:..."
                          if (handle.includes(`data:${oldSlug}`))
                            return handle.replace(oldSlug, newSlug);
                        }
                        return handle;
                      };

                      const newTargetHandle = updateHandle(
                        e.targetHandle,
                        e.target
                      );
                      const newSourceHandle = updateHandle(
                        e.sourceHandle,
                        e.source
                      );

                      if (
                        newTargetHandle !== e.targetHandle ||
                        newSourceHandle !== e.sourceHandle
                      ) {
                        return {
                          ...e,
                          targetHandle: newTargetHandle,
                          sourceHandle: newSourceHandle,
                        };
                      }
                      return e;
                    });
                  }

                  // 2. Determine Source Handle for new edge
                  // FIX: Parameters use 'null' (default node handle)
                  let sourceHandleId: string | null | undefined;
                  if (isParameter) {
                    sourceHandleId = null;
                  } else {
                    sourceHandleId =
                      sourceType === 'component'
                        ? `${sourceId}:act:${trigger}`
                        : `data:${slug(sourceDataRef ?? '')}:${trigger}`;
                  }

                  // 3. Create new interaction edges
                  const add = finalTargetDetailsList.map((detail) => {
                    const tid = detail.targetId;
                    const targetHandle =
                      detail.targetType === 'data' && detail.targetDataRef
                        ? `data:${detail.targetDataRef}:target`
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
                  return nextEdges.concat(add);
                });
              }, 0);
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

  // 12. TOOLTIPS POPUP
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

  // 15. PARAMETER VALUE CHANGE LISTENER
  useEffect(() => {
    const onParamChange = (e: Event) => {
      const { nodeId, value } = (e as CustomEvent).detail;
      if (!nodeId || !value) return;

      // Find edges emanating from this parameter
      // Since Parameter sourceHandle is null, we match by source node ID
      const connectedEdges = edges.filter((ed) => ed.source === nodeId);
      if (connectedEdges.length === 0) return;

      takeSnapshot();

      // Create maps for efficient updates
      let nodesMap = new Map(nodes.map((n) => [n.id, { ...n }]));
      let edgesToUpdate = [...edges];

      connectedEdges.forEach((edge) => {
        const targetId = edge.target;
        const targetNode = nodesMap.get(targetId);
        if (!targetNode) return;

        // Check if edge targets a data attribute
        if (edge.targetHandle && edge.targetHandle.startsWith('data:')) {
          const parts = edge.targetHandle.split(':');
          if (parts.length < 2) return;
          const currentSlug = parts[1];

          const dataList = (targetNode.data as any).data || [];

          const itemIndex = dataList.findIndex((it: any) => {
            const name = typeof it === 'string' ? it : it.name;
            return slug(name) === currentSlug;
          });

          if (itemIndex > -1) {
            const item = dataList[itemIndex];
            const oldName = typeof item === 'string' ? item : item.name;

            // Extract base name: "City = ?" -> "City"
            const match = oldName.match(/^(.*?)(\s*=\s*.*)?$/);
            const baseName = match ? match[1] : oldName;

            const newName = `${baseName} = ${value}`;
            const newSlug = slug(newName);

            // 1. Update Target Node Data
            const newDataList = [...dataList];
            if (typeof item === 'string') {
              newDataList[itemIndex] = newName;
            } else {
              newDataList[itemIndex] = { ...item, name: newName };
            }

            const nextData = { ...targetNode.data };
            if ((nextData as any).data) {
              (nextData as any).data = newDataList;
            }
            targetNode.data = nextData;
            nodesMap.set(targetId, targetNode);

            // 2. Update all edges connected to this attribute (Source AND Target)
            // This uses setTimeout to defer the edge update until after re-render
            setTimeout(() => {
              setEdges((currentEdges) => {
                return currentEdges.map((edg) => {
                  let nextEdge = { ...edg };

                  // Update target handle if it points to old slug
                  // Need to handle both the edge being processed and other edges to same attr
                  if (
                    nextEdge.target === targetId &&
                    nextEdge.targetHandle?.includes(`:${currentSlug}:`)
                  ) {
                    nextEdge.targetHandle = nextEdge.targetHandle.replace(
                      `:${currentSlug}:`,
                      `:${newSlug}:`
                    );
                    // Update metadata if present
                    if (nextEdge.data?.targetDataRef === currentSlug) {
                      nextEdge.data = {
                        ...nextEdge.data,
                        targetDataRef: newSlug,
                      };
                    }
                  }

                  // Update source handle if it comes from old slug
                  if (
                    nextEdge.source === targetId &&
                    nextEdge.sourceHandle?.includes(`:${currentSlug}:`)
                  ) {
                    nextEdge.sourceHandle = nextEdge.sourceHandle.replace(
                      `:${currentSlug}:`,
                      `:${newSlug}:`
                    );
                  }
                  return nextEdge;
                });
              });
            }, 0);
          }
        }
      });

      setNodes(Array.from(nodesMap.values()));
    };

    window.addEventListener(
      'designer:parameter-value-change',
      onParamChange as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:parameter-value-change',
        onParamChange as EventListener
      );
  }, [nodes, edges, setNodes, setEdges, takeSnapshot]);
}
