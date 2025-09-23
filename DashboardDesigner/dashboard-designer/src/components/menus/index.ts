import type { NodeKind } from '../../domain/types';
import type { KindProps } from './common';
import { BaseMenu } from './common';

// kind-specific menus
import ButtonMenu from './ButtonMenu';
import type { JSX } from 'react';
import FilterMenu from './FilterMenu';
import ParameterMenu from './ParameterMenu';
import VisualizationMenu from './VisualizationMenu';
import DashboardMenu from './DashboardMenu';
import LegendMenu from './LegendMenu';
import TooltipMenu from './TooltipMenu';
// import DataActionMenu from './DataActionMenu';
import PlaceholderMenu from './PlaceholderMenu';

// Associates every component to its respective menu (Data action still has the Base Menu)
export const MENUS: Partial<Record<NodeKind, (p: KindProps) => JSX.Element>> = {
  Dashboard: DashboardMenu,
  Visualization: VisualizationMenu,
  Legend: LegendMenu,
  Tooltip: TooltipMenu,
  Filter: FilterMenu,
  Button: ButtonMenu,
  Parameter: ParameterMenu,
  DataAction: BaseMenu,
  Placeholder: PlaceholderMenu,
};

export type { KindProps };
