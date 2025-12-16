import { useEffect } from 'react';
import type { Node as RFNode, Edge as RFEdge } from 'reactflow';
import { nanoid } from 'nanoid';
import type { NodeData, GraphType, NodeKind } from '../domain/types';
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
  // --- NEW: Generic Node Selection Listener ---
  useEffect(() => {
    const onSelectNode = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail || {};
      if (!nodeId) return;

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }))
      );
      setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
      setSelectedId(nodeId);
      setSelectedEdgeId(null);
    };

    window.addEventListener(
      'designer:select-node',
      onSelectNode as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:select-node',
        onSelectNode as EventListener
      );
  }, [setNodes, setEdges, setSelectedId, setSelectedEdgeId]);

  // ... (Previous listeners remain unchanged)
  useEffect(() => {
    const onSelectTooltip = (e: Event) => {
      const { parentId, label } = (e as CustomEvent).detail || {};
      if (!parentId || !label) return;
      const target = nodes.find(
        (n) =>
          n.data?.kind === 'Tooltip' &&
          (n.data as any).attachedTo === parentId &&
          `${n.data.badge ? n.data.badge + ' ' : ''}${n.data.title || ''}` ===
            label
      );
      if (target) {
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
          eds.map((e) => ({ ...e, selected: e.id === targetEdge.id }))
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

  useEffect(() => {
    function onEnsureVV(e: Event) {
      const { parentId, vars } = (e as CustomEvent).detail;
      takeSnapshot();
      setNodes((nds) =>
        nds.map((n) =>
          n.id !== parentId
            ? n
            : {
                ...n,
                data: {
                  ...n.data,
                  visualVars: Array.from(
                    new Set([...((n.data as any).visualVars || []), ...vars])
                  ),
                },
              }
        )
      );
    }
    window.addEventListener('designer:ensure-visual-vars', onEnsureVV as any);
    return () =>
      window.removeEventListener(
        'designer:ensure-visual-vars',
        onEnsureVV as any
      );
  }, [setNodes, takeSnapshot]);

  useEffect(() => {
    function onOpenVisualVars(e: Event) {
      const { nodeId } = (e as CustomEvent).detail || {};
      const node = nodes.find((n) => n.id === nodeId);
      openModal({
        title: 'Visual variables',
        node: (
          <VisualVariablePopup
            initial={(node?.data as any)?.visualVars || []}
            onCancel={closeModal}
            onSave={(vars) => {
              updateNodeById(nodeId, { visualVars: vars });
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

  useEffect(() => {
    function onPatch(e: CustomEvent) {
      updateNodeById(e.detail.nodeId, e.detail.patch);
    }
    window.addEventListener(
      'designer:patch-node-data',
      onPatch as EventListener
    );
    return () =>
      window.removeEventListener(
        'designer:patch-node-data',
        onPatch as EventListener
      );
  }, [updateNodeById]);

  useEffect(() => {
    function onAdd(e: CustomEvent) {
      createChildInParent(e.detail.parentId, e.detail.payload);
    }
    window.addEventListener('designer:add-component', onAdd as EventListener);
    return () =>
      window.removeEventListener(
        'designer:add-component',
        onAdd as EventListener
      );
  }, [createChildInParent]);

  useEffect(() => {
    function onAddGraphs(e: Event) {
      const { parentId, graphTypes } = (e as CustomEvent).detail || {};
      if (!parentId || !graphTypes) return;
      takeSnapshot();
      setNodes((nds) => {
        const all = nds.map((n) => ({ ...n }));
        const parent = all.find((n) => n.id === parentId);
        if (!parent) return nds;
        const { w: pW } = getNodeSize(parent);
        const gSize = { width: 200, height: 140 };
        const innerWidth = Math.max(0, pW - PAD_X * 2);
        const cols = Math.max(
          1,
          Math.floor((innerWidth + GRID_GAP) / (gSize.width + GRID_GAP))
        );
        const existing = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );
        graphTypes.forEach((gt: GraphType, idx: number) => {
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

  useEffect(() => {
    function onEditGraphs(e: Event) {
      const { parentId, graphTypes } = (e as CustomEvent).detail || {};
      if (!parentId) return;
      takeSnapshot();
      setNodes((nds) => {
        let all = nds.map((n) => ({ ...n }));
        const parent = all.find((n) => n.id === parentId);
        if (!parent) return nds;
        const existing = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );
        const toRemoveIds = existing
          .filter((n) => !new Set(graphTypes).has((n.data as any).graphType))
          .map((n) => n.id);
        all = all.filter((n) => !toRemoveIds.includes(n.id));

        const { w: pW } = getNodeSize(parent);
        const gSize = { width: 200, height: 140 };
        const innerWidth = Math.max(0, pW - PAD_X * 2);
        const cols = Math.max(
          1,
          Math.floor((innerWidth + GRID_GAP) / (gSize.width + GRID_GAP))
        );
        const kept = all.filter(
          (n) => n.parentNode === parentId && (n.data as any)?.kind === 'Graph'
        );
        const existingMap = new Set(kept.map((k) => (k.data as any).graphType));
        const needToAdd = graphTypes.filter(
          (gt: GraphType) => !existingMap.has(gt)
        );

        needToAdd.forEach((gt: GraphType, i: number) => {
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

  useEffect(() => {
    function onSetGraphType(e: Event) {
      const { nodeId, graphType } = (e as CustomEvent).detail;
      if (!nodeId) return;
      takeSnapshot();
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, graphType } } : n
        )
      );
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

  useEffect(() => {
    function onOpenInteractions(e: Event) {
      const sourceId = (e as CustomEvent).detail?.nodeId;
      const source = nodes.find((n) => n.id === sourceId);
      if (!sourceId || !source) return;

      const availableTargets = nodes
        .filter((n) => n.id !== sourceId)
        .map((n) => {
          const nd = n.data as any;
          const dataAttrs = Array.isArray(nd.data)
            ? nd.data.map((v: any) => ({ ref: v.id, label: v.name }))
            : [];
          return {
            id: n.id,
            title: nd.title || n.id,
            kind: nd.kind || 'Node',
            badge: nd.badge,
            parentId: n.parentNode as string,
            dataAttributes: dataAttrs,
          };
        });

      const rawData = (source.data as any)?.data || [];
      const dataAttributes = rawData.map((it: any) => ({
        ref: it.id,
        label: it.name,
      }));

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
              const isParameter = source.data.kind === 'Parameter';

              const nodesToUpdate = new Map<string, any>();

              if (isParameter) {
                targetDetails.forEach((detail) => {
                  if (detail.targetType === 'data' && detail.targetDataRef) {
                    const attrId = detail.targetDataRef;
                    const targetNode = nodes.find(
                      (n) => n.id === detail.targetId
                    );

                    if (targetNode) {
                      const rawDataList = (targetNode.data as any)?.data || [];
                      const itemIndex = rawDataList.findIndex(
                        (it: any) => it.id === attrId
                      );

                      if (itemIndex > -1) {
                        const originalItem = rawDataList[itemIndex];
                        const baseName = originalItem.name.split(' = ')[0];
                        const newName = `${baseName} = ?`;

                        const newDataList = [...rawDataList];
                        newDataList[itemIndex] = {
                          ...originalItem,
                          name: newName,
                        };

                        const prevUpdate = nodesToUpdate.get(targetNode.id) || {
                          ...targetNode,
                        };
                        const nextData = {
                          ...prevUpdate.data,
                          ...((prevUpdate.data as any).data
                            ? { data: newDataList }
                            : {}),
                        };
                        nodesToUpdate.set(targetNode.id, {
                          ...prevUpdate,
                          data: nextData,
                        });
                      }
                    }
                  }
                });
              }

              let finalTargets = targets;
              let finalTargetDetailsList = targetDetails;
              let newDashboardNode: AppNode | null = null;
              if (result === 'dashboard' && newDashboardName) {
                const newDashId = nanoid();
                newDashboardNode = {
                  id: newDashId,
                  type: 'dashboard',
                  position: {
                    x: source.position.x + 400,
                    y: source.position.y,
                  },
                  data: {
                    kind: 'Dashboard',
                    title: newDashboardName,
                    badge: nextBadgeFor('Dashboard', nodes),
                  } as NodeData,
                  style: { width: 800, height: 600 },
                } as AppNode;
                finalTargets = [newDashId];
                finalTargetDetailsList = [
                  { targetId: newDashId, targetType: 'component' },
                ];
              }

              setNodes((nds) => {
                let all = nds.map((n) =>
                  nodesToUpdate.has(n.id) ? nodesToUpdate.get(n.id) : n
                );
                if (newDashboardNode) all.push(newDashboardNode);
                const idx = all.findIndex((n) => n.id === sourceId);
                if (idx >= 0) {
                  const cur = (all[idx].data as any).interactions || [];
                  all[idx] = {
                    ...all[idx],
                    data: {
                      ...all[idx].data,
                      interactions: [
                        ...cur,
                        {
                          id: interactionId,
                          name,
                          trigger,
                          result,
                          targets: finalTargets,
                          targetDetails: finalTargetDetailsList,
                        },
                      ],
                    } as any,
                  };
                }
                return all;
              });

              setEdges((eds) => {
                let nextEdges = [...eds];
                const sourceHandleId = isParameter
                  ? null
                  : sourceType === 'component'
                  ? `${sourceId}:act:${trigger}`
                  : `data:${sourceDataRef}:${trigger}`;
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
                      interactionId,
                      targetId: tid,
                      targetType: detail.targetType,
                      targetDataRef: detail.targetDataRef,
                    },
                  } as AppEdge;
                });
                return nextEdges.concat(add);
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

  // 12. TOOLTIPS POPUP
  useEffect(() => {
    function onOpenTooltips(e: Event) {
      const vizId = (e as CustomEvent).detail?.nodeId;
      const n = nodes.find((x) => x.id === vizId);
      if (!n) return;
      const availableData = (n.data as any)?.data || [];
      const abs = getAbsolutePosition(n, nodes);
      openModal({
        title: 'Tooltip menu',
        node: (
          <TooltipPopup
            availableData={availableData}
            onCancel={closeModal}
            onSave={(spec) => {
              const { attachRef, activation, newTooltip, attachValue } = spec;
              const tipId = nanoid();
              const tipBadge = nextBadgeFor('Tooltip', nodes);
              const title = newTooltip?.title?.trim() || 'Tooltip';

              setNodes((nds) => {
                const next = [
                  ...nds,
                  {
                    id: tipId,
                    type: 'tooltip',
                    position: { x: abs.x - 250 - 24, y: abs.y + 8 },
                    style: { width: 250, height: 180 },
                    hidden: selectedId !== vizId,
                    data: {
                      kind: 'Tooltip',
                      title,
                      attachedTo: vizId,
                      activation,
                      badge: tipBadge,
                    } as any,
                  } as AppNode,
                ];
                return next.map((x) =>
                  x.id === vizId
                    ? {
                        ...x,
                        data: {
                          ...x.data,
                          tooltips: [
                            ...((x.data as any).tooltips || []),
                            `${tipBadge ? tipBadge + ' ' : ''}${title}`,
                          ],
                        },
                      }
                    : x
                );
              });

              const targetHandle = `${tipId}:target`;
              const sourceHandle =
                attachRef === 'viz' ? null : `data:${attachRef}:${activation}`;

              setEdges((eds) => [
                ...eds,
                {
                  id: `e-viz-${vizId}-${sourceHandle || 'node'}-tip-${tipId}`,
                  source: vizId,
                  target: tipId,
                  sourceHandle,
                  targetHandle,
                  type: 'tooltip',
                  data: {
                    activation,
                    attachRef,
                    attachValue,
                  },
                },
              ]);
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

      const connectedEdges = edges.filter((ed) => ed.source === nodeId);
      if (connectedEdges.length === 0) return;

      takeSnapshot();
      let nodesMap = new Map(nodes.map((n) => [n.id, { ...n }]));

      connectedEdges.forEach((edge) => {
        const targetId = edge.target;
        const targetNode = nodesMap.get(targetId);
        if (!targetNode) return;

        if (edge.targetHandle && edge.targetHandle.startsWith('data:')) {
          const parts = edge.targetHandle.split(':');
          if (parts.length < 2) return;
          const attrId = parts[1];

          const dataList = (targetNode.data as any).data || [];
          const itemIndex = dataList.findIndex((it: any) => it.id === attrId);

          if (itemIndex > -1) {
            const item = dataList[itemIndex];
            const baseName = item.name.split(' = ')[0];
            const newName = `${baseName} = ${value}`;
            const newDataList = [...dataList];
            newDataList[itemIndex] = { ...item, name: newName };

            const nextData = { ...targetNode.data };
            if ((nextData as any).data) (nextData as any).data = newDataList;
            targetNode.data = nextData as any;
            nodesMap.set(targetId, targetNode);
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
