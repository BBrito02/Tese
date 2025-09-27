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
};
