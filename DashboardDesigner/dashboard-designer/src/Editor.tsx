import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  SelectionMode,
  ControlButton,
} from 'reactflow';
import type {
  ReactFlowInstance,
  Connection,
  Node as RFNode,
  Edge as RFEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import {
  FaCloudDownloadAlt,
  FaCloudUploadAlt,
  FaRegSquare,
  FaUndo,
  FaRedo,
} from 'react-icons/fa';
import { FaHand } from 'react-icons/fa6';

import type {
  NodeData,
  NodeKind,
  Review,
  Reply,
  DataItem,
} from './domain/types';
import { canConnect } from './domain/rules';
import { nextBadgeFor } from './domain/types';
import { slug } from './domain/utils';
import {
  SAVE_VERSION,
  type SaveFile,
  type ExportNode,
} from './domain/saveFormat';
import {
  getNodeSize,
  getAbsolutePosition,
  collectDescendants,
  isDescendant,
  PAD_X,
  HEADER_H,
  PAD_TOP,
  GRID_GAP,
} from './domain/layoutUtils';
import { activationIcons, type ActivationKey } from './domain/icons';

import SideMenu from './components/menus/SideMenu';
import ComponentsMenu from './components/menus/ComponentsMenu';
import AddComponentPopup from './components/popups/ComponentPopup';
import DataPopup from './components/popups/DataPopup'; // <--- ADDED IMPORT
import SavePopup from './components/popups/SavePopup';
import NodeGhost from './canvas/nodes/NodeGhost';
import InteractionEdgeMenu from './components/menus/InteractionEdgeMenu';
import TooltipEdgeMenu from './components/menus/TooltipEdgeMenu';
import ReviewToggle from './components/ui/ReviewToggle';

import TooltipEdge from './canvas/edges/TooltipEdge';
import InteractionEdge from './canvas/edges/InteractionEdge';
import DashboardNode from './canvas/nodes/DashboardNode';
import VisualizationNode from './canvas/nodes/VisualizationNode';
import TooltipNode from './canvas/nodes/TooltipNode';
import LegendNode from './canvas/nodes/LegendNode';
import ButtonNode from './canvas/nodes/ButtonNode';
import FilterNode from './canvas/nodes/FilterNode';
import ParameterNode from './canvas/nodes/ParameterNode';
import DataActionNode from './canvas/nodes/DataActionNode';
import PlaceholderNode from './canvas/nodes/PlaceholderNode';
import GraphNode from './canvas/nodes/GraphNode';

import { useModal } from './components/ui/ModalHost';
import { useUndoRedo } from './hooks/useUndoRedo';
import { saveProjectAsZip, loadProjectFromZip } from './utils/fileUtils';
import { ReviewContext } from './components/ui/ReviewContext';
import { useLayoutConstraints } from './hooks/useLayoutConstraints';
import { useCanvasDrag } from './hooks/useCanvasDrag';
import { useGlobalEvents } from './hooks/useGlobalEvents';

/* =========================
 * Node/Edge component maps
 * ========================= */

const NODE_TYPES = {
  dashboard: DashboardNode,
  visualization: VisualizationNode,
  tooltip: TooltipNode,
  legend: LegendNode,
  button: ButtonNode,
  filter: FilterNode,
  parameter: ParameterNode,
  dataaction: DataActionNode,
  placeholder: PlaceholderNode,
  graph: GraphNode,
};

export function nodeTypeFor(kind: NodeKind): keyof typeof NODE_TYPES {
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

const EDGE_TYPES = { tooltip: TooltipEdge, interaction: InteractionEdge };

/* =========================
 * UI layout constants
 * ========================= */
const PANEL_WIDTH = 280;
const PANEL_MARGIN = 7;
const PANEL_GAP = 8;
const PANEL_ANIM_MS = 200;
const COLLAPSED_W = 28;
const EXTRA_COLLAPSED_GAP = 18;

// Handy aliases
type AppNode = RFNode<NodeData>;
type AppEdge = RFEdge<any>;
const baseFrom = (name: string) => name.replace(/\.[^.]+$/, '');

function flowToScreen(
  rf: ReactFlowInstance | null,
  pt: { x: number; y: number }
) {
  const vp = (rf && (rf as any).getViewport?.()) || { x: 0, y: 0, zoom: 1 };
  return { x: vp.x + pt.x * vp.zoom, y: vp.y + pt.y * vp.zoom };
}

/* =========================
 * Helpers
 * ========================= */

function ModalCleanup({
  onCleanup,
  children,
}: {
  onCleanup: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => () => onCleanup(), [onCleanup]);
  return <>{children}</>;
}

/* =====================================================
 * Main Editor component
 * ===================================================== */

export default function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(
    nodes as any,
    edges,
    setNodes as any,
    setEdges
  );

  // UI state
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [menuExiting, setMenuExiting] = useState(false);
  const [menuWidth, setMenuWidth] = useState<number>(PANEL_WIDTH);
  const [lassoMode, setLassoMode] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewsByTarget, setReviewsByTarget] = useState<
    Record<string, Review[]>
  >({});
  const [saveNameBase, setSaveNameBase] = useState('dashboard-designer');
  const { openModal, closeModal } = useModal();
  const [isConnecting, setIsConnecting] = useState(false);

  // --- 1. Custom Hooks: Layout ---
  const { applyConstraints, handleLayoutReflow, syncParentGraphTypes } =
    useLayoutConstraints(
      setNodes as React.Dispatch<React.SetStateAction<AppNode[]>>,
      takeSnapshot
    );

  // --- Logic: Prune Logic (Perspectives Aware) ---
  const pruneAfterRemoval = useCallback(
    (initialIds: string[]) => {
      takeSnapshot();
      setNodes((nds) => {
        const all = nds as AppNode[];
        const base = new Set<string>(initialIds);

        // 1. If Visualization deleted, delete Tooltips
        for (const id of Array.from(base)) {
          const n = all.find((x) => x.id === id);
          if (n?.data?.kind === 'Visualization') {
            all.forEach((t) => {
              if (
                t.data?.kind === 'Tooltip' &&
                (t.data as any)?.attachedTo === id
              ) {
                base.add(t.id);
              }
            });
          }
        }

        // 2. Collect descendants
        const toDelete = collectDescendants(all, base);

        // --- Perspective Visibility Failover Prep ---
        const deletedActiveNodes = new Map<string, { x: number; y: number }>();
        all.forEach((n) => {
          if (toDelete.has(n.id) && !n.hidden && n.data?.perspectives?.length) {
            const survivors = n.data.perspectives.filter(
              (pid) => !toDelete.has(pid)
            );
            if (survivors.length > 0) {
              const key = survivors.sort().join('|');
              deletedActiveNodes.set(key, { ...n.position });
            }
          }
        });

        // 3. Track tooltip labels to remove
        const labelsByViz = new Map<string, Set<string>>();
        for (const tip of all) {
          if (!toDelete.has(tip.id)) continue;
          if (tip.data?.kind !== 'Tooltip') continue;
          const attachedTo = (tip.data as any)?.attachedTo as
            | string
            | undefined;
          const badge = (tip.data as any)?.badge as string | undefined;
          const title = (tip.data as any)?.title as string | undefined;
          if (!attachedTo || !title) continue;
          const label = `${badge ? badge + ' ' : ''}${title}`;
          if (!labelsByViz.has(attachedTo)) {
            labelsByViz.set(attachedTo, new Set<string>());
          }
          labelsByViz.get(attachedTo)!.add(label);
        }

        // 4. Filter nodes
        let kept = all.filter((n) => !toDelete.has(n.id));

        // --- Clean perspective lists in remaining nodes ---
        kept = kept.map((n) => {
          if (n.data?.perspectives) {
            const newPerspectives = n.data.perspectives.filter(
              (pid) => !toDelete.has(pid)
            );
            if (newPerspectives.length !== n.data.perspectives.length) {
              return {
                ...n,
                data: { ...n.data, perspectives: newPerspectives },
              };
            }
          }
          return n;
        });

        // --- Ensure at least one perspective is visible per group ---
        const groups = new Map<string, AppNode[]>();
        kept.forEach((n) => {
          if (n.data?.perspectives?.length) {
            const key = [...n.data.perspectives].sort().join('|');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(n);
          }
        });

        groups.forEach((groupNodes, key) => {
          const anyVisible = groupNodes.some((n) => !n.hidden);
          if (!anyVisible && groupNodes.length > 0) {
            // Failover candidate
            const candidate = groupNodes[groupNodes.length - 1];
            const newPos = deletedActiveNodes.get(key) ?? candidate.position;

            // Unhide candidate AND its subtree
            const survivorSubtree = collectDescendants(
              kept,
              new Set([candidate.id])
            );

            kept = kept.map((n) => {
              if (survivorSubtree.has(n.id)) {
                const isRoot = n.id === candidate.id;
                return {
                  ...n,
                  hidden: false,
                  position: isRoot ? newPos : n.position,
                  selected: isRoot,
                };
              }
              return n;
            });
          }
        });

        // 5. Prune labels inside Visualizations
        kept = kept.map((n) => {
          if (n.data?.kind !== 'Visualization') return n;
          const pruneSet = labelsByViz.get(n.id);
          if (!pruneSet?.size) return n;
          const current = Array.isArray((n.data as any)?.tooltips)
            ? ([...(n.data as any).tooltips] as string[])
            : [];
          const pruned = current.filter((lbl) => !pruneSet.has(lbl));
          if (pruned.length === current.length) return n;
          return {
            ...n,
            data: { ...(n.data as any), tooltips: pruned },
          } as AppNode;
        });

        // 6. Remove Interactions
        kept = kept.map((n) => {
          const d = n.data as any;
          if (!d?.interactions) return n;
          const cleaned = d.interactions.filter((ix: any) => {
            const stillValid = ix.targets.every(
              (tid: string) => !toDelete.has(tid)
            );
            if (!stillValid) return false;
            if (ix.sourceType === 'data' && ix.sourceDataRef) {
              const dataArr = Array.isArray(d.data) ? d.data : [];
              const exists = dataArr.some((attr: any) =>
                typeof attr === 'string'
                  ? attr === ix.sourceDataRef
                  : attr?.name === ix.sourceDataRef
              );
              if (!exists) return false;
            }
            return true;
          });
          if (cleaned.length === d.interactions.length) return n;
          return { ...n, data: { ...d, interactions: cleaned } } as AppNode;
        });

        // 7. Edge cleanup
        setEdges((eds) =>
          eds.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target))
        );

        // 9. Sync graph types
        return syncParentGraphTypes(kept) as AppNode[];
      });
    },
    [setNodes, setEdges, takeSnapshot, syncParentGraphTypes]
  );

  // --- Logic: Perspective Handlers ---
  const handleCreatePerspective = useCallback(
    (sourceId: string) => {
      takeSnapshot();
      const newId = nanoid();

      setNodes((nds) => {
        const all = nds as AppNode[];
        const sourceNode = all.find((n) => n.id === sourceId);
        if (!sourceNode) return nds;

        const currentPerspectives = sourceNode.data.perspectives || [sourceId];
        const nextPerspectives = [...currentPerspectives, newId];

        const rootsToHide = new Set(currentPerspectives);
        const allNodesToHide = collectDescendants(all, rootsToHide);

        const currentTitle = sourceNode.data.title || 'Component';
        const baseTitle = currentTitle.replace(/\s\(Perspective\s\d+\)$/, '');
        const newTitle = `${baseTitle} (Perspective ${nextPerspectives.length})`;

        const newNode: AppNode = {
          id: newId,
          type: sourceNode.type,
          position: { ...sourceNode.position },
          data: {
            kind: sourceNode.data.kind,
            title: newTitle,
            badge: nextBadgeFor(sourceNode.data.kind, all),
            perspectives: nextPerspectives,
            visualVars: [],
            graphType: undefined,
            data: [],
            interactions: [],
            tooltips: [],
            attachedTo: (sourceNode.data as any).attachedTo,
          } as NodeData,
          style: sourceNode.style,
          parentNode: sourceNode.parentNode,
          extent: sourceNode.extent,
          hidden: false,
          selected: true,
        };

        const updatedNodes = all.map((n) => {
          let newData = n.data;
          if (rootsToHide.has(n.id)) {
            newData = { ...n.data, perspectives: nextPerspectives };
          }
          if (allNodesToHide.has(n.id)) {
            return {
              ...n,
              hidden: true,
              selected: false,
              data: newData,
            };
          }
          if (newData !== n.data) {
            return { ...n, data: newData };
          }
          return n;
        });

        return [...updatedNodes, newNode];
      });

      // Duplicate incoming edges and fix handle IDs
      setEdges((eds) => {
        const newEdges: AppEdge[] = [];
        eds.forEach((e) => {
          if (e.target === sourceId) {
            newEdges.push({
              ...e,
              id: nanoid(),
              target: newId,
              targetHandle: e.targetHandle
                ? e.targetHandle.replace(sourceId, newId)
                : null,
              hidden: false,
            });
          }
        });
        return [...eds, ...newEdges];
      });

      requestAnimationFrame(() => setSelectedId(newId));
    },
    [setNodes, setEdges, takeSnapshot]
  );

  const handleNavigate = useCallback(
    (targetNodeId: string) => {
      setNodes((nds) => {
        const all = nds as AppNode[];
        const targetNode = all.find((n) => n.id === targetNodeId);
        if (!targetNode) return nds;

        const groupIds = targetNode.data.perspectives || [targetNodeId];
        const currentActive = all.find(
          (n) => groupIds.includes(n.id) && !n.hidden
        );
        const positionToUse = currentActive
          ? { ...currentActive.position }
          : targetNode.position;

        const idsToHide = new Set(groupIds.filter((id) => id !== targetNodeId));
        const allNodesToHide = collectDescendants(all, idsToHide);

        const idsToShow = new Set([targetNodeId]);
        const allNodesToShow = collectDescendants(all, idsToShow);

        return all.map((n) => {
          if (allNodesToHide.has(n.id)) {
            return { ...n, hidden: true, selected: false };
          }
          if (allNodesToShow.has(n.id)) {
            const isRoot = n.id === targetNodeId;
            return {
              ...n,
              hidden: false,
              selected: isRoot,
              position: isRoot ? positionToUse : n.position,
            };
          }
          return n;
        });
      });

      setSelectedId(targetNodeId);
    },
    [setNodes, setSelectedId]
  );

  // --- Logic: Update Logic (Fixed for Renaming) ---
  const updateNodeById = useCallback(
    async (id: string, patch: Partial<NodeData>) => {
      takeSnapshot();
      const patchAny = patch as any;

      // 1. Capture Renames (Important: do this before deleting the property)
      const renames = patchAny._dataRenames as
        | Record<string, string>
        | undefined;

      // 2. Handle Data Attribute Renames (Update Edges)
      if (renames) {
        const toHandle = (name: string) => `data:${slug(name)}`;

        setEdges((eds) =>
          eds.map((e) => {
            let next = e;
            // Update Source Handle
            if (e.source === id && e.sourceHandle) {
              for (const [oldName, newName] of Object.entries(renames)) {
                const oldPrefix = toHandle(oldName);
                if (e.sourceHandle.startsWith(oldPrefix)) {
                  const newPrefix = toHandle(newName);
                  const newHandle = e.sourceHandle.replace(
                    oldPrefix,
                    newPrefix
                  );
                  next = { ...next, sourceHandle: newHandle };
                  break;
                }
              }
            }
            // Update Target Handle
            if (e.target === id && e.targetHandle) {
              for (const [oldName, newName] of Object.entries(renames)) {
                const oldPrefix = toHandle(oldName);
                if (e.targetHandle.startsWith(oldPrefix)) {
                  const newPrefix = toHandle(newName);
                  const newHandle = e.targetHandle.replace(
                    oldPrefix,
                    newPrefix
                  );
                  next = { ...next, targetHandle: newHandle };
                  break;
                }
              }
            }
            return next;
          })
        );
        delete patchAny._dataRenames;
      }

      // 3. Detect Data Removal
      if (patchAny.data && Array.isArray(patchAny.data)) {
        const node = nodes.find((n) => n.id === id);
        const rawOld = (node?.data as any)?.data;
        const oldItems = Array.isArray(rawOld) ? rawOld : [];
        const newItems = patchAny.data;

        const toName = (i: any) =>
          !i ? '' : typeof i === 'string' ? i.trim() : (i.name || '').trim();
        const newNamesSet = new Set(newItems.map(toName));

        const removedItems = oldItems.filter(
          (i: any) => !newNamesSet.has(toName(i))
        );

        // --- FILTER: Exclude Renamed Items ---
        const realRemovedItems = removedItems.filter((i) => {
          const n = toName(i);
          // If present in renames map, it wasn't removed, just renamed
          return !renames || !renames[n];
        });

        if (realRemovedItems.length > 0) {
          const toSlug = (s: string) => slug(s);
          const removedPrefixes = new Set(
            realRemovedItems.map((i: any) => `data:${toSlug(toName(i))}`)
          );

          const edgeIdsToDelete: string[] = [];
          const nodeIdsToDelete: string[] = [];
          const interactionsToRemove = new Set<string>();
          const tooltipLabelsToRemove = new Set<string>();

          edges.forEach((e) => {
            let isMatch = false;

            if (e.source === id && e.sourceHandle) {
              for (const prefix of removedPrefixes)
                if (e.sourceHandle.startsWith(prefix)) {
                  isMatch = true;
                  break;
                }
            }
            if (!isMatch && e.target === id && e.targetHandle) {
              for (const prefix of removedPrefixes)
                if (e.targetHandle.startsWith(prefix)) {
                  isMatch = true;
                  break;
                }
            }
            if (isMatch) {
              edgeIdsToDelete.push(e.id);
              if (e.type === 'tooltip' && e.source === id)
                nodeIdsToDelete.push(e.target);
              if (e.type === 'interaction') {
                const d: any = e.data || {};
                if (d?.interactionId) interactionsToRemove.add(d.interactionId);
              }
            }
          });

          const currentInteractions = (node?.data as any)?.interactions || [];
          currentInteractions.forEach((ix: any) => {
            if (
              ix.sourceType === 'data' &&
              ix.sourceDataRef &&
              realRemovedItems.some(
                (rm: any) => toName(rm) === ix.sourceDataRef
              )
            ) {
              interactionsToRemove.add(ix.id);
            }
          });

          if (nodeIdsToDelete.length > 0) {
            const nodesToDeleteSet = new Set(nodeIdsToDelete);
            const tooltipNodes = nodes.filter((n) =>
              nodesToDeleteSet.has(n.id)
            );
            tooltipNodes.forEach((t) => {
              const d = t.data as any;
              const label = `${d.badge ? d.badge + ' ' : ''}${d.title || ''}`;
              tooltipLabelsToRemove.add(label);
            });
          }

          if (
            rf &&
            (edgeIdsToDelete.length > 0 || nodeIdsToDelete.length > 0)
          ) {
            await rf.deleteElements({
              nodes: nodeIdsToDelete.map((id) => ({ id })),
              edges: edgeIdsToDelete.map((id) => ({ id })),
            });
          }

          setNodes(
            (nds) =>
              (nds as unknown as Array<RFNode<NodeData>>).map((n) => {
                const curData: any = n.data as any;
                let nextData: any = curData;
                let changed = false;
                if (n.id === id) {
                  nextData = { ...curData, ...patchAny };
                  changed = true;
                }

                if (
                  interactionsToRemove.size > 0 &&
                  Array.isArray(nextData?.interactions)
                ) {
                  const filtered = nextData.interactions.filter(
                    (ix: any) => !interactionsToRemove.has(ix?.id)
                  );
                  if (filtered.length !== nextData.interactions.length) {
                    if (!changed) nextData = { ...nextData };
                    nextData.interactions = filtered;
                    changed = true;
                  }
                }
                if (
                  n.id === id &&
                  tooltipLabelsToRemove.size > 0 &&
                  Array.isArray(nextData?.tooltips)
                ) {
                  const filtered = nextData.tooltips.filter(
                    (lbl: string) => !tooltipLabelsToRemove.has(lbl)
                  );
                  if (filtered.length !== nextData.tooltips.length) {
                    if (!changed) nextData = { ...nextData };
                    nextData.tooltips = filtered;
                    changed = true;
                  }
                }
                return changed
                  ? ({ ...n, data: nextData } as RFNode<NodeData>)
                  : n;
              }) as AppNode[]
          );
          return;
        }
      }

      setNodes(
        (nds) =>
          nds.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
          ) as AppNode[]
      );
    },
    [nodes, edges, rf, setNodes, takeSnapshot]
  );

  // Helper to create a child node
  const createChildInParent = useCallback(
    (parentId: string, payload: any) => {
      takeSnapshot();
      setNodes((nds) => {
        const all = nds as AppNode[];
        const parent = all.find((n) => n.id === parentId);
        if (!parent) return nds;

        const { w: pW } = getNodeSize(parent);
        const innerWidth = Math.max(0, pW - PAD_X * 2);
        const defaultSizeFor = (kind: NodeKind) => {
          if (kind === 'Visualization') return { width: 320, height: 200 };
          return { width: 180, height: 100 };
        };
        const size = defaultSizeFor(payload.kind);

        let x: number, y: number;

        // Use precise position if provided, else grid
        if (payload.position) {
          x = payload.position.x - size.width / 2;
          y = payload.position.y - size.height / 2;
        } else {
          const cols = Math.max(
            1,
            Math.floor((innerWidth + GRID_GAP) / (size.width + GRID_GAP))
          );
          const children = all.filter((n) => n.parentNode === parentId);
          const idx = children.length;
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          x = PAD_X + col * (size.width + GRID_GAP);
          y = HEADER_H + PAD_TOP + row * (size.height + GRID_GAP);
        }

        let data: NodeData = {
          kind: payload.kind,
          title: payload.title || payload.kind,
          badge: nextBadgeFor(payload.kind, all),
        } as any;
        if (payload.kind === 'Graph') {
          data = { ...data, graphType: payload.graphType || 'Line' };
        }

        return applyConstraints(
          all.concat({
            id: nanoid(),
            type: nodeTypeFor(data.kind),
            position: { x, y },
            parentNode: parentId,
            extent: 'parent',
            data,
            style: size,
          } as AppNode)
        );
      });
    },
    [setNodes, takeSnapshot, applyConstraints]
  );

  // --- 2. Custom Hooks: Drag ---
  const [modal, setModal] = useState<{
    type: 'add-component';
    nodeId: string;
    presetKind?: NodeKind;
    position?: { x: number; y: number };
  } | null>(null);

  const {
    isDraggingFromPalette,
    dragPreview,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    sensors,
  } = useCanvasDrag(
    nodes as AppNode[],
    setNodes as any,
    takeSnapshot,
    rf,
    wrapperRef,
    (parentId, kind, position) =>
      setModal({
        type: 'add-component',
        nodeId: parentId,
        presetKind: kind,
        position,
      })
  );

  // --- 3. Custom Hooks: Global Events ---
  useGlobalEvents({
    nodes: nodes as AppNode[],
    setNodes: setNodes as any,
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
  });

  // --- 4. Load/Save Logic ---
  const buildSave = useCallback((): SaveFile => {
    const vp = (rf && (rf as any).getViewport?.()) || { x: 0, y: 0, zoom: 1 };
    const allReviews = Object.values(reviewsByTarget).flat();
    const exNodes: ExportNode[] = nodes.map((n) => {
      const kind = (n.data as any)?.kind as NodeKind | undefined;
      const inferred = kind ? nodeTypeFor(kind) : 'visualization';
      return {
        id: n.id,
        type: (n.type as any) ?? inferred,
        position: n.position,
        data: n.data,
        style: {
          width: (n as any).width ?? (n.style as any)?.width,
          height: (n as any).height ?? (n.style as any)?.height,
        },
        ...(n.parentNode ? { parentNode: n.parentNode } : {}),
        ...(n.extent === 'parent' ? { extent: 'parent' as const } : {}),
        // --- ADDED: Persist hidden state ---
        hidden: n.hidden,
      };
    });
    return {
      version: SAVE_VERSION,
      createdAt: new Date().toISOString(),
      viewport: vp,
      nodes: exNodes,
      edges: edges as AppEdge[],
      reviews: allReviews,
    };
  }, [rf, nodes, edges, reviewsByTarget]);

  const loadSave = useCallback(
    (save: SaveFile) => {
      let restored: AppNode[] = save.nodes.map((n) => {
        const kind = (n.data as any)?.kind as NodeKind | undefined;
        const fallbackType = kind ? nodeTypeFor(kind) : 'visualization';
        const finalType = (n.type as keyof typeof NODE_TYPES) ?? fallbackType;
        return {
          id: n.id,
          type: finalType,
          position: n.position,
          data: n.data,
          style: { width: n.style?.width, height: n.style?.height },
          parentNode: n.parentNode as any,
          extent: n.extent as any,
          // Restore hidden state
          hidden: (n as any).hidden,
        };
      });

      // --- Fix Perspective Visibility (Legacy/Broken State) ---
      // If loading a file where multiple perspectives are visible (e.g. from before hidden was saved),
      // we must enforce only one visible per group.

      const groups = new Map<string, string[]>();
      restored.forEach((n) => {
        const p = n.data?.perspectives;
        if (Array.isArray(p) && p.length > 1) {
          const key = [...p].sort().join('|');
          groups.set(key, p);
        }
      });

      const rootsToHide = new Set<string>();

      groups.forEach((groupIDs) => {
        const groupNodes = restored.filter((n) => groupIDs.includes(n.id));
        const visibleNodes = groupNodes.filter((n) => !n.hidden);

        if (visibleNodes.length === 0) {
          // If all hidden, show the first one
          const winner = groupNodes[0];
          if (winner) winner.hidden = false;
        } else if (visibleNodes.length > 1) {
          // If multiple visible, pick first and hide others
          const winner = visibleNodes[0];
          visibleNodes.slice(1).forEach((loser) => {
            rootsToHide.add(loser.id);
          });
        }
      });

      // Cascading Hide
      if (rootsToHide.size > 0) {
        const allHidden = collectDescendants(restored, rootsToHide);
        restored = restored.map((n) => {
          if (allHidden.has(n.id)) {
            return { ...n, hidden: true };
          }
          return n;
        });
      }

      setNodes(restored as any);
      setEdges(save.edges as AppEdge[]);
      const reviewsMap: Record<string, Review[]> = {};
      if (save.reviews) {
        save.reviews.forEach((r) => {
          if (!reviewsMap[r.targetId]) reviewsMap[r.targetId] = [];
          reviewsMap[r.targetId].push(r);
        });
      }
      setReviewsByTarget(reviewsMap);
      if (rf && save.viewport)
        (rf as any).setViewport?.(save.viewport, { duration: 0 });
      setSelectedId(null);
    },
    [rf, setNodes, setEdges]
  );

  const openSaveModal = useCallback(() => {
    openModal({
      title: 'Save Project',
      node: (
        <SavePopup
          initialName={saveNameBase}
          onCancel={closeModal}
          onConfirm={(finalFilename) => {
            const projectData = buildSave();
            saveProjectAsZip(projectData, finalFilename);
            setSaveNameBase(baseFrom(finalFilename));
            closeModal();
          }}
        />
      ),
    });
  }, [buildSave, openModal, closeModal, saveNameBase]);

  // Derived state
  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId]
  );

  // Handlers
  const onConnect = useCallback(
    (c: Connection) => {
      setIsConnecting(false);
      const source = nodes.find((n) => n.id === c.source);
      const target = nodes.find((n) => n.id === c.target);
      if (!canConnect(source?.data?.kind, target?.data?.kind)) return;
      takeSnapshot();
      const trigger = c.sourceHandle?.endsWith(':hover') ? 'hover' : 'click';
      const isTooltip = target?.data?.kind === 'Tooltip';
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            animated: false,
            type: isTooltip ? 'tooltip' : 'interaction',
            data: {
              kind: isTooltip ? 'tooltip-link' : 'interaction-link',
              activation: trigger,
            },
          },
          eds
        )
      );
    },
    [nodes, setEdges, takeSnapshot]
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedId) return;

    let fallbackId: string | null = null;
    const node = nodes.find((n) => n.id === selectedId);

    if (node?.data?.perspectives && node.data.perspectives.length > 1) {
      const p = node.data.perspectives;
      const idx = p.indexOf(selectedId);
      if (idx > 0) fallbackId = p[idx - 1];
      else if (idx + 1 < p.length) fallbackId = p[idx + 1];
    }

    pruneAfterRemoval([selectedId]);
    setSelectedId(fallbackId);
  }, [selectedId, nodes, pruneAfterRemoval]);

  // Modal Wiring
  useEffect(() => {
    if (modal?.type !== 'add-component') return;
    const { nodeId, presetKind, position } = modal;
    const closeAndClear = () => {
      closeModal();
      setModal(null);
    };
    openModal({
      title: 'Component Menu',
      node: (
        <ModalCleanup onCleanup={() => setModal(null)}>
          <AddComponentPopup
            kinds={[presetKind] as any}
            onCancel={closeAndClear}
            onSave={(payload: any) => {
              createChildInParent(nodeId, { ...payload, position });
              closeAndClear();
            }}
          />
        </ModalCleanup>
      ),
    });
  }, [modal, createChildInParent, openModal, closeModal]);

  // --- NEW: Global Listener for Data Edit ---
  useEffect(() => {
    const onEditData = (e: Event) => {
      const { nodeId, index } = (e as CustomEvent).detail;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const rawData = (node.data as any).data;
      const toDataItems = (list: any[]): DataItem[] =>
        Array.isArray(list)
          ? list.map((v) =>
              typeof v === 'string' ? { name: v, dtype: 'Other' } : v
            )
          : [];

      openModal({
        title: 'Data fields',
        node: (
          <DataPopup
            initial={toDataItems(rawData)}
            initialSelectedIndex={index} // Select the item directly
            onCancel={closeModal}
            onSave={(items, renames) => {
              updateNodeById(nodeId, {
                data: items,
                _dataRenames: renames,
              } as any);
              closeModal();
            }}
          />
        ),
      });
    };

    window.addEventListener('designer:edit-data', onEditData);
    return () => window.removeEventListener('designer:edit-data', onEditData);
  }, [nodes, openModal, closeModal, updateNodeById]);

  // Menu Animation
  useEffect(() => {
    const onWidth = (e: Event) =>
      setMenuWidth((e as CustomEvent).detail?.width ?? PANEL_WIDTH);
    window.addEventListener('designer:menu-width', onWidth as EventListener);
    return () =>
      window.removeEventListener(
        'designer:menu-width',
        onWidth as EventListener
      );
  }, []);

  // Track last selected
  const lastSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    let t: number | undefined;
    if (!selectedId && lastSelectedIdRef.current) {
      setMenuExiting(true);
      t = window.setTimeout(() => setMenuExiting(false), PANEL_ANIM_MS);
    }
    lastSelectedIdRef.current = selectedId;
    return () => {
      if (t !== undefined) window.clearTimeout(t);
    };
  }, [selectedId]);

  const menuActive = Boolean(selectedId || selectedEdgeId) || menuExiting;
  const buttonsOffset = menuActive
    ? -(
        menuWidth +
        PANEL_MARGIN +
        PANEL_GAP +
        (menuWidth <= COLLAPSED_W ? EXTRA_COLLAPSED_GAP : 0)
      )
    : 0;

  // Tooltip Visibility logic
  useEffect(() => {
    setNodes((nds) => {
      const next = nds.map((n) => ({ ...n }));
      const selected = selectedId
        ? next.find((n) => n.id === selectedId)
        : null;

      let vizIdFromEdge: string | null = null;
      let targetIdFromEdge: string | null = null;
      if (selectedEdgeId) {
        const edge = edges.find((e) => e.id === selectedEdgeId);
        if (edge?.type === 'tooltip') {
          vizIdFromEdge = edge.source;
          targetIdFromEdge = edge.target;
        }
      }

      // Group tooltips by perspective set
      const groups = new Map<string, AppNode[]>();
      const rawVisibility = new Set<string>();

      for (const tip of next) {
        if (tip.data?.kind !== 'Tooltip') continue;

        const pKey = tip.data.perspectives
          ? [...tip.data.perspectives].sort().join('|')
          : tip.id;
        if (!groups.has(pKey)) groups.set(pKey, []);
        groups.get(pKey)!.push(tip);

        const attachedTo = (tip.data as any)?.attachedTo as string | undefined;
        if (!attachedTo) continue;

        const vizSelected =
          selectedId === attachedTo || vizIdFromEdge === attachedTo;
        const tipSelected = selectedId === tip.id;
        const tipChildSelected = selected
          ? isDescendant(selected, tip.id, next)
          : false;
        const vizChildSelected =
          selected && attachedTo
            ? isDescendant(selected, attachedTo, next)
            : false;

        if (
          vizSelected ||
          tipSelected ||
          tipChildSelected ||
          vizChildSelected
        ) {
          rawVisibility.add(tip.id);
        }
      }

      // Resolve conflicts: Only 1 perspective visible per group
      groups.forEach((groupNodes) => {
        const candidates = groupNodes.filter((n) => rawVisibility.has(n.id));

        if (candidates.length === 0) {
          groupNodes.forEach((n) => {
            (n as any).hidden = true;
          });
          return;
        }

        // Pick best: Selected > Edge Target > Already Visible > Last
        let best = candidates[candidates.length - 1];

        const directlySelected = candidates.find((n) => n.id === selectedId);
        const edgeTarget = candidates.find((n) => n.id === targetIdFromEdge);
        const previouslyVisible = candidates.find((n) => !n.hidden);

        if (directlySelected) best = directlySelected;
        else if (edgeTarget) best = edgeTarget;
        else if (previouslyVisible) best = previouslyVisible;

        groupNodes.forEach((n) => {
          (n as any).hidden = n.id !== best.id;
        });
      });

      return next as AppNode[];
    });
  }, [selectedId, selectedEdgeId, edges, setNodes]);

  const [markers, setMarkers] = useState<
    {
      id: string;
      src: string;
      screenX: number;
      screenY: number;
      isSelected: boolean;
    }[]
  >([]);
  const recomputeMarkers = useCallback(() => {
    if (!rf) return;
    const result: typeof markers = [];
    const tooltipEdges = edges.filter(
      (e: any) => (e.data && e.data.kind) === 'tooltip-link'
    );
    for (const e of tooltipEdges as any[]) {
      const viz = nodes.find((n) => n.id === e.source);
      if (!viz) continue;
      const { x: absX, y: absY } = getAbsolutePosition(
        viz as AppNode,
        nodes as AppNode[]
      );
      const { w, h } = getNodeSize(viz as AppNode);
      const anchorFlow = { x: absX + w, y: absY + h / 2 };
      const s = flowToScreen(rf, anchorFlow);
      const screenX = s.x - 9;
      const screenY = s.y;
      const activation: ActivationKey =
        (e.data?.activation as ActivationKey) || 'hover';
      result.push({
        id: `marker-${e.id}`,
        src: activationIcons[activation],
        screenX,
        screenY,
        isSelected: selectedId === e.source,
      });
    }
    setMarkers(result);
  }, [rf, nodes, edges, selectedId]);

  const handleMove = useCallback(() => recomputeMarkers(), [recomputeMarkers]);

  const visibleEdges = useMemo(
    () =>
      edges.map((e) => {
        const rs = reviewsByTarget[e.id] ?? [];
        return {
          ...e,
          style:
            e.type === 'interaction' ? { ...e.style, opacity: 1 } : e.style,
          hidden: e.type === 'interaction' ? false : e.hidden,
          data: {
            ...(e.data || {}),
            reviewMode,
            reviewUnresolvedCount: rs.filter((r) => !r.resolved).length,
            reviewCount: rs.length,
          },
        };
      }),
    [edges, reviewsByTarget, reviewMode]
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId),
    [nodes, selectedId]
  );
  const selectedEdgeSource = useMemo(
    () =>
      selectedEdge
        ? nodes.find((n) => n.id === selectedEdge.source)
        : undefined,
    [selectedEdge, nodes]
  );
  const selectedEdgeTarget = useMemo(
    () =>
      selectedEdge
        ? nodes.find((n) => n.id === selectedEdge.target)
        : undefined,
    [selectedEdge, nodes]
  );

  const parentDataForSelected = useMemo(() => {
    if (!selectedNode || (selectedNode.data as any)?.kind !== 'Graph')
      return undefined;
    const parentId = selectedNode.parentNode;
    if (!parentId) return [];
    const parent = nodes.find((n) => n.id === parentId);
    return (parent?.data as any)?.data ?? [];
  }, [selectedNode, nodes]);

  return (
    <div
      id="editor-root"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#aedbe6ff',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <ReviewContext.Provider value={{ reviewsByTarget, reviewMode }}>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
            }}
          >
            <SideMenu />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2000,
              pointerEvents: 'auto',
            }}
          >
            <ReviewToggle
              checked={reviewMode}
              onChange={setReviewMode}
              leftLabel="Editor"
              rightLabel="Review"
            />
          </div>
          <div
            style={{
              position: 'absolute',
              right: 12,
              top: 12,
              zIndex: 10,
              display: 'flex',
              gap: 8,
              transform: `translateX(${buttonsOffset}px)`,
              transition: `transform ${PANEL_ANIM_MS}ms ease`,
            }}
          >
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
              style={{
                padding: '6px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: canUndo ? '#fff' : '#f0f0f0',
                marginRight: 8,
                cursor: canUndo ? 'pointer' : 'default',
              }}
            >
              <FaUndo size={14} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
              style={{
                padding: '6px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: canRedo ? '#fff' : '#f0f0f0',
                marginRight: 8,
                cursor: canRedo ? 'pointer' : 'default',
              }}
            >
              <FaRedo size={14} />
            </button>
            <button
              onClick={openSaveModal}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <FaCloudDownloadAlt size={16} />
              <span>Save</span>
            </button>
            <label
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <FaCloudUploadAlt size={16} />
              <span>Load</span>
              <input
                type="file"
                accept=".json,.dashboard,.zip"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setSaveNameBase(baseFrom(file.name));
                  try {
                    let data;
                    if (file.name.endsWith('.json')) {
                      const text = await file.text();
                      data = JSON.parse(text);
                    } else {
                      data = await loadProjectFromZip(file);
                    }
                    if (!('version' in data)) {
                      alert('Invalid file format');
                      return;
                    }
                    loadSave(data);
                  } catch (err) {
                    console.error(err);
                    alert('Failed to load.');
                  }
                }}
              />
            </label>
          </div>

          <div
            className={`canvas ${isConnecting ? 'rf-connecting' : ''}`}
            ref={wrapperRef}
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          >
            <ReactFlow
              nodes={nodes}
              edges={visibleEdges}
              onNodesChange={(chs) => {
                onNodesChange(chs);
                const removedIds = chs
                  .filter((c) => c.type === 'remove')
                  .map((c: any) => c.id as string);
                if (removedIds.length) {
                  pruneAfterRemoval(removedIds);
                }
              }}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setRf}
              nodeTypes={NODE_TYPES}
              edgeTypes={EDGE_TYPES}
              selectionMode={SelectionMode.Partial}
              onNodeDragStop={() => handleLayoutReflow()}
              onSelectionChange={(p) => {
                if (!lassoMode) {
                  if (p.nodes.length === 1) {
                    setSelectedId(p.nodes[0].id);
                    setSelectedEdgeId(null);
                  } else if (p.edges.length === 1) {
                    setSelectedEdgeId(p.edges[0].id);
                    setSelectedId(null);
                  } else {
                    setSelectedId(null);
                    setSelectedEdgeId(null);
                  }
                }
              }}
              onMove={() => handleMove()}
              onPaneClick={() => {
                setSelectedId(null);
                setSelectedEdgeId(null);
              }}
              panOnDrag={!lassoMode && !isDraggingFromPalette}
              selectionOnDrag={lassoMode}
            >
              <Background />
              <Controls>
                <ControlButton onClick={() => setLassoMode((v) => !v)}>
                  {lassoMode ? <FaRegSquare /> : <FaHand />}
                </ControlButton>
              </Controls>
            </ReactFlow>
            {/* Markers Overlay - Restored */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 100000,
              }}
            >
              {markers.map((m) => (
                <img
                  key={m.id}
                  src={m.src}
                  alt=""
                  style={{
                    position: 'absolute',
                    left: m.screenX,
                    top: m.screenY,
                    width: 20,
                    height: 20,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 2px 6px rgba(0,0,0,.25)',
                    zIndex: m.isSelected ? 100001 : 100000,
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />
              ))}
            </div>
          </div>

          {selectedNode && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                zIndex: 10,
              }}
            >
              <ComponentsMenu
                key={selectedNode.id}
                node={selectedNode as AppNode}
                onChange={(p) => updateNodeById(selectedNode.id, p)}
                onDelete={deleteSelectedNode}
                reviewMode={reviewMode}
                reviewTargetId={selectedNode.id}
                parentData={parentDataForSelected as any}
                reviews={reviewsByTarget[selectedNode.id] ?? []}
                onReviewCreate={(r) => {
                  setReviewsByTarget((m) => ({
                    ...m,
                    [selectedNode.id]: [...(m[selectedNode.id] || []), r],
                  }));
                }}
                onReviewUpdate={(rid, patch) => {
                  setReviewsByTarget((m) => ({
                    ...m,
                    [selectedNode.id]: (m[selectedNode.id] || []).map((r) =>
                      r.id === rid ? { ...r, ...patch } : r
                    ),
                  }));
                }}
                onReviewDelete={(rid) => {
                  setReviewsByTarget((m) => ({
                    ...m,
                    [selectedNode.id]: (m[selectedNode.id] || []).filter(
                      (r) => r.id !== rid
                    ),
                  }));
                }}
                onReply={(rid, text, author) => {
                  const reply: Reply = {
                    id: nanoid(),
                    text,
                    createdAt: Date.now(),
                    author,
                  };
                  setReviewsByTarget((m) => ({
                    ...m,
                    [selectedNode.id]: (m[selectedNode.id] || []).map((r) =>
                      r.id === rid
                        ? { ...r, replies: [...(r.replies || []), reply] }
                        : r
                    ),
                  }));
                }}
                onDeleteReply={(rid, replyId) => {
                  setReviewsByTarget((m) => ({
                    ...m,
                    [selectedNode.id]: (m[selectedNode.id] || []).map((r) =>
                      r.id === rid
                        ? {
                            ...r,
                            replies: (r.replies || []).filter(
                              (re) => re.id !== replyId
                            ),
                          }
                        : r
                    ),
                  }));
                }}
                onOpen={(type) => {
                  if (selectedNode)
                    setModal({ type, nodeId: selectedNode.id } as any);
                }}
                onCreatePerspective={
                  (selectedNode.data as any).kind !== 'Graph'
                    ? handleCreatePerspective
                    : undefined
                }
                onNavigate={handleNavigate}
              />
            </div>
          )}

          {!selectedNode && selectedEdge && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                zIndex: 10,
              }}
            >
              {reviewMode ? (
                <ComponentsMenu
                  key={`edge-${selectedEdge.id}`}
                  node={
                    {
                      id: selectedEdge.id,
                      data: {
                        kind: 'Visualization',
                        title: `Edge ${selectedEdge.id}`,
                      },
                      position: { x: 0, y: 0 },
                      type: 'visualization',
                    } as any
                  }
                  onChange={() => {}}
                  onOpen={undefined}
                  parentData={undefined}
                  reviewMode
                  reviewTargetId={selectedEdge.id}
                  reviews={reviewsByTarget[selectedEdge.id] ?? []}
                  onReviewCreate={(r) =>
                    setReviewsByTarget((m) => ({
                      ...m,
                      [selectedEdge.id]: [...(m[selectedEdge.id] || []), r],
                    }))
                  }
                  onReviewUpdate={(rid, patch) =>
                    setReviewsByTarget((m) => ({
                      ...m,
                      [selectedEdge.id]: (m[selectedEdge.id] || []).map((r) =>
                        r.id === rid ? { ...r, ...patch } : r
                      ),
                    }))
                  }
                  onReviewDelete={(rid) =>
                    setReviewsByTarget((m) => ({
                      ...m,
                      [selectedEdge.id]: (m[selectedEdge.id] || []).filter(
                        (r) => r.id !== rid
                      ),
                    }))
                  }
                  onReply={(rid, text, author) => {
                    const reply: Reply = {
                      id: nanoid(),
                      text,
                      createdAt: Date.now(),
                      author,
                    };
                    setReviewsByTarget((m) => ({
                      ...m,
                      [selectedEdge.id]: (m[selectedEdge.id] || []).map((r) =>
                        r.id === rid
                          ? { ...r, replies: [...(r.replies || []), reply] }
                          : r
                      ),
                    }));
                  }}
                  onDeleteReply={(rid, replyId) =>
                    setReviewsByTarget((m) => ({
                      ...m,
                      [selectedEdge.id]: (m[selectedEdge.id] || []).map((r) =>
                        r.id === rid
                          ? {
                              ...r,
                              replies: (r.replies || []).filter(
                                (re) => re.id !== replyId
                              ),
                            }
                          : r
                      ),
                    }))
                  }
                />
              ) : selectedEdge.type === 'tooltip' ? (
                <TooltipEdgeMenu
                  edge={selectedEdge as AppEdge}
                  sourceTitle={
                    (selectedEdgeSource?.data as any)?.title ??
                    selectedEdge.source
                  }
                  targetTitle={
                    (selectedEdgeTarget?.data as any)?.title ??
                    selectedEdge.target
                  }
                  onDelete={() => {
                    pruneAfterRemoval([selectedEdge.target]);
                    setSelectedEdgeId(null);
                  }}
                />
              ) : (
                <InteractionEdgeMenu
                  edge={selectedEdge as AppEdge}
                  sourceTitle={
                    (selectedEdgeSource?.data as any)?.title ??
                    selectedEdge.source
                  }
                  targetTitle={
                    (selectedEdgeTarget?.data as any)?.title ??
                    selectedEdge.target
                  }
                  onDelete={() => {
                    const edgeToRemove = selectedEdge as AppEdge;
                    const edgeData = (edgeToRemove.data || {}) as any;
                    const interactionId = edgeData.interactionId;
                    const targetId = edgeData.targetId ?? edgeToRemove.target;
                    const label = edgeData.label;
                    const sourceId = edgeToRemove.source;

                    setEdges((eds) =>
                      eds.filter((e) => e.id !== edgeToRemove.id)
                    );

                    setNodes((nds) => {
                      const all = nds as AppNode[];
                      const next = all.map((n) => {
                        if (n.id !== sourceId) return n;
                        const d = n.data as any;
                        if (!Array.isArray(d.interactions)) return n;
                        let changed = false;
                        let interactions: any[] = d.interactions;

                        if (interactionId) {
                          interactions = d.interactions
                            .map((ix: any) => {
                              if (ix.id !== interactionId) return ix;
                              const currentTargets = Array.isArray(ix.targets)
                                ? ix.targets
                                : [];
                              const newTargets = currentTargets.filter(
                                (tid: string) => tid !== targetId
                              );
                              if (newTargets.length === 0) {
                                changed = true;
                                return null;
                              }
                              if (newTargets.length !== currentTargets.length) {
                                changed = true;
                                return { ...ix, targets: newTargets };
                              }
                              return ix;
                            })
                            .filter(Boolean);
                        } else {
                          // Fallback
                          interactions = d.interactions.filter((ix: any) => {
                            const currentTargets = Array.isArray(ix.targets)
                              ? ix.targets
                              : [];
                            if (
                              label &&
                              ix.name === label &&
                              currentTargets.includes(targetId)
                            ) {
                              const newTargets = currentTargets.filter(
                                (tid: string) => tid !== targetId
                              );
                              if (newTargets.length === 0) {
                                changed = true;
                                return false;
                              }
                              ix.targets = newTargets;
                              changed = true;
                              return true;
                            }
                            return true;
                          });
                        }
                        if (!changed) return n;
                        return {
                          ...n,
                          data: { ...d, interactions },
                        } as AppNode;
                      });
                      return next;
                    });
                    setSelectedEdgeId(null);
                  }}
                />
              )}
            </div>
          )}

          <DragOverlay dropAnimation={{ duration: 150 }}>
            {dragPreview ? <NodeGhost payload={dragPreview} /> : null}
          </DragOverlay>
        </DndContext>
      </ReviewContext.Provider>
    </div>
  );
}
