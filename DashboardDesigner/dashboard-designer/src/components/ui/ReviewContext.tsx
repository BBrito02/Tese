import { createContext, useContext, useMemo } from 'react';
import type { Node, Edge } from 'reactflow';
import type { Review, NodeData } from '../../domain/types';
import { collectDescendants } from '../../domain/layoutUtils';

type ReviewContextType = {
  reviewsByTarget: Record<string, Review[]>;
  reviewMode: boolean;
  nodes: Node<NodeData>[];
  edges: Edge[];
};

export const ReviewContext = createContext<ReviewContextType>({
  reviewsByTarget: {},
  reviewMode: false,
  nodes: [],
  edges: [],
});

export const useReviews = (targetId: string) => {
  const { reviewsByTarget, reviewMode, nodes, edges } =
    useContext(ReviewContext);

  const { total, unresolved, reviews } = useMemo(() => {
    // Start with the target node itself
    const relevantNodeIds = new Set<string>([targetId]);

    // Iteratively expand the set of relevant nodes to include:
    // 1. Descendants (Hierarchy children)
    // 2. Attached Tooltips (Connected via edges)
    let changed = true;
    while (changed) {
      const startSize = relevantNodeIds.size;

      // A. Add hierarchy descendants (e.g., Graph inside Visualization)
      // collectDescendants returns a set of ALL descendants for the given roots
      const descendants = collectDescendants(nodes, relevantNodeIds);
      descendants.forEach((id) => relevantNodeIds.add(id));

      // B. Add connected Tooltips
      // If a relevant node has an edge pointing to a Tooltip, include that Tooltip
      edges.forEach((edge) => {
        if (relevantNodeIds.has(edge.source)) {
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (targetNode?.data.kind === 'Tooltip') {
            relevantNodeIds.add(edge.target);
          }
        }
      });

      // If we added any new nodes (children or tooltips), repeat the loop
      // to find THEIR children or tooltips.
      changed = relevantNodeIds.size > startSize;
    }

    // 3. Identify relevant edges
    // Any edge starting from a relevant node is considered part of that component's logic
    const relevantEdgeIds = new Set<string>();
    edges.forEach((edge) => {
      if (relevantNodeIds.has(edge.source)) {
        relevantEdgeIds.add(edge.id);
      }
    });

    // 4. Aggregate Reviews
    let aggTotal = 0;
    let aggUnresolved = 0;
    const aggReviews: Review[] = [];

    const addForId = (id: string) => {
      const list = reviewsByTarget[id];
      if (list) {
        aggTotal += list.length;
        aggUnresolved += list.filter((r) => !r.resolved).length;
        aggReviews.push(...list);
      }
    };

    // Sum up Node reviews
    relevantNodeIds.forEach(addForId);
    // Sum up Edge reviews
    relevantEdgeIds.forEach(addForId);

    return { total: aggTotal, unresolved: aggUnresolved, reviews: aggReviews };
  }, [targetId, reviewsByTarget, nodes, edges]);

  return {
    reviewMode,
    reviews,
    total,
    unresolved,
  };
};
