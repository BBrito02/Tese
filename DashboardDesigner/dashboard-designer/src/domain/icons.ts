import type { VisualVariable, GraphType } from '../domain/types';

export const VISUAL_VAR_ICONS: Record<VisualVariable, string> = {
  Color: '/icons/visvar_color.png',
  Shape: '/icons/visvar_shape.png',
  Size: '/icons/visvar_size.png',
};

export const GRAPH_TYPE_ICONS: Record<GraphType, string> = {
  Dispersion: '/icons/graphtype_dispersion.png',
  Line: '/icons/graphtype_line.png',
  MultipleLines: '/icons/graphtype_multiplelines.png',
  Area: '/icons/graphtype_area.png',
  Bars: '/icons/graphtype_bars.png',
  PilledBars: '/icons/graphtype_piledbars.png',
  Pilled100: '/icons/graphtype_piled100.png',
  Gantt: '/icons/graphtype_gantt.png',
  Dots: '/icons/graphtype_dots.png',
  Map: '/icons/graphtype_map.png',
  ColorMap: '/icons/graphtype_colormap.png',
  Hexabin: '/icons/graphtype_hexabin.png',
  Text: '/icons/graphtype_text.png',
  Table: '/icons/graphtype_table.png',
  HeatMap: '/icons/graphtype_heatmap.png',
  Clock: '/icons/graphtype_clock.png',
};

export const activationIcons = {
  hover: '/icons/hover.png',
  click: '/icons/click.png',
} as const;

export type ActivationKey = keyof typeof activationIcons;
