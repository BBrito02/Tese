import type { CSSProperties } from 'react';
import type { NodeData } from '../../domain/types';

export type KindStyle = {
  card?: CSSProperties;
  header?: CSSProperties;
  footer?: CSSProperties;
};

export const KIND_STYLES: Partial<Record<NodeData['kind'], KindStyle>> = {
  Visualization: {
    card: { background: '#cae3ffff' },
  },
  Button: {
    card: { background: '#d8d8d8ff' },
  },
  Legend: {
    card: { background: '#d8d8d8ff' },
  },
  Parameter: {
    card: { background: '#d8d8d8ff' },
  },
  Filter: {
    card: { background: '#d8d8d8ff' },
  },
  Placeholder: {
    card: { background: '#d8d8d8ff' },
  },
};
