import type { Edge, Node } from 'reactflow';
import type { NodeData } from './types';

export const SAVE_VERSION = 1 as const;

export type ExportNode = {
  id: string;
  type: Node['type']; // "class"
  position: { x: number; y: number }; // top-left in flow coords
  data: NodeData; // your discriminated payload
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
};

export type SaveFile = SaveFileV1; // future versions can union here
