import type { CSSProperties } from 'react';
import type { NodeData } from '../../domain/types';

export type KindStyle = {
  card?: CSSProperties;
  header?: CSSProperties;
  footer?: CSSProperties;
};

export const KIND_STYLES: Partial<Record<NodeData['kind'], KindStyle>> = {
  Visualization: {
    card: { background: '#deebf7' },
  },
  Button: {
    card: { background: '#e7e6e6' },
  },
  Legend: {
    card: { background: '#e7e6e6' },
  },
  Parameter: {
    card: { background: '#e7e6e6' },
  },
  Filter: {
    card: { background: '#e7e6e6' },
  },
  Placeholder: {
    card: { background: '#e7e6e6' },
  },
  Dashboard: {
    card: { background: '#f5f5f5' },
  },
};
