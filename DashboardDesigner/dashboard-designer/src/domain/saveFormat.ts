import type { Edge, Node } from 'reactflow';
import type { NodeData, Review } from './types';

export const SAVE_VERSION = 1 as const;

export type ExportNode = {
  id: string;
  type: Node['type'];
  position: { x: number; y: number };
  data: NodeData;
  style?: { width?: number; height?: number };
  parentNode?: string;
  extent?: 'parent';
};

export type ExportEdge = Edge;

export type SaveFileV1 = {
  version: 1;
  createdAt: string;
  viewport: { x: number; y: number; zoom: number };
  nodes: ExportNode[];
  edges: ExportEdge[];
  review?: Review;
};

export type SaveFile = SaveFileV1;
